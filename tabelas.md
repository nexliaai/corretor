# Estrutura do Banco de Dados

## Tabela: apolice_auto

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|----------|
| id | integer | Não | nextval('apolice_auto_id_seq'::regclass) |
| numero_apolice | character varying(30) | Sim | - |
| numero_endosso | character varying(10) | Sim | - |
| proposta_numero | character varying(20) | Sim | - |
| susep_processo | character varying(50) | Sim | - |
| tipo_seguro | character varying(50) | Sim | - |
| data_emissao | date | Sim | - |
| inicio_vigencia | date | Sim | - |
| fim_vigencia | date | Sim | - |
| condicoes_gerais | character varying(20) | Sim | - |
| cliente_id | uuid | Sim | - |
| segurado_nome | character varying(120) | Sim | - |
| segurado_cnpj | character varying(20) | Sim | - |
| telefone | character varying(20) | Sim | - |
| email | character varying(120) | Sim | - |
| endereco | text | Sim | - |
| condutor_nome | character varying(120) | Sim | - |
| condutor_cpf | character varying(20) | Sim | - |
| condutor_idade | integer | Sim | - |
| condutor_estado_civil | character varying(50) | Sim | - |
| condutor_residencia | character varying(30) | Sim | - |
| condutores_18_25 | boolean | Sim | - |
| veiculo_modelo | character varying(120) | Sim | - |
| veiculo_placa | character varying(10) | Sim | - |
| veiculo_ano_modelo | character varying(10) | Sim | - |
| veiculo_chassi | character varying(30) | Sim | - |
| veiculo_fipe_codigo | character varying(15) | Sim | - |
| veiculo_zero_km | boolean | Sim | - |
| categoria_risco | character varying(50) | Sim | - |
| finalidade_uso | character varying(50) | Sim | - |
| cep_pernoite | character varying(10) | Sim | - |
| kit_gas | boolean | Sim | - |
| casco_fipe_percent | numeric | Sim | - |
| casco_premio | numeric | Sim | - |
| rcf_danos_materiais | numeric | Sim | - |
| rcf_danos_materiais_premio | numeric | Sim | - |
| rcf_danos_corporais | numeric | Sim | - |
| rcf_danos_corporais_premio | numeric | Sim | - |
| rcf_danos_morais | numeric | Sim | - |
| rcf_danos_morais_premio | numeric | Sim | - |
| app_morte | numeric | Sim | - |
| app_morte_premio | numeric | Sim | - |
| app_invalidez | numeric | Sim | - |
| app_invalidez_premio | numeric | Sim | - |
| carta_verde_materiais_usd | numeric | Sim | - |
| carta_verde_materiais_premio | numeric | Sim | - |
| carta_verde_corporais_usd | numeric | Sim | - |
| carta_verde_corporais_premio | numeric | Sim | - |
| assistencia_plano | character varying(20) | Sim | - |
| assistencia_premio | numeric | Sim | - |
| vidros_plano | character varying(20) | Sim | - |
| vidros_premio | numeric | Sim | - |
| carro_reserva_dias | integer | Sim | - |
| carro_reserva_premio | numeric | Sim | - |
| franquia_tipo | character varying(50) | Sim | - |
| franquia_valor | numeric | Sim | - |
| preco_liquido | numeric | Sim | - |
| preco_total | numeric | Sim | - |
| iof | numeric | Sim | - |
| forma_pagamento | character varying(50) | Sim | - |
| parcelas | integer | Sim | - |
| valor_parcela | numeric | Sim | - |
| corretor_nome | character varying(120) | Sim | - |
| corretor_email | character varying(120) | Sim | - |
| corretor_telefone | character varying(20) | Sim | - |
| corretor_codigo | character varying(20) | Sim | - |
| corretor_susep | character varying(30) | Sim | - |
| corretor_filial | character varying(10) | Sim | - |
| seguradora_nome | character varying(120) | Sim | - |
| seguradora_cnpj | character varying(20) | Sim | - |
| seguradora_codigo | character varying(10) | Sim | - |
| seguradora_ie | character varying(30) | Sim | - |
| seguradora_endereco | text | Sim | - |
| seguradora_telefones | text | Sim | - |
| seguradora_sac | character varying(30) | Sim | - |
| seguradora_ouvidoria | character varying(30) | Sim | - |
| seguradora_pcd | character varying(30) | Sim | - |
| seguradora_presidente | character varying(100) | Sim | - |
| seguradora_local_emissao | character varying(100) | Sim | - |
| documento_id | uuid | Sim | - |
| data_registro | timestamp without time zone | Sim | CURRENT_TIMESTAMP |
| atualizado_em | timestamp without time zone | Sim | CURRENT_TIMESTAMP |
| empresa_id | uuid | Sim | - |


