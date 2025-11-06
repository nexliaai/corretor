import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import minioClient, { bucketName } from '@/lib/minio';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const origem = formData.get('origem') as string;
    const description = formData.get('description') as string;

    if (!file || !userId || !origem) {
      return NextResponse.json(
        { error: 'File, userId and origem are required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const minioPath = `user_${userId}/${timestamp}_${sanitizedFileName}`;

    // Ensure bucket exists
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
    }

    // Upload to MinIO
    await minioClient.putObject(bucketName, minioPath, buffer, buffer.length, {
      'Content-Type': file.type,
    });

    // Save to database with metadata
    const metadata = description ? { description } : null;
    
    const result = await pool.query(
      `INSERT INTO documentos (user_id, nome_arquivo, tipo, tamanho_bytes, caminho_minio, origem, metadata)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId, // UUID já vem como string
        file.name,
        file.type,
        file.size,
        minioPath,
        origem,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

