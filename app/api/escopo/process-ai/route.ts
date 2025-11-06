import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import pool from '@/lib/db';
import minioClient, { bucketName } from '@/lib/minio';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  let document_id: string | undefined;
  
  try {
    const body = await request.json();
    document_id = body.document_id;

    if (!document_id) {
      return NextResponse.json(
        { error: 'document_id is required' },
        { status: 400 }
      );
    }

    console.log('🤖 Iniciando processamento com OpenAI para documento:', document_id);

    // Buscar informações do documento
    const docResult = await pool.query(
      'SELECT user_id, caminho_minio, tipo, origem FROM documentos WHERE id = $1',
      [document_id]
    );

    if (docResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const { user_id: userId, caminho_minio, tipo, origem } = docResult.rows[0];

    // Baixar arquivo do MinIO
    console.log('📥 Baixando arquivo do MinIO:', caminho_minio);
    const dataStream = await minioClient.getObject(bucketName, caminho_minio);
    
    // Converter stream para buffer
    const chunks: any[] = [];
    for await (const chunk of dataStream) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    console.log('🔍 Analisando documento com OpenAI...');
    console.log('📄 Tipo de documento:', origem);
    console.log('📦 Tamanho:', (fileBuffer.length / 1024).toFixed(2), 'KB');

    const mimeType = tipo || 'application/pdf';
    const isPdf = mimeType === 'application/pdf' || caminho_minio.endsWith('.pdf');

    // Criar prompt específico baseado no tipo de documento
    const prompt = getPromptForDocumentType(origem);

    let response;

    if (isPdf) {
      // Para PDFs, usar o recurso de upload de arquivo do OpenAI
      console.log('📄 Processando PDF com OpenAI...');
      
      // Criar File object do buffer
      const pdfFile = new File([fileBuffer], caminho_minio.split('/').pop() || 'documento.pdf', {
        type: 'application/pdf',
      });

      // Upload do arquivo para OpenAI
      console.log('📤 Fazendo upload do PDF para OpenAI...');
      const file = await openai.files.create({
        file: pdfFile,
        purpose: 'assistants',
      });

      console.log('✅ PDF enviado para OpenAI. File ID:', file.id);

      // Usar Assistant API com file search
      const assistant = await openai.beta.assistants.create({
        name: 'Extrator de Apólices',
        instructions: `Você é um assistente especializado em extrair dados estruturados de documentos de seguros.
Retorne SEMPRE um JSON válido com os dados extraídos do PDF.
Se não encontrar algum campo, deixe como null.
Para valores monetários, use números sem símbolos (ex: 1500.50).
Para datas, use formato YYYY-MM-DD.
Para booleanos, use true/false.`,
        model: 'gpt-4o',
        tools: [{ type: 'file_search' }],
      });

      const thread = await openai.beta.threads.create({
        messages: [
          {
            role: 'user',
            content: prompt,
            attachments: [{ file_id: file.id, tools: [{ type: 'file_search' }] }],
          },
        ],
      });

      const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: assistant.id,
      });

      const messages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data[0];
      
      let extractedText = '';
      if (lastMessage.content[0].type === 'text') {
        extractedText = lastMessage.content[0].text.value;
      }

      console.log('✅ OpenAI processou o PDF');

      // Cleanup
      await openai.files.delete(file.id);
      await openai.beta.assistants.delete(assistant.id);

      // Retornar resposta no formato esperado
      response = { choices: [{ message: { content: extractedText } }] };
    } else {
      // Para imagens, usar Vision API
      console.log('🖼️ Processando imagem com Vision...');
      const base64File = fileBuffer.toString('base64');

      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente especializado em extrair dados estruturados de documentos de seguros.
Retorne SEMPRE um JSON válido com os dados extraídos.
Se não encontrar algum campo, deixe como null.
Para valores monetários, use números sem símbolos (ex: 1500.50).
Para datas, use formato YYYY-MM-DD.
Para booleanos, use true/false.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64File}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      });
    }

    const extractedText = response.choices[0].message.content || '';
    console.log('✅ OpenAI respondeu com sucesso');

    // Tentar parsear JSON da resposta
    let extractedData;
    try {
      console.log('🔍 Extraindo JSON da resposta...');
      let jsonText = extractedText;
      
      // Se tem markdown code block, extrair apenas o conteúdo
      const jsonMatch = extractedText.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
        console.log('✂️ JSON extraído do markdown code block');
      }
      
      // Remover referências de fonte (ex: 【4:2†source】)
      jsonText = jsonText.replace(/【[^】]*】/g, '');
      
      // Encontrar o início do JSON (primeiro {)
      const firstBraceIndex = jsonText.indexOf('{');
      if (firstBraceIndex !== -1) {
        jsonText = jsonText.substring(firstBraceIndex);
      }
      
      // Encontrar o fim do JSON (último } válido)
      const lastBraceIndex = jsonText.lastIndexOf('}');
      if (lastBraceIndex !== -1) {
        jsonText = jsonText.substring(0, lastBraceIndex + 1);
      }
      
      extractedData = JSON.parse(jsonText);
      console.log('📊 Dados extraídos com sucesso');
    } catch (error) {
      console.error('❌ Erro ao parsear JSON da OpenAI:', error);
      console.log('Resposta bruta (primeiros 500 chars):', extractedText.substring(0, 500));
      throw new Error('Failed to parse AI response as JSON');
    }

    // Salvar resultado no metadata do documento como "pending_review"
    const metadata = {
      status: 'pending_review',
      extracted_at: new Date().toISOString(),
      extracted_data: extractedData,
      processed_by: 'openai',
      model: 'gpt-4o',
    };

    await pool.query(
      'UPDATE documentos SET metadata = $1 WHERE id = $2',
      [JSON.stringify(metadata), document_id]
    );

    // Buscar ou identificar cliente potencial baseado nos dados extraídos
    let potentialClient = null;
    const cpfCnpj = extractedData?.dados_documento?.cnpj || extractedData?.apolice?.segurado_cnpj || extractedData?.dados_pessoais?.document;
    
    if (cpfCnpj) {
      const cleanedCpf = cpfCnpj.replace(/\D/g, '');
      console.log('🔍 Buscando cliente com CPF/CNPJ:', cleanedCpf);
      
      const clientResult = await pool.query(
        'SELECT id, first_name, last_name, email, document FROM users WHERE document = $1',
        [cleanedCpf]
      );
      
      if (clientResult.rows.length > 0) {
        potentialClient = clientResult.rows[0];
        console.log('✅ Cliente existente encontrado:', potentialClient.first_name);
      }
    }

    // Retornar dados para revisão (NÃO salvar ainda)
    return NextResponse.json({
      success: true,
      document_id,
      extracted_data: extractedData,
      potential_client: potentialClient,
      needs_review: true,
    });
  } catch (error: any) {
    console.error('❌ Erro no processamento com OpenAI:', error);
    
    // Atualizar documento com erro (document_id já foi extraído no início)
    try {
      if (document_id) {
        await pool.query(
          'UPDATE documentos SET metadata = $1 WHERE id = $2',
          [
            JSON.stringify({
              status: 'error',
              error_message: error.message,
              completed_at: new Date().toISOString(),
            }),
            document_id,
          ]
        );
      }
    } catch (updateError) {
      console.error('Erro ao atualizar documento com erro:', updateError);
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process document' },
      { status: 500 }
    );
  }
}

