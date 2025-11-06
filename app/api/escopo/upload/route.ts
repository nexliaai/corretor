import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import minioClient, { bucketName } from '@/lib/minio';

const WEBHOOK_URL = 'https://flows-whk.nexia.tec.br/webhook/929bd225-3de3-46f2-aadc-20ba514675f6';

export async function POST(request: Request) {
  try {
    console.log('🔧 Verificando variáveis de ambiente...');
    console.log('MINIO_ENDPOINT:', process.env.MINIO_ENDPOINT);
    console.log('MINIO_BUCKET_NAME:', process.env.MINIO_BUCKET_NAME);
    console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'File and documentType are required' },
        { status: 400 }
      );
    }

    console.log('📤 Iniciando upload e processamento via webhook...');
    console.log('📄 Arquivo:', file.name, 'Tamanho:', file.size, 'bytes');
    console.log('📋 Tipo:', documentType);

    // Upload para MinIO
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const minioPath = `escopo/temp/${timestamp}_${sanitizedFileName}`;

    console.log('🪣 Verificando bucket:', bucketName);
    
    try {
      const bucketExists = await minioClient.bucketExists(bucketName);
      console.log('✓ Bucket existe?', bucketExists);
      
      if (!bucketExists) {
        console.log('⚠️ Bucket não existe, criando...');
        await minioClient.makeBucket(bucketName, 'us-east-1');
        console.log('✓ Bucket criado');
      }
    } catch (bucketError: any) {
      console.error('❌ Erro ao verificar/criar bucket:', bucketError);
      throw new Error(`Erro no MinIO (bucket): ${bucketError.message}`);
    }

    console.log('📤 Enviando arquivo para MinIO:', minioPath);
    
    try {
      await minioClient.putObject(bucketName, minioPath, buffer, buffer.length, {
        'Content-Type': file.type,
      });
      console.log('✅ Arquivo enviado para MinIO');
    } catch (uploadError: any) {
      console.error('❌ Erro ao fazer upload para MinIO:', uploadError);
      throw new Error(`Erro no upload MinIO: ${uploadError.message}`);
    }

    // Gerar URL pré-assinada (válida por 2 horas)
    const fileUrl = await minioClient.presignedGetObject(
      bucketName,
      minioPath,
      2 * 60 * 60 // 2 horas
    );

    console.log('🔗 URL gerada para webhook');

    // Criar registro do documento (sem user_id - nullable)
    const docResult = await pool.query(
      `INSERT INTO documentos (nome_arquivo, tipo, tamanho_bytes, caminho_minio, origem, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        file.name,
        file.type,
        file.size,
        minioPath,
        documentType,
        JSON.stringify({ 
          status: 'processing_webhook', 
          uploaded_at: new Date().toISOString()
        }),
      ]
    );

    const documentId = docResult.rows[0].id;
    console.log('📝 Documento criado no banco. ID:', documentId);
    console.log('🌐 Enviando para webhook N8N...');

    // Enviar para webhook N8N
    const webhookPayload = {
      document_id: documentId,
      document_type: documentType,
      file_url: fileUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      minio_path: minioPath,
      timestamp: new Date().toISOString(),
    };

    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      console.error('❌ Webhook retornou status:', webhookResponse.status);
      throw new Error(`Webhook retornou erro: ${webhookResponse.status}`);
    }

    let webhookResult: any = {};
    let apoliceId: number | null = null;
    
    try {
      const responseText = await webhookResponse.text();
      console.log('📦 Resposta bruta do webhook:', responseText);
      
      // Tentar parsear como JSON
      try {
        webhookResult = JSON.parse(responseText);
        console.log('✅ Webhook retornou JSON:', JSON.stringify(webhookResult, null, 2));
        
        // N8N retorna um array com estrutura: [{ response: { body: 8, statusCode: 200 } }]
        if (Array.isArray(webhookResult) && webhookResult.length > 0) {
          const firstItem = webhookResult[0];
          if (firstItem.response && firstItem.response.body) {
            apoliceId = parseInt(firstItem.response.body);
            console.log('✅ Webhook N8N retornou ID da apólice:', apoliceId);
          }
        } 
        // Ou pode ser apenas o número diretamente
        else if (typeof webhookResult === 'number') {
          apoliceId = webhookResult;
          console.log('✅ Webhook retornou ID da apólice (número direto):', apoliceId);
        }
        // Ou pode ser uma string com o número
        else if (typeof webhookResult === 'string') {
          const parsed = parseInt(webhookResult.trim());
          if (!isNaN(parsed)) {
            apoliceId = parsed;
            console.log('✅ Webhook retornou ID da apólice (string):', apoliceId);
          }
        }
      } catch {
        // Se não for JSON, pode ser apenas o ID da apólice (número puro)
        const parsedNumber = parseInt(responseText.trim());
        if (!isNaN(parsedNumber)) {
          apoliceId = parsedNumber;
          console.log('✅ Webhook retornou ID da apólice (texto puro):', apoliceId);
        } else {
          console.warn('⚠️ Webhook retornou resposta inesperada:', responseText);
        }
      }
    } catch (parseError) {
      console.error('❌ Erro ao processar resposta do webhook:', parseError);
    }

    // Se o webhook retornou apenas o ID da apólice (resposta síncrona simplificada)
    if (apoliceId) {
      console.log('🎉 Webhook processou e retornou ID da apólice! Processamento concluído.');
      
      // Atualizar o documento com status de conclusão
      await pool.query(
        `UPDATE documentos 
         SET metadata = $1 
         WHERE id = $2::uuid`,
        [
          JSON.stringify({
            status: 'completed',
            completed_at: new Date().toISOString(),
            apolice_id: apoliceId,
          }),
          documentId
        ]
      );

      const responsePayload = {
        success: true,
        document_id: documentId,
        apolice_id: apoliceId,
        minio_path: minioPath,
        file_url: fileUrl,
        status: 'completed',
        message: 'Documento processado com sucesso! Apólice criada.',
      };
      
      console.log('📤 RETORNANDO PARA FRONTEND:', JSON.stringify(responsePayload, null, 2));
      
      return NextResponse.json(responsePayload);
    }
    
    // Verificar se o webhook retornou dados extraídos em formato JSON (resposta síncrona detalhada)
    if (webhookResult.extracted_data && webhookResult.status === 'completed') {
      console.log('🎉 Webhook retornou dados extraídos! Processamento síncrono.');
      
      // Atualizar o documento com os dados extraídos
      await pool.query(
        `UPDATE documentos 
         SET metadata = $1 
         WHERE id = $2::uuid`,
        [
          JSON.stringify({
            status: 'completed',
            completed_at: new Date().toISOString(),
            extracted_data: webhookResult.extracted_data,
            apolice_id: webhookResult.apolice_id || null,
          }),
          documentId
        ]
      );

      // Se o webhook identificou um cliente pelo CPF
      if (webhookResult.client_cpf) {
        const cleanCpf = webhookResult.client_cpf.replace(/\D/g, '');
        const existingClient = await pool.query(
          `SELECT id FROM users WHERE document = $1 LIMIT 1`,
          [cleanCpf]
        );

        if (existingClient.rows.length > 0) {
          const clientId = existingClient.rows[0].id;
          await pool.query(
            `UPDATE documentos SET user_id = $1::uuid WHERE id = $2::uuid`,
            [clientId, documentId]
          );
          console.log('✅ Documento vinculado ao cliente:', clientId);
        }
      }

      return NextResponse.json({
        success: true,
        document_id: documentId,
        apolice_id: webhookResult.apolice_id || null,
        minio_path: minioPath,
        file_url: fileUrl,
        status: 'completed',
        extracted_data: webhookResult.extracted_data,
        potential_client: webhookResult.client_cpf ? { cpf: webhookResult.client_cpf } : null,
        message: 'Documento processado com sucesso pelo N8N',
      });
    } else {
      // Webhook assíncrono - vai chamar o callback depois
      console.log('⏳ Webhook em modo assíncrono. Aguardando callback...');
      
      return NextResponse.json({
        success: true,
        document_id: documentId,
        minio_path: minioPath,
        file_url: fileUrl,
        status: 'processing',
        message: 'Documento enviado para processamento via N8N. Aguardando retorno...',
        webhook_response: webhookResult,
      });
    }
  } catch (error: any) {
    console.error('❌ Erro no upload/webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process document' },
      { status: 500 }
    );
  }
}

