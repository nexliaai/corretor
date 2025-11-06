import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import minioClient, { bucketName } from '@/lib/minio';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const apoliceId = params.id;

    // Buscar documento vinculado à apólice
    const result = await pool.query(
      `SELECT d.caminho_minio, d.nome_arquivo 
       FROM apolice_auto a
       JOIN documentos d ON d.id = a.documento_id
       WHERE a.id = $1`,
      [apoliceId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    const { caminho_minio, nome_arquivo } = result.rows[0];

    // Gerar URL pré-assinada (válida por 1 hora)
    const documentoUrl = await minioClient.presignedGetObject(
      bucketName,
      caminho_minio,
      60 * 60 // 1 hora
    );

    return NextResponse.json({
      documento_url: documentoUrl,
      nome_arquivo: nome_arquivo,
    });
  } catch (error: any) {
    console.error('Error fetching documento:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch documento' },
      { status: 500 }
    );
  }
}