function getPromptForDocumentType(documentType: string): string {
  const basePrompt = `Analise este documento e extraia TODOS os dados em formato JSON.`;

  switch (documentType) {
    case 'apolice':
      return `${basePrompt}

RETORNE um JSON com esta estrutura EXATA:
{
  "dados_pessoais": {
    "email": "string ou null",
    "telefone": "string ou null",
    "endereco": "string ou null",
    "numero": "string ou null",
    "complemento": "string ou null",
    "cep": "string ou null",
    "cidade": "string ou null",
    "pais": "string ou null"
  },
  "apolice": {
    "numero_apolice": "string",
    "numero_endosso": "string ou null",
    "proposta_numero": "string ou null",
    "susep_processo": "string ou null",
    "tipo_seguro": "string",
    "data_emissao": "YYYY-MM-DD",
    "inicio_vigencia": "YYYY-MM-DD",
    "fim_vigencia": "YYYY-MM-DD",
    "condicoes_gerais": "string ou null",
    
    "segurado_nome": "string",
    "segurado_cnpj": "string",
    "telefone": "string ou null",
    "email": "string ou null",
    "endereco": "string ou null",
    
    "condutor_nome": "string ou null",
    "condutor_cpf": "string ou null",
    "condutor_idade": number ou null,
    "condutor_estado_civil": "string ou null",
    "condutor_residencia": "string ou null",
    "condutores_18_25": boolean ou null,
    
    "veiculo_modelo": "string ou null",
    "veiculo_placa": "string ou null",
    "veiculo_ano_modelo": "string ou null",
    "veiculo_chassi": "string ou null",
    "veiculo_fipe_codigo": "string ou null",
    "veiculo_zero_km": boolean ou null,
    "categoria_risco": "string ou null",
    "finalidade_uso": "string ou null",
    "cep_pernoite": "string ou null",
    "kit_gas": boolean ou null,
    
    "casco_fipe_percent": number ou null,
    "casco_premio": number ou null,
    "rcf_danos_materiais": number ou null,
    "rcf_danos_materiais_premio": number ou null,
    "rcf_danos_corporais": number ou null,
    "rcf_danos_corporais_premio": number ou null,
    "rcf_danos_morais": number ou null,
    "rcf_danos_morais_premio": number ou null,
    "app_morte": number ou null,
    "app_morte_premio": number ou null,
    "app_invalidez": number ou null,
    "app_invalidez_premio": number ou null,
    "carta_verde_materiais_usd": number ou null,
    "carta_verde_materiais_premio": number ou null,
    "carta_verde_corporais_usd": number ou null,
    "carta_verde_corporais_premio": number ou null,
    
    "assistencia_plano": "string ou null",
    "assistencia_premio": number ou null,
    "vidros_plano": "string ou null",
    "vidros_premio": number ou null,
    "carro_reserva_dias": number ou null,
    "carro_reserva_premio": number ou null,
    
    "franquia_tipo": "string ou null",
    "franquia_valor": number ou null,
    
    "preco_liquido": number ou null,
    "preco_total": number ou null,
    "iof": number ou null,
    "forma_pagamento": "string ou null",
    "parcelas": number ou null,
    "valor_parcela": number ou null,
    
    "corretor_nome": "string ou null",
    "corretor_email": "string ou null",
    "corretor_telefone": "string ou null",
    "corretor_codigo": "string ou null",
    "corretor_susep": "string ou null",
    "corretor_filial": "string ou null",
    
    "seguradora_nome": "string ou null",
    "seguradora_cnpj": "string ou null",
    "seguradora_codigo": "string ou null",
    "seguradora_ie": "string ou null",
    "seguradora_endereco": "string ou null",
    "seguradora_telefones": "string ou null",
    "seguradora_sac": "string ou null",
    "seguradora_ouvidoria": "string ou null",
    "seguradora_pcd": "string ou null",
    "seguradora_presidente": "string ou null",
    "seguradora_local_emissao": "string ou null"
  }
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.`;

    default:
      return `${basePrompt}

Extraia todos os dados possíveis e retorne em formato JSON com a seguinte estrutura:
{
  "dados_pessoais": {
    "email": "string ou null",
    "telefone": "string ou null",
    "endereco": "string ou null",
    "cidade": "string ou null",
    "cep": "string ou null"
  },
  "dados_documento": {
    // Adicione aqui todos os campos relevantes encontrados no documento
  }
}`;
  }
}

