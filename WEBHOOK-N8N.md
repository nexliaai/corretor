# 🔗 Integração com N8N via Webhook

## 📋 Fluxo Completo

### 1️⃣ **Upload do Documento** (Frontend → Backend)
O usuário seleciona um arquivo e tipo de documento no modal "NOVO ESCOPO".

**Endpoint:** `POST /api/escopo/upload`

**Payload enviado:**
```json
FormData {
  "file": <arquivo>,
  "documentType": "apolice_auto" | "proposta" | "contrato" | ...
}
```

**Resposta:**
```json
{
  "success": true,
  "document_id": "uuid-do-documento",
  "temp_user_id": "uuid-temporario",
  "status": "processing",
  "message": "Documento enviado para processamento via N8N"
}
```

---

### 2️⃣ **Envio para N8N Webhook** (Backend → N8N)
O sistema envia automaticamente para o webhook do N8N.

**URL do Webhook:** `https://flows-whk.nexia.tec.br/webhook/929bd225-3de3-46f2-aadc-20ba514675f6`

**Payload enviado para N8N:**
```json
{
  "document_type": "apolice_auto",
  "file_url": "https://s3.nexlia.ai/...", // URL pré-assinada (válida por 2h)
  "file_name": "apolice.pdf",
  "file_type": "application/pdf",
  "file_size": 123456,
  "minio_path": "escopo/temp/1234567890_apolice.pdf",
  "timestamp": "2025-11-05T12:34:56.789Z"
}
```

---

### 3️⃣ **Processamento no N8N** (Sua Responsabilidade)
O N8N deve:

1. **Baixar o arquivo** usando `file_url`
2. **Processar com IA** (OpenAI, Anthropic, etc.)
3. **Extrair dados estruturados** do documento
4. **RETORNAR os dados extraídos na resposta do webhook** (resposta síncrona)

---

### 4️⃣ **Resposta do Webhook N8N** (Resposta Síncrona)
O N8N deve retornar os dados processados **na resposta do webhook** (não precisa fazer callback separado).

**Resposta esperada do webhook:**

#### ✅ **Se processamento foi bem-sucedido:**
```json
{
  "status": "completed",
  "client_cpf": "12345678900", // CPF/CNPJ extraído (apenas números)
  "extracted_data": {
    "dados_pessoais": {
      "nome": "João Silva",
      "email": "joao@exemplo.com",
      "telefone": "(11) 98765-4321",
      "endereco": "Rua das Flores, 123",
      "cidade": "São Paulo",
      "cep": "01234-567"
    },
    "dados_documento": {
      // Para apólice_auto:
      "segurado": "João Silva",
      "cnpj": "123.456.789-00",
      "apolice_numero": "2025-001234",
      "data_vigencia_inicio": "2025-01-01",
      "data_vigencia_fim": "2026-01-01",
      "veiculo_marca_modelo": "FIAT UNO VIVACE 1.0",
      "veiculo_placa": "ABC-1234",
      "veiculo_chassi": "9BD12345678901234",
      "veiculo_ano_modelo": "2020/2021",
      "premio_total": 1500.00,
      "coberturas": {
        "casco": 35000.00,
        "rcf_danos_materiais": 100000.00,
        "rcf_danos_corporais": 100000.00,
        "app_morte": 10000.00
      }
      // ... outros campos conforme necessário
    }
  }
}
```

#### ❌ **Se houve erro:**
```json
{
  "status": "error",
  "error_message": "Descrição do erro"
}
```

**IMPORTANTE:** A resposta do webhook é **síncrona**. O N8N deve processar e retornar os dados na mesma requisição.

---

### 5️⃣ **Revisão e Confirmação** (Frontend)
Quando `status === 'completed'`, o frontend exibe uma tela de revisão com:
- ✅ Cliente identificado (ou "Novo cliente será criado")
- 📄 Dados da apólice extraídos
- 📞 Dados de contato

O usuário pode:
- **Confirmar**: Salva no banco de dados
- **Cancelar**: Descarta os dados

---

## 🎯 Lógica de Cliente

### Se `client_cpf` for enviado no callback:
1. O sistema busca um cliente existente com esse CPF
2. **Se encontrar:** Vincula o documento ao cliente existente
3. **Se NÃO encontrar:** Mantém vínculo com usuário temporário

### Na confirmação (frontend):
1. **Se cliente existe:** Salva documento vinculado a ele
2. **Se NÃO existe:** Cria novo cliente e vincula documento

---

## 📊 Estrutura de Dados Esperada

### Para `document_type: "apolice_auto"`
O N8N deve extrair:

**Dados Pessoais:**
- nome
- email
- telefone
- endereco
- cidade
- cep

**Dados do Documento:**
- segurado (nome no documento)
- cnpj (CPF/CNPJ)
- apolice_numero
- data_vigencia_inicio (formato: YYYY-MM-DD)
- data_vigencia_fim (formato: YYYY-MM-DD)
- veiculo_marca_modelo
- veiculo_placa
- veiculo_chassi
- veiculo_ano_modelo
- premio_total (número)
- coberturas (objeto com valores numéricos)

### Para outros `document_type`:
Estrutura flexível, mas sempre incluir:
```json
{
  "dados_pessoais": {
    "nome": "string",
    "email": "string",
    "telefone": "string"
  },
  "dados_documento": {
    // Campos específicos do tipo de documento
  }
}
```

---

## 🔍 URLs das APIs

### Produção (assumindo deploy):
- Upload: `https://seu-dominio.com/api/escopo/upload`
- Callback: `https://seu-dominio.com/api/escopo/callback`
- Status: `https://seu-dominio.com/api/escopo/status/{id}`

### Desenvolvimento Local:
- Upload: `http://localhost:3000/api/escopo/upload`
- Callback: `http://localhost:3000/api/escopo/callback`
- Status: `http://localhost:3000/api/escopo/status/{id}`

---

## ✅ Checklist para Configurar N8N

- [ ] Criar workflow que recebe webhook POST
- [ ] Baixar arquivo usando `file_url`
- [ ] Processar documento com IA (GPT-4, etc.)
- [ ] Extrair dados estruturados conforme schema acima
- [ ] Limpar CPF/CNPJ (apenas números)
- [ ] **RETORNAR dados na resposta do webhook** (síncrona)
- [ ] Tratar erros e retornar com `status: "error"`
- [ ] Testar com arquivo de exemplo
- [ ] ⚠️ **IMPORTANTE:** A resposta deve ser rápida (máx. 30 segundos)

---

## 🧪 Teste Manual

1. Acesse o dashboard em `/clientes`
2. Clique em "NOVO ESCOPO"
3. Selecione tipo de documento e arquivo
4. Clique em "Processar com IA"
5. Aguarde processamento (até 2 minutos)
6. Verifique se tela de revisão aparece
7. Confirme e salve

---

## 📝 Notas Importantes

- ⏱️ A URL pré-assinada do MinIO é válida por **2 horas**
- ⚡ A resposta do webhook deve ser **síncrona** (retornar na mesma requisição)
- ⏰ Tempo máximo de resposta recomendado: **30 segundos**
- 🧹 CPF/CNPJ devem ser enviados **apenas com números**
- 📅 Datas devem estar no formato **YYYY-MM-DD**
- 💰 Valores monetários devem ser **números** (não strings)
- 🔄 Não é necessário fazer callback separado - retorne os dados na resposta