## Tabela: apolice_condutores

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|----------|
| id | integer | Não | nextval('apolice_condutores_id_seq'::regclass) |
| apolice_id | integer | Sim | - |
| condutor_nome | character varying(200) | Sim | - |
| condutor_cpf | character varying(15) | Sim | - |
| condutor_idade | integer | Sim | - |
| condutor_estado_civil | character varying(50) | Sim | - |
| condutor_residencia | character varying(30) | Sim | - |
| tipo | character varying(30) | Sim | 'principal'::character varying |
| created_at | timestamp without time zone | Sim | CURRENT_TIMESTAMP |


## Tabela: documentos

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|----------|
| id | uuid | Não | gen_random_uuid() |
| user_id | uuid | Não | - |
| nome_arquivo | character varying(255) | Não | - |
| caminho_minio | character varying(500) | Não | - |
| tipo | character varying(50) | Sim | - |
| tamanho_bytes | bigint | Sim | - |
| origem | character varying(50) | Sim | - |
| metadata | jsonb | Sim | - |
| criado_em | timestamp without time zone | Sim | CURRENT_TIMESTAMP |
| empresa_id | uuid | Sim | - |


## Tabela: empresas

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|----------|
| id | uuid | Não | gen_random_uuid() |
| razao_social | character varying(255) | Não | - |
| nome_fantasia | character varying(255) | Sim | - |
| cnpj | character varying(30) | Não | - |
| inscricao_estadual | character varying(50) | Sim | - |
| inscricao_municipal | character varying(50) | Sim | - |
| tipo_empresa | character varying(100) | Sim | - |
| porte | character varying(50) | Sim | - |
| ramo_atividade | character varying(500) | Sim | - |
| cnae_principal | character varying(200) | Sim | - |
| cnae_secundarios | text | Sim | - |
| cep | character varying(20) | Sim | - |
| logradouro | character varying(255) | Sim | - |
| numero | character varying(30) | Sim | - |
| complemento | character varying(200) | Sim | - |
| bairro | character varying(100) | Sim | - |
| cidade | character varying(100) | Sim | - |
| estado | character varying(100) | Sim | - |
| pais | character varying(100) | Sim | 'Brasil'::character varying |
| telefone_principal | character varying(30) | Sim | - |
| telefone_secundario | character varying(30) | Sim | - |
| email_principal | character varying(255) | Sim | - |
| email_financeiro | character varying(255) | Sim | - |
| email_nfe | character varying(255) | Sim | - |
| website | character varying(255) | Sim | - |
| regime_tributario | character varying(100) | Sim | - |
| data_abertura | date | Sim | - |
| capital_social | character varying(50) | Sim | - |
| faturamento_anual | numeric | Sim | - |
| socio_principal | character varying(255) | Sim | - |
| cpf_socio_principal | character varying(30) | Sim | - |
| contato_responsavel | character varying(255) | Sim | - |
| cargo_contato | character varying(200) | Sim | - |
| telefone_contato | character varying(30) | Sim | - |
| email_contato | character varying(255) | Sim | - |
| user_id | uuid | Sim | - |
| empresa_matriz_id | uuid | Sim | - |
| status | character varying(50) | Sim | 'ativa'::character varying |
| cliente_desde | date | Sim | - |
| observacoes | text | Sim | - |
| metadata | jsonb | Sim | - |
| created_at | timestamp without time zone | Sim | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | Sim | CURRENT_TIMESTAMP |


## Tabela: users

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|----------|
| id | uuid | Não | gen_random_uuid() |
| phone | character varying(20) | Não | - |
| email | character varying(255) | Não | - |
| city | character varying(100) | Sim | - |
| country | character varying(2) | Sim | - |
| address | character varying(255) | Sim | - |
| number | character varying(20) | Sim | - |
| postal_code | character varying(20) | Sim | - |
| address_extra | character varying(255) | Sim | - |
| id_drive | character varying(255) | Sim | - |
| created_at | timestamp without time zone | Sim | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | Sim | CURRENT_TIMESTAMP |
| active | boolean | Sim | true |
| metadata | jsonb | Sim | - |
| document | character varying(20) | Sim | - |
| cargo | character varying(100) | Sim | - |
| clientes_associados | ARRAY | Sim | '{}'::uuid[] |
| empresa_id | uuid | Sim | - |
| cargo_na_empresa | character varying(100) | Sim | - |
| name | character varying(200) | Sim | - |


