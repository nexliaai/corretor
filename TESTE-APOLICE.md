# 🧪 GUIA DE TESTE - APÓLICE DE SEGURO AUTO

## ✅ Sistema Configurado

- ✅ Tabela `apolice_auto` criada no banco
- ✅ Dropdown atualizado: "🚗 Apólice de Seguro Auto"
- ✅ OpenAI GPT-4o configurado para processar PDFs e Imagens
- ✅ Sistema salva automaticamente na tabela `apolice_auto`

---

## 🚀 COMO TESTAR

### 1. **Inicie o servidor:**
```bash
npm run dev
```

### 2. **Acesse:**
```
http://localhost:3000/clientes
```

### 3. **Clique no botão roxo "NOVO ESCOPO"**

### 4. **Preencha o formulário:**

| Campo | Exemplo |
|-------|---------|
| **Nome Completo** | João Silva Santos |
| **CPF/CNPJ** | 123.456.789-00 |
| **Tipo de Documento** | 🚗 Apólice de Seguro Auto |
| **Arquivo** | Upload de PDF ou foto da apólice |

### 5. **Clique em "CRIAR CLIENTE E PROCESSAR COM IA"**

### 6. **Acompanhe o processo:**
- ⏳ **Criando cliente e enviando...** (3-5 segundos)
- 🤖 **Processando com OpenAI...** (10-30 segundos dependendo do tamanho)
- ✅ **Processamento Concluído!**

### 7. **Veja os dados extraídos na tela!**

---

## 📊 O QUE ACONTECE NOS BASTIDORES

```
1. Sistema cria cliente na tabela `users`:
   - first_name: "João"
   - last_name: "Silva Santos"
   - document: "123.456.789-00"
   - email: "123.456.789-00@temp.corretor.local" (temporário)

2. Faz upload do arquivo para MinIO:
   - Caminho: escopo/{user_id}/{timestamp}_arquivo.pdf

3. Salva registro na tabela `documentos`:
   - user_id: UUID do cliente
   - origem: "apolice"
   - caminho_minio: "escopo/..."

4. OpenAI GPT-4o processa o documento:
   - Baixa arquivo do MinIO
   - Converte para base64
   - Envia para GPT-4o Vision
   - Extrai TODOS os dados da apólice

5. Sistema atualiza automaticamente:
   ✅ Tabela `users` - email, telefone, endereço (se encontrar)
   ✅ Tabela `apolice_auto` - 76 campos da apólice!
   ✅ Tabela `documentos` - metadata com status "completed"
```

---

## 🔍 VERIFICAR RESULTADOS NO BANCO

### Ver cliente criado:
```sql
SELECT id, first_name, last_name, email, phone, city, document 
FROM users 
WHERE document = '123.456.789-00';
```

### Ver documento processado:
```sql
SELECT id, user_id, nome_arquivo, origem, metadata 
FROM documentos 
WHERE origem = 'apolice' 
ORDER BY criado_em DESC 
LIMIT 1;
```

### Ver apólice extraída:
```sql
SELECT 
  id,
  cliente_id,
  numero_apolice,
  tipo_seguro,
  veiculo_modelo,
  veiculo_placa,
  preco_total,
  seguradora_nome,
  data_registro
FROM apolice_auto 
ORDER BY data_registro DESC 
LIMIT 1;
```

### Ver TODOS os dados da apólice:
```sql
SELECT * FROM apolice_auto ORDER BY data_registro DESC LIMIT 1;
```

---

## 📋 CAMPOS QUE A IA EXTRAI (76 CAMPOS)

### Identificação:
- numero_apolice
- numero_endosso
- proposta_numero
- susep_processo
- tipo_seguro
- data_emissao
- inicio_vigencia
- fim_vigencia
- condicoes_gerais

### Segurado:
- segurado_nome
- segurado_cnpj
- telefone
- email
- endereco

### Condutor:
- condutor_nome
- condutor_cpf
- condutor_idade
- condutor_estado_civil
- condutor_residencia
- condutores_18_25

### Veículo:
- veiculo_modelo
- veiculo_placa
- veiculo_ano_modelo
- veiculo_chassi
- veiculo_fipe_codigo
- veiculo_zero_km
- categoria_risco
- finalidade_uso
- cep_pernoite
- kit_gas

### Coberturas:
- casco_fipe_percent
- casco_premio
- rcf_danos_materiais
- rcf_danos_materiais_premio
- rcf_danos_corporais
- rcf_danos_corporais_premio
- rcf_danos_morais
- rcf_danos_morais_premio
- app_morte
- app_morte_premio
- app_invalidez
- app_invalidez_premio
- carta_verde_materiais_usd
- carta_verde_materiais_premio
- carta_verde_corporais_usd
- carta_verde_corporais_premio
- assistencia_plano
- assistencia_premio
- vidros_plano
- vidros_premio
- carro_reserva_dias
- carro_reserva_premio
- franquia_tipo
- franquia_valor

### Valores:
- preco_liquido
- preco_total
- iof
- forma_pagamento
- parcelas
- valor_parcela

### Corretor:
- corretor_nome
- corretor_email
- corretor_telefone
- corretor_codigo
- corretor_susep
- corretor_filial

### Seguradora:
- seguradora_nome
- seguradora_cnpj
- seguradora_codigo
- seguradora_ie
- seguradora_endereco
- seguradora_telefones
- seguradora_sac
- seguradora_ouvidoria
- seguradora_pcd
- seguradora_presidente
- seguradora_local_emissao

---

## 🎯 TIPOS DE ARQUIVO ACEITOS

- ✅ **PDF** - Apólices em formato PDF
- ✅ **JPG/JPEG** - Foto ou scan da apólice
- ✅ **PNG** - Screenshot da apólice
- ✅ **WEBP** - Imagens modernas
- ✅ **GIF** - Imagens animadas

---

## ⚠️ TROUBLESHOOTING

### Erro: "Failed to process document"
- Verifique se `OPENAI_API_KEY` está no `.env`
- Verifique se tem créditos na conta OpenAI

### Erro: "Document not found"
- Verifique se o arquivo foi enviado para o MinIO
- Verifique credenciais do MinIO no `.env`

### Erro: "Failed to parse AI response as JSON"
- O documento pode estar muito borrado/ilegível
- Tente com um documento de melhor qualidade

### Campos com `null`:
- Normal! A IA só preenche o que consegue ler
- Documentos diferentes têm campos diferentes
- Pode editar manualmente depois no banco

---

## 💡 DICAS

1. **Qualidade do documento importa!**
   - PDFs originais são melhores que fotos
   - Fotos devem estar bem iluminadas e focadas
   - Evite documentos rasurados

2. **Teste com diferentes apólices:**
   - Porto Seguro
   - Bradesco Seguros
   - Liberty Seguros
   - Etc.

3. **Tempo de processamento:**
   - Documentos pequenos: ~10-15 segundos
   - Documentos grandes: ~20-30 segundos

4. **Custos OpenAI:**
   - GPT-4o Vision: ~$0.01-0.05 por documento
   - Muito mais barato que mão de obra manual!

---

## 🎉 PRÓXIMOS PASSOS

Depois de testar, podemos:

1. ✅ Criar interface para visualizar apólices cadastradas
2. ✅ Adicionar filtros (por seguradora, vigência, etc)
3. ✅ Criar relatórios de apólices
4. ✅ Adicionar outros tipos de seguros (residencial, vida, etc)
5. ✅ Exportar dados para Excel/PDF
6. ✅ Notificações de renovação de apólice

**Bora testar!** 🚀

