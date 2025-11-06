-- Tabela de Apólices de Seguro Auto
CREATE TABLE IF NOT EXISTS apolice_auto (
    id SERIAL PRIMARY KEY,

    -- Identificação da Apólice
    numero_apolice VARCHAR(30),
    numero_endosso VARCHAR(10),
    proposta_numero VARCHAR(20),
    susep_processo VARCHAR(50),
    tipo_seguro VARCHAR(50),
    data_emissao DATE,
    inicio_vigencia DATE,
    fim_vigencia DATE,
    condicoes_gerais VARCHAR(20),

    -- Segurado (relacionado ao cliente)
    cliente_id UUID REFERENCES users(id) ON DELETE CASCADE,
    segurado_nome VARCHAR(120),
    segurado_cnpj VARCHAR(20),
    telefone VARCHAR(20),
    email VARCHAR(120),
    endereco TEXT,

    -- Condutor Principal
    condutor_nome VARCHAR(120),
    condutor_cpf VARCHAR(20),
    condutor_idade INT,
    condutor_estado_civil VARCHAR(50),
    condutor_residencia VARCHAR(30),
    condutores_18_25 BOOLEAN,

    -- Veículo
    veiculo_modelo VARCHAR(120),
    veiculo_placa VARCHAR(10),
    veiculo_ano_modelo VARCHAR(10),
    veiculo_chassi VARCHAR(30),
    veiculo_fipe_codigo VARCHAR(15),
    veiculo_zero_km BOOLEAN,
    categoria_risco VARCHAR(50),
    finalidade_uso VARCHAR(50),
    cep_pernoite VARCHAR(10),
    kit_gas BOOLEAN,

    -- Coberturas principais
    casco_fipe_percent NUMERIC(5,2),
    casco_premio NUMERIC(10,2),
    rcf_danos_materiais NUMERIC(12,2),
    rcf_danos_materiais_premio NUMERIC(10,2),
    rcf_danos_corporais NUMERIC(12,2),
    rcf_danos_corporais_premio NUMERIC(10,2),
    rcf_danos_morais NUMERIC(12,2),
    rcf_danos_morais_premio NUMERIC(10,2),
    app_morte NUMERIC(12,2),
    app_morte_premio NUMERIC(10,2),
    app_invalidez NUMERIC(12,2),
    app_invalidez_premio NUMERIC(10,2),
    carta_verde_materiais_usd NUMERIC(10,2),
    carta_verde_materiais_premio NUMERIC(10,2),
    carta_verde_corporais_usd NUMERIC(10,2),
    carta_verde_corporais_premio NUMERIC(10,2),

    assistencia_plano VARCHAR(20),
    assistencia_premio NUMERIC(10,2),
    vidros_plano VARCHAR(20),
    vidros_premio NUMERIC(10,2),
    carro_reserva_dias INT,
    carro_reserva_premio NUMERIC(10,2),

    franquia_tipo VARCHAR(50),
    franquia_valor NUMERIC(10,2),

    preco_liquido NUMERIC(10,2),
    preco_total NUMERIC(10,2),
    iof NUMERIC(10,2),
    forma_pagamento VARCHAR(50),
    parcelas INT,
    valor_parcela NUMERIC(10,2),

    -- Corretor
    corretor_nome VARCHAR(120),
    corretor_email VARCHAR(120),
    corretor_telefone VARCHAR(20),
    corretor_codigo VARCHAR(20),
    corretor_susep VARCHAR(30),
    corretor_filial VARCHAR(10),

    -- Seguradora
    seguradora_nome VARCHAR(120),
    seguradora_cnpj VARCHAR(20),
    seguradora_codigo VARCHAR(10),
    seguradora_ie VARCHAR(30),
    seguradora_endereco TEXT,
    seguradora_telefones TEXT,
    seguradora_sac VARCHAR(30),
    seguradora_ouvidoria VARCHAR(30),
    seguradora_pcd VARCHAR(30),
    seguradora_presidente VARCHAR(100),
    seguradora_local_emissao VARCHAR(100),

    -- Documento relacionado
    documento_id UUID REFERENCES documentos(id) ON DELETE SET NULL,

    -- Auditoria
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_apolice_auto_cliente ON apolice_auto(cliente_id);
CREATE INDEX IF NOT EXISTS idx_apolice_auto_numero ON apolice_auto(numero_apolice);
CREATE INDEX IF NOT EXISTS idx_apolice_auto_vigencia ON apolice_auto(inicio_vigencia, fim_vigencia);
CREATE INDEX IF NOT EXISTS idx_apolice_auto_documento ON apolice_auto(documento_id);