import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import minioClient, { bucketName } from '@/lib/minio';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'File and documentType are required' },
        { status: 400 }
      );
    }

    // Upload para MinIO
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const minioPath = `escopo_temp/${timestamp}_${sanitizedFileName}`;

    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
    }

    await minioClient.putObject(bucketName, minioPath, buffer, buffer.length, {
      'Content-Type': file.type,
    });

    // Criar/buscar usuário temporário "SISTEMA" para upload pendente
    let tempUserResult = await pool.query(
      `SELECT id FROM users WHERE document = 'SISTEMA_TEMP' LIMIT 1`
    );

    if (tempUserResult.rows.length === 0) {
      // Criar usuário temporário
      tempUserResult = await pool.query(
        `INSERT INTO users (first_name, last_name, email, document, phone, active)
         VALUES ('SISTEMA', 'TEMP', 'sistema@temp.corretor.local', 'SISTEMA_TEMP', '0000000000', false)
         RETURNING id`
      );
    }

    const tempUserId = tempUserResult.rows[0].id;

    // Salvar registro temporário no banco (com user_id temporário)
    const result = await pool.query(
      `INSERT INTO documentos (user_id, nome_arquivo, tipo, tamanho_bytes, caminho_minio, origem, metadata)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        tempUserId,
        file.name,
        file.type,
        file.size,
        minioPath,
        documentType,
        JSON.stringify({ 
          status: 'pending', 
          uploaded_at: new Date().toISOString(),
          ready_for_ai_processing: true,
          temp_upload: true
        }),
      ]
    );

    const documentId = result.rows[0].id;

    console.log('✅ Upload concluído. Documento ID:', documentId);
    console.log('📋 Pronto para processamento inteligente com OpenAI');

    return NextResponse.json({
      success: true,
      document_id: documentId,
      status: 'pending',
      message: 'Documento enviado. Processando com IA...',
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