async function processExtractedDataSmart(
  tempUserId: string,
  documentId: string,
  documentType: string,
  extractedData: any
): Promise<string> {
  console.log('🔄 Processamento inteligente iniciado...');

  // 1. Extrair CPF do documento
  let clientCpf = null;
  if (extractedData.apolice?.segurado_cnpj) {
    clientCpf = extractedData.apolice.segurado_cnpj.replace(/\D/g, ''); // Limpar
  } else if (extractedData.dados_pessoais?.document) {
    clientCpf = extractedData.dados_pessoais.document.replace(/\D/g, '');
  }

  if (!clientCpf) {
    console.log('⚠️ CPF não encontrado no documento. Usando usuário temporário.');
    return tempUserId;
  }

  console.log('📋 CPF extraído:', clientCpf);

  // 2. Buscar cliente existente pelo CPF
  const existingUserResult = await pool.query(
    `SELECT id FROM users WHERE document = $1 AND document != 'SISTEMA_TEMP' LIMIT 1`,
    [clientCpf]
  );

  let finalUserId: string;

  if (existingUserResult.rows.length > 0) {
    // Cliente JÁ EXISTE!
    finalUserId = existingUserResult.rows[0].id;
    console.log('✅ Cliente encontrado! ID:', finalUserId);
    console.log('🔗 Vinculando documento ao cliente existente...');
  } else {
    // Cliente NÃO existe - CRIAR NOVO
    console.log('🆕 Cliente não existe. Criando novo...');
    
    const clientName = extractedData.apolice?.segurado_nome || extractedData.dados_pessoais?.nome || 'Cliente';
    const nameParts = clientName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;
    
    const clientEmail = extractedData.dados_pessoais?.email || extractedData.apolice?.email || `${clientCpf}@temp.corretor.local`;
    const clientPhone = extractedData.dados_pessoais?.telefone || extractedData.apolice?.telefone || '0000000000';

    const newUserResult = await pool.query(
      `INSERT INTO users (first_name, last_name, email, document, phone, active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id`,
      [firstName, lastName, clientEmail, clientCpf, clientPhone]
    );

    finalUserId = newUserResult.rows[0].id;
    console.log('✅ Novo cliente criado! ID:', finalUserId);
  }

  // 3. Atualizar documento com o user_id correto
  await pool.query(
    `UPDATE documentos SET user_id = $1::uuid WHERE id = $2`,
    [finalUserId, documentId]
  );
  console.log('✅ Documento vinculado ao cliente');

  // 4. Atualizar dados do cliente (sempre atualiza com novos dados do documento)
  if (extractedData.dados_pessoais) {
    await updateClientData(finalUserId, extractedData.dados_pessoais);
  }

  // 5. Salvar na tabela específica (apólice_auto, etc)
  if (documentType === 'apolice_auto' && extractedData.apolice) {
    console.log('📋 Salvando dados da apólice auto...');
    await saveApoliceAuto(finalUserId, documentId, extractedData.apolice);
  }

  return finalUserId;
}

