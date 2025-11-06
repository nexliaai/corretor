import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Buscar usuários com contagem de documentos
    const result = await pool.query(`
      SELECT 
        u.*,
        COUNT(d.id)::integer as document_count
      FROM users u
      LEFT JOIN documentos d ON u.id = d.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching users with stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

