import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  let document_id: string | undefined;

  try {
    const body = await request.json();
    document_id = body.document_id;
    const { user_id, extracted_data, document_type } = body;

    if (!document_id || !user_id || !extracted_data) {
      return NextResponse.json(
        { error: 'document_id, user_id, and extracted_data are required' },
        { status: 400 }
      );
    }

    console.log('✅ Confirmando dados revisados para documento:', document_id);

    // Atualizar documento com status completed e vincular ao usuário
    const metadata = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      extracted_data,
      processed_by: 'openai',
      reviewed_by: 'user',
      model: 'gpt-4o',
    };

    await pool.query(
      'UPDATE documentos SET user_id = $1, metadata = $2 WHERE id = $3',
      [user_id, JSON.stringify(metadata), document_id]
    );

    console.log('✅ Documento vinculado ao cliente:', user_id);

    // Atualizar dados do cliente se fornecidos
    if (extracted_data.dados_pessoais) {
      const { email, telefone, endereco, cidade, cep } = extracted_data.dados_pessoais;
      
      await pool.query(
        `UPDATE users 
         SET email = COALESCE($1, email),
             phone = COALESCE($2, phone),
             city = COALESCE($3, city)
         WHERE id = $4`,
        [email, telefone, cidade, user_id]
      );

      console.log('✅ Dados do cliente atualizados');
    }

    // Se for apólice auto, salvar na tabela específica
    let apoliceId = null;
    if (document_type === 'apolice_auto' && extracted_data.dados_documento) {
      apoliceId = await saveApoliceAuto(document_id, user_id, extracted_data);
    }

    return NextResponse.json({
      success: true,
      document_id,
      user_id,
      apolice_id: apoliceId,
      message: 'Dados confirmados e salvos com sucesso',
    });
  } catch (error: any) {
    console.error('❌ Erro ao confirmar dados:', error);

    // Tentar atualizar status do documento para error
    if (document_id) {
      try {
        await pool.query(
          'UPDATE documentos SET metadata = jsonb_set(COALESCE(metadata, \'{}\'::jsonb), \'{status}\', \'"error"\') WHERE id = $1',
          [document_id]
        );
      } catch (updateError) {
        console.error('Erro ao atualizar status de erro:', updateError);
      }
    }

    return NextResponse.json(
      {
        error: error.message || 'Erro ao confirmar dados',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

async function saveApoliceAuto(documentId: string, userId: string, extractedData: any) {
  console.log('📋 Salvando dados da apólice auto...');

  const doc = extractedData.dados_documento || {};
  const pessoal = extractedData.dados_pessoais || {};
  const coberturas = doc.coberturas || {};
  const franquias = doc.franquias || {};

  // Limpar CPF/CNPJ
  const cleanCpf = (str: string) => str ? str.replace(/\D/g, '') : null;

  // Verificar se é empresa (CNPJ tem 14 dígitos)
  const cpfCnpj = cleanCpf(doc.cnpj) || '';
  const isEmpresa = cpfCnpj.length === 14;
  
  // Se for empresa, buscar o ID da empresa
  let empresaId = null;
  if (isEmpresa) {
    const empresaResult = await pool.query(
      'SELECT id FROM empresas WHERE cnpj = $1 LIMIT 1',
      [cpfCnpj]
    );
    if (empresaResult.rows.length > 0) {
      empresaId = empresaResult.rows[0].id;
      console.log('✅ Empresa encontrada:', empresaId);
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO apolice_auto (
        documento_id,
        cliente_id,
        empresa_id,
        numero_apolice,
        numero_endosso,
        data_emissao,
        inicio_vigencia,
        fim_vigencia,
        segurado_nome,
        segurado_cnpj,
        telefone,
        email,
        endereco,
        condutor_nome,
        condutor_cpf,
        condutor_idade,
        condutor_estado_civil,
        veiculo_modelo,
        veiculo_placa,
        veiculo_chassi,
        veiculo_ano_modelo,
        veiculo_fipe_codigo,
        categoria_risco,
        casco_premio,
        rcf_danos_materiais_premio,
        rcf_danos_corporais_premio,
        rcf_danos_morais_premio,
        carta_verde_materiais_premio,
        carta_verde_corporais_premio,
        app_morte_premio,
        app_invalidez_premio,
        assistencia_premio,
        vidros_premio,
        carro_reserva_premio,
        franquia_valor,
        preco_total,
        atualizado_em
      ) VALUES (
        $1::uuid, $2::uuid, $3::uuid, $4, $5, CURRENT_DATE, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
        $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, CURRENT_TIMESTAMP
      )
      ON CONFLICT (documento_id) 
      DO UPDATE SET
        cliente_id = EXCLUDED.cliente_id,
        empresa_id = EXCLUDED.empresa_id,
        numero_apolice = EXCLUDED.numero_apolice,
        numero_endosso = EXCLUDED.numero_endosso,
        inicio_vigencia = EXCLUDED.inicio_vigencia,
        fim_vigencia = EXCLUDED.fim_vigencia,
        segurado_nome = EXCLUDED.segurado_nome,
        segurado_cnpj = EXCLUDED.segurado_cnpj,
        telefone = EXCLUDED.telefone,
        email = EXCLUDED.email,
        endereco = EXCLUDED.endereco,
        condutor_nome = EXCLUDED.condutor_nome,
        condutor_cpf = EXCLUDED.condutor_cpf,
        condutor_idade = EXCLUDED.condutor_idade,
        condutor_estado_civil = EXCLUDED.condutor_estado_civil,
        veiculo_modelo = EXCLUDED.veiculo_modelo,
        veiculo_placa = EXCLUDED.veiculo_placa,
        veiculo_chassi = EXCLUDED.veiculo_chassi,
        veiculo_ano_modelo = EXCLUDED.veiculo_ano_modelo,
        veiculo_fipe_codigo = EXCLUDED.veiculo_fipe_codigo,
        categoria_risco = EXCLUDED.categoria_risco,
        casco_premio = EXCLUDED.casco_premio,
        rcf_danos_materiais_premio = EXCLUDED.rcf_danos_materiais_premio,
        rcf_danos_corporais_premio = EXCLUDED.rcf_danos_corporais_premio,
        rcf_danos_morais_premio = EXCLUDED.rcf_danos_morais_premio,
        carta_verde_materiais_premio = EXCLUDED.carta_verde_materiais_premio,
        carta_verde_corporais_premio = EXCLUDED.carta_verde_corporais_premio,
        app_morte_premio = EXCLUDED.app_morte_premio,
        app_invalidez_premio = EXCLUDED.app_invalidez_premio,
        assistencia_premio = EXCLUDED.assistencia_premio,
        vidros_premio = EXCLUDED.vidros_premio,
        carro_reserva_premio = EXCLUDED.carro_reserva_premio,
        franquia_valor = EXCLUDED.franquia_valor,
        preco_total = EXCLUDED.preco_total,
        atualizado_em = CURRENT_TIMESTAMP
      RETURNING id`,
      [
        documentId,
        isEmpresa ? null : userId,
        empresaId,
        doc.apolice_numero,
        doc.endosso_numero,
        doc.data_vigencia_inicio,
        doc.data_vigencia_fim,
        doc.segurado,
        cpfCnpj,
        pessoal.telefone,
        pessoal.email,
        pessoal.endereco,
        doc.condutor_principal_nome,
        cleanCpf(doc.condutor_principal_cpf),
        doc.condutor_principal_idade,
        doc.condutor_principal_estado_civil,
        doc.veiculo_marca_modelo,
        doc.veiculo_placa,
        doc.veiculo_chassi,
        doc.veiculo_ano_modelo,
        doc.veiculo_codigo_fipe,
        doc.categoria_risco,
        coberturas.casco_basica_compreensiva,
        coberturas.rcf_danos_materiais,
        coberturas.rcf_danos_corporais,
        coberturas.rcf_danos_morais_esteticos,
        coberturas.carta_verde_danos_materiais,
        coberturas.carta_verde_danos_corporais,
        coberturas.app_morte,
        coberturas.app_invalidez_permanente,
        coberturas.assistencia_24h,
        coberturas.vidros,
        coberturas.carro_reserva_30_dias,
        franquias['50_porcento_da_normal'],
        doc.premio_total,
      ]
    );

    const apoliceId = result.rows[0].id;
    console.log('✅ Apólice Auto salva com sucesso! ID:', apoliceId);
    return apoliceId;
  } catch (error) {
    console.error('❌ Erro ao salvar apólice auto:', error);
    throw error;
  }
}

