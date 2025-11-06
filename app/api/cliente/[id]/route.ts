import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clienteId = params.id;

    // Buscar cliente
    const clienteResult = await pool.query(
      `SELECT id, name, email, phone, document, address, city, country, postal_code
       FROM users
       WHERE id = $1::uuid`,
      [clienteId]
    );

    if (clienteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    const cliente = clienteResult.rows[0];

    // Buscar apólices
    const apolicesResult = await pool.query(
      `SELECT 
        id, numero_apolice, tipo_seguro, inicio_vigencia, fim_vigencia,
        preco_total, veiculo_modelo, veiculo_placa, seguradora_nome
       FROM apolice_auto
       WHERE cliente_id = $1::uuid
       ORDER BY data_emissao DESC`,
      [clienteId]
    );

    return NextResponse.json({
      cliente,
      apolices: apolicesResult.rows,
    });
  } catch (error: any) {
    console.error('Error fetching cliente:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cliente' },
      { status: 500 }
    );
  }
}

