import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import minioClient, { bucketName } from '@/lib/minio';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fileName = searchParams.get('fileName');

    if (!userId || !fileName) {
      return NextResponse.json(
        { error: 'userId and fileName are required' },
        { status: 400 }
      );
    }

    // Get file info from database
    const result = await pool.query(
      'SELECT * FROM documentos WHERE user_id = $1::uuid AND nome_arquivo = $2',
      [userId, fileName]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const fileInfo = result.rows[0];

    // Get file from MinIO
    const stream = await minioClient.getObject(bucketName, fileInfo.caminho_minio);

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': fileInfo.tipo,
        'Content-Disposition': `attachment; filename="${fileInfo.nome_arquivo}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}

