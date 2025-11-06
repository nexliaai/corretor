import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      document_id,
      status,
      extracted_data,
      error_message,
      client_cpf, // CPF do cliente extraído pelo N8N
    } = body;

    console.log('📥 Callback recebido do N8N');
    console.log('📄 Document ID:', document_id);
    console.log('📊 Status:', status);

    if (!document_id) {
      return NextResponse.json(
        { error: 'document_id is required' },
        { status: 400 }
      );
    }

    // Buscar o documento
    const docResult = await pool.query(
      'SELECT id, user_id FROM documentos WHERE id = $1::uuid',
      [document_id]
    );

    if (docResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    let finalUserId = docResult.rows[0].user_id;

    // Se o N8N extraiu um CPF, verificar se o cliente existe
    if (client_cpf && status === 'completed') {
      const cleanCpf = client_cpf.replace(/\D/g, '');
      console.log('🔍 Buscando cliente com CPF:', cleanCpf);

      const existingClient = await pool.query(
        `SELECT id FROM users WHERE document = $1 AND document != 'SISTEMA_TEMP' LIMIT 1`,
        [cleanCpf]
      );

      if (existingClient.rows.length > 0) {
        finalUserId = existingClient.rows[0].id;
        console.log('✅ Cliente existente encontrado! ID:', finalUserId);
        
        // Atualizar o documento para vincular ao cliente correto
        await pool.query(
          `UPDATE documentos SET user_id = $1::uuid WHERE id = $2::uuid`,
          [finalUserId, document_id]
        );
      }
    }

    // Atualizar metadata do documento
    const metadata = {
      status: status || 'completed',
      completed_at: new Date().toISOString(),
      extracted_data: extracted_data || null,
      error_message: error_message || null,
    };

    await pool.query(
      `UPDATE documentos SET metadata = $1 WHERE id = $2::uuid`,
      [JSON.stringify(metadata), document_id]
    );

    console.log('✅ Documento atualizado com sucesso!');

    return NextResponse.json({
      success: true,
      message: 'Callback processado com sucesso',
      user_id: finalUserId,
    });
  } catch (error: any) {
    console.error('❌ Erro no callback:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process callback' },
      { status: 500 }
    );
  }
}
