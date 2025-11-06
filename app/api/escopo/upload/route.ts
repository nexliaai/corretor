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
      throw new Error(`Webhook retornou erro: ${webhookResponse.status}`);
    }

    const webhookResult = await webhookResponse.json();
    console.log('✅ Webhook acionado com sucesso!');
    console.log('📦 Resposta do webhook:', webhookResult);

    return NextResponse.json({
      success: true,
      minio_path: minioPath,
      file_url: fileUrl,
      status: 'processing',
      message: 'Documento enviado para processamento via N8N',
      webhook_response: webhookResult,
    });
  } catch (error: any) {
    console.error('❌ Erro no upload/webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process document' },
      { status: 500 }
    );
  }
}

