import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Buscar todas as tabelas
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tables = [];

    for (const row of tablesResult.rows) {
      const tableName = row.table_name;

      // Buscar colunas da tabela
      const columnsResult = await pool.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      tables.push({
        table_name: tableName,
        columns: columnsResult.rows,
      });
    }

    return NextResponse.json({ tables });
  } catch (error: any) {
    console.error('Error fetching schema:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch schema' },
      { status: 500 }
    );
  }
}

