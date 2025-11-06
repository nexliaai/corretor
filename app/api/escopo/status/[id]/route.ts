import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    const result = await pool.query(
      'SELECT d.*, u.id as user_id, u.first_name, u.last_name, u.email, u.document FROM documentos d LEFT JOIN users u ON d.user_id = u.id WHERE d.id = $1::uuid',
      [documentId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const document = result.rows[0];
    const metadata = typeof document.metadata === 'string' 
      ? JSON.parse(document.metadata) 
      : document.metadata;

    let potentialClient = null;

    // Se encontrou um cliente real (não temporário)
    if (document.user_id && document.document !== 'SISTEMA_TEMP') {
      potentialClient = {
        id: document.user_id,
        first_name: document.first_name,
        last_name: document.last_name,
        email: document.email,
        document: document.document,
      };
    }

    return NextResponse.json({
      id: document.id,
      file_name: document.nome_arquivo,
      status: metadata?.status || 'processing',
      extracted_data: metadata?.extracted_data || null,
      potential_client: potentialClient,
      error_message: metadata?.error_message || null,
      started_at: metadata?.started_at || null,
      completed_at: metadata?.completed_at || null,
    });
  } catch (error) {
    console.error('Error fetching escopo status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}

