import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import minioClient, { bucketName } from '@/lib/minio';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id; // UUID é string

    // Get user files from database
    const filesResult = await pool.query(
      'SELECT caminho_minio FROM documentos WHERE user_id = $1::uuid',
      [userId]
    );

    // Delete files from MinIO
    for (const file of filesResult.rows) {
      try {
        await minioClient.removeObject(bucketName, file.caminho_minio);
      } catch (error) {
        console.error('Error deleting file from MinIO:', error);
      }
    }

    // Delete user (will cascade delete files in database)
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1::uuid RETURNING *',
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