async function updateClientData(userId: string, dados: any) {
  console.log('🔄 Atualizando dados do cliente:', userId);

  const updateFields = [];
  const updateValues = [];
  let paramCounter = 1;

  if (dados.email && !dados.email.includes('@temp.corretor.local')) {
    updateFields.push(`email = $${paramCounter++}`);
    updateValues.push(dados.email);
  }

  if (dados.telefone) {
    updateFields.push(`phone = $${paramCounter++}`);
    updateValues.push(dados.telefone);
  }

  if (dados.endereco) {
    updateFields.push(`address = $${paramCounter++}`);
    updateValues.push(dados.endereco);
  }

  if (dados.numero) {
    updateFields.push(`number = $${paramCounter++}`);
    updateValues.push(dados.numero);
  }

  if (dados.complemento) {
    updateFields.push(`address_extra = $${paramCounter++}`);
    updateValues.push(dados.complemento);
  }

  if (dados.cep) {
    updateFields.push(`postal_code = $${paramCounter++}`);
    updateValues.push(dados.cep);
  }

  if (dados.cidade) {
    updateFields.push(`city = $${paramCounter++}`);
    updateValues.push(dados.cidade);
  }

  if (dados.pais) {
    updateFields.push(`country = $${paramCounter++}`);
    updateValues.push(dados.pais);
  }

  updateFields.push(`updated_at = NOW()`);

  if (updateFields.length > 1) {
    updateValues.push(userId);
    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCounter}::uuid
      RETURNING *
    `;

    await pool.query(updateQuery, updateValues);
    console.log('✅ Cliente atualizado com sucesso!');
  }
}

async function saveApoliceAuto(userId: string, documentId: string, apoliceData: any) {
  try {
    const query = `
      INSERT INTO apolice_auto (
        cliente_id, documento_id,
        numero_apolice, numero_endosso, proposta_numero, susep_processo,
        tipo_seguro, data_emissao, inicio_vigencia, fim_vigencia, condicoes_gerais,
        segurado_nome, segurado_cnpj, telefone, email, endereco,
        condutor_nome, condutor_cpf, condutor_idade, condutor_estado_civil,
        condutor_residencia, condutores_18_25,
        veiculo_modelo, veiculo_placa, veiculo_ano_modelo, veiculo_chassi,
        veiculo_fipe_codigo, veiculo_zero_km, categoria_risco, finalidade_uso,
        cep_pernoite, kit_gas,
        casco_fipe_percent, casco_premio,
        rcf_danos_materiais, rcf_danos_materiais_premio,
        rcf_danos_corporais, rcf_danos_corporais_premio,
        rcf_danos_morais, rcf_danos_morais_premio,
        app_morte, app_morte_premio,
        app_invalidez, app_invalidez_premio,
        carta_verde_materiais_usd, carta_verde_materiais_premio,
        carta_verde_corporais_usd, carta_verde_corporais_premio,
        assistencia_plano, assistencia_premio,
        vidros_plano, vidros_premio,
        carro_reserva_dias, carro_reserva_premio,
        franquia_tipo, franquia_valor,
        preco_liquido, preco_total, iof,
        forma_pagamento, parcelas, valor_parcela,
        corretor_nome, corretor_email, corretor_telefone,
        corretor_codigo, corretor_susep, corretor_filial,
        seguradora_nome, seguradora_cnpj, seguradora_codigo,
        seguradora_ie, seguradora_endereco, seguradora_telefones,
        seguradora_sac, seguradora_ouvidoria, seguradora_pcd,
        seguradora_presidente, seguradora_local_emissao
      ) VALUES (
        $1::uuid, $2,
        $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18, $19, $20,
        $21, $22,
        $23, $24, $25, $26,
        $27, $28, $29, $30,
        $31, $32,
        $33, $34,
        $35, $36,
        $37, $38,
        $39, $40,
        $41, $42,
        $43, $44,
        $45, $46,
        $47, $48,
        $49, $50,
        $51, $52,
        $53, $54,
        $55, $56,
        $57, $58, $59,
        $60, $61, $62,
        $63, $64, $65,
        $66, $67, $68,
        $69, $70, $71,
        $72, $73, $74,
        $75, $76
      )
      RETURNING id
    `;

    const values = [
      userId,
      documentId,
      apoliceData.numero_apolice,
      apoliceData.numero_endosso,
      apoliceData.proposta_numero,
      apoliceData.susep_processo,
      apoliceData.tipo_seguro,
      apoliceData.data_emissao,
      apoliceData.inicio_vigencia,
      apoliceData.fim_vigencia,
      apoliceData.condicoes_gerais,
      apoliceData.segurado_nome,
      apoliceData.segurado_cnpj,
      apoliceData.telefone,
      apoliceData.email,
      apoliceData.endereco,
      apoliceData.condutor_nome,
      apoliceData.condutor_cpf,
      apoliceData.condutor_idade,
      apoliceData.condutor_estado_civil,
      apoliceData.condutor_residencia,
      apoliceData.condutores_18_25,
      apoliceData.veiculo_modelo,
      apoliceData.veiculo_placa,
      apoliceData.veiculo_ano_modelo,
      apoliceData.veiculo_chassi,
      apoliceData.veiculo_fipe_codigo,
      apoliceData.veiculo_zero_km,
      apoliceData.categoria_risco,
      apoliceData.finalidade_uso,
      apoliceData.cep_pernoite,
      apoliceData.kit_gas,
      apoliceData.casco_fipe_percent,
      apoliceData.casco_premio,
      apoliceData.rcf_danos_materiais,
      apoliceData.rcf_danos_materiais_premio,
      apoliceData.rcf_danos_corporais,
      apoliceData.rcf_danos_corporais_premio,
      apoliceData.rcf_danos_morais,
      apoliceData.rcf_danos_morais_premio,
      apoliceData.app_morte,
      apoliceData.app_morte_premio,
      apoliceData.app_invalidez,
      apoliceData.app_invalidez_premio,
      apoliceData.carta_verde_materiais_usd,
      apoliceData.carta_verde_materiais_premio,
      apoliceData.carta_verde_corporais_usd,
      apoliceData.carta_verde_corporais_premio,
      apoliceData.assistencia_plano,
      apoliceData.assistencia_premio,
      apoliceData.vidros_plano,
      apoliceData.vidros_premio,
      apoliceData.carro_reserva_dias,
      apoliceData.carro_reserva_premio,
      apoliceData.franquia_tipo,
      apoliceData.franquia_valor,
      apoliceData.preco_liquido,
      apoliceData.preco_total,
      apoliceData.iof,
      apoliceData.forma_pagamento,
      apoliceData.parcelas,
      apoliceData.valor_parcela,
      apoliceData.corretor_nome,
      apoliceData.corretor_email,
      apoliceData.corretor_telefone,
      apoliceData.corretor_codigo,
      apoliceData.corretor_susep,
      apoliceData.corretor_filial,
      apoliceData.seguradora_nome,
      apoliceData.seguradora_cnpj,
      apoliceData.seguradora_codigo,
      apoliceData.seguradora_ie,
      apoliceData.seguradora_endereco,
      apoliceData.seguradora_telefones,
      apoliceData.seguradora_sac,
      apoliceData.seguradora_ouvidoria,
      apoliceData.seguradora_pcd,
      apoliceData.seguradora_presidente,
      apoliceData.seguradora_local_emissao,
    ];

    const result = await pool.query(query, values);
    console.log('✅ Apólice Auto salva com sucesso! ID:', result.rows[0].id);
  } catch (error) {
    console.error('❌ Erro ao salvar apólice auto:', error);
    throw error;
  }
}

