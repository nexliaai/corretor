import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const empresaId = params.id;

    // Buscar empresa
    const empresaResult = await pool.query(
      `SELECT id, razao_social, nome_fantasia, cnpj, email_principal, 
              telefone_principal, logradouro, numero, cidade, estado, ramo_atividade
       FROM empresas
       WHERE id = $1::uuid`,
      [empresaId]
    );

    if (empresaResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    const empresa = empresaResult.rows[0];

    // Buscar apólices
    const apolicesResult = await pool.query(
      `SELECT 
        id, numero_apolice, tipo_seguro, inicio_vigencia, fim_vigencia,
        preco_total, veiculo_modelo, veiculo_placa, seguradora_nome
       FROM apolice_auto
       WHERE empresa_id = $1::uuid
       ORDER BY data_emissao DESC`,
      [empresaId]
    );

    // Retornar empresa com apólices incluídas
    return NextResponse.json({
      ...empresa,
      apolices: apolicesResult.rows,
    });
  } catch (error: any) {
    console.error('Error fetching empresa:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch empresa' },
      { status: 500 }
    );
  }
}

