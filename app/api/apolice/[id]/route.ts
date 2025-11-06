import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const apoliceId = params.id;

    const result = await pool.query(
      `SELECT 
        aa.*,
        e.razao_social as empresa_razao_social,
        e.nome_fantasia as empresa_nome_fantasia,
        e.cnpj as empresa_cnpj,
        e.email_principal as empresa_email,
        e.telefone_principal as empresa_telefone,
        CONCAT(e.logradouro, ', ', e.numero, ' - ', e.cidade, '/', e.estado) as empresa_endereco
       FROM apolice_auto aa
       LEFT JOIN empresas e ON aa.empresa_id = e.id
       WHERE aa.id = $1`,
      [apoliceId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Apólice não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching apolice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch apolice' },
      { status: 500 }
    );
  }
}

