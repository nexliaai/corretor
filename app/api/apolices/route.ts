import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('clienteId');

    if (!clienteId) {
      return NextResponse.json(
        { error: 'clienteId is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT * FROM apolice_auto 
       WHERE cliente_id = $1::uuid 
       ORDER BY data_registro DESC`,
      [clienteId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching apolices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch apolices' },
      { status: 500 }
    );
  }
}

