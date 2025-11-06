import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import minioClient, { bucketName } from '@/lib/minio';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = parseInt(params.id);

    if (isNaN(fileId)) {
      return NextResponse.json(
        { error: 'Invalid file ID' },
        { status: 400 }
      );
    }

    // Get file info from database
    const result = await pool.query(
      'SELECT * FROM documentos WHERE id = $1',
      [fileId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const fileInfo = result.rows[0];

    // Delete from MinIO
    try {
      await minioClient.removeObject(bucketName, fileInfo.caminho_minio);
    } catch (error) {
      console.error('Error deleting file from MinIO:', error);
    }

    // Delete from database
    await pool.query('DELETE FROM documentos WHERE id = $1', [fileId]);

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}

