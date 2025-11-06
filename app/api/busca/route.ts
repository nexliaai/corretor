import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const cleanQuery = query.replace(/\D/g, '');

    // Buscar por número de apólice primeiro
    const apoliceResult = await pool.query(
      `SELECT 
        a.id as apolice_id,
        a.numero_apolice,
        a.cliente_id,
        a.empresa_id,
        u.id as user_id,
        u.name as user_name,
        u.document as user_document,
        u.email as user_email,
        u.phone as user_phone,
        e.id as empresa_id_ref,
        e.razao_social,
        e.nome_fantasia,
        e.cnpj
       FROM apolice_auto a
       LEFT JOIN users u ON a.cliente_id = u.id
       LEFT JOIN empresas e ON a.empresa_id = e.id
       WHERE a.numero_apolice LIKE $1
       LIMIT 5`,
      [`%${query}%`]
    );

    // Se encontrou pela apólice, retornar o cliente/empresa
    if (apoliceResult.rows.length > 0) {
      const results = apoliceResult.rows.map((row) => {
        if (row.user_id) {
          return {
            type: 'user' as const,
            id: row.user_id,
            name: row.user_name,
            document: row.user_document,
            email: row.user_email,
            phone: row.user_phone,
            document_count: 0,
            apolices_count: 1,
            found_by: `Apólice ${row.numero_apolice}`,
          };
        } else if (row.empresa_id_ref) {
          return {
            type: 'empresa' as const,
            id: row.empresa_id_ref,
            name: row.nome_fantasia || row.razao_social,
            document: row.cnpj,
            email: null,
            phone: null,
            document_count: 0,
            apolices_count: 1,
            found_by: `Apólice ${row.numero_apolice}`,
          };
        }
        return null;
      }).filter(Boolean);

      return NextResponse.json({ results });
    }

    // Buscar em users por CPF/CNPJ
    const usersResult = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.document,
        u.email,
        u.phone,
        COUNT(DISTINCT d.id) as document_count,
        COUNT(DISTINCT a.id) as apolices_count
       FROM users u
       LEFT JOIN documentos d ON d.user_id = u.id
       LEFT JOIN apolice_auto a ON a.cliente_id = u.id
       WHERE u.document LIKE $1
       GROUP BY u.id, u.name, u.document, u.email, u.phone
       LIMIT 10`,
      [`%${cleanQuery}%`]
    );

    // Buscar em empresas por CNPJ
    const empresasResult = await pool.query(
      `SELECT 
        e.id,
        e.razao_social as name,
        e.nome_fantasia,
        e.cnpj as document,
        e.email_principal as email,
        e.telefone_principal as phone,
        COUNT(DISTINCT d.id) as document_count,
        COUNT(DISTINCT a.id) as apolices_count
       FROM empresas e
       LEFT JOIN documentos d ON d.empresa_id = e.id
       LEFT JOIN apolice_auto a ON a.empresa_id = e.id
       WHERE e.cnpj LIKE $1
       GROUP BY e.id, e.razao_social, e.nome_fantasia, e.cnpj, e.email_principal, e.telefone_principal
       LIMIT 10`,
      [`%${cleanQuery}%`]
    );

    const results = [
      ...usersResult.rows.map((u) => ({
        type: 'user' as const,
        id: u.id,
        name: u.name,
        document: u.document,
        email: u.email,
        phone: u.phone,
        document_count: parseInt(u.document_count) || 0,
        apolices_count: parseInt(u.apolices_count) || 0,
        found_by: null,
      })),
      ...empresasResult.rows.map((e) => ({
        type: 'empresa' as const,
        id: e.id,
        name: e.nome_fantasia || e.name,
        document: e.document,
        email: e.email,
        phone: e.phone,
        document_count: parseInt(e.document_count) || 0,
        apolices_count: parseInt(e.apolices_count) || 0,
        found_by: null,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search' },
      { status: 500 }
    );
  }
}

