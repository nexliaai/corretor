# 🚀 Guia de Deploy e Integração com N8N

## 📋 Resumo

Este sistema possui duas opções para processar documentos com IA:

### **Opção 1: Webhook HTTP (Recomendado para N8N) ✅**
- O N8N recebe o webhook
- Processa e **retorna os dados na mesma requisição** (resposta síncrona)
- Mais simples e rápido

### **Opção 2: Callback HTTP (Para processamento assíncrono)**
- O N8N recebe o webhook
- Processa em background
- **Chama um endpoint de callback** quando terminar
- Útil se o processamento demorar muito (>30 segundos)

---

## 🎯 Opção 1: Webhook Síncrono (Recomendado)

### Como funciona:
1. Frontend envia documento → Backend `/api/escopo/upload`
2. Backend faz upload no MinIO e envia para webhook N8N
3. **N8N processa e retorna os dados na mesma resposta**
4. Backend recebe resposta e mostra tela de revisão

### Configuração no N8N:

```json
// Payload recebido pelo N8N:
{
  "document_id": "uuid-do-documento",
  "document_type": "apolice_auto",
  "file_url": "https://s3.nexlia.ai/...",
  "file_name": "apolice.pdf",
  "file_type": "application/pdf",
  "file_size": 123456,
  "minio_path": "escopo/temp/...",
  "timestamp": "2025-11-06T12:34:56.789Z"
}
```

```json
// Resposta que o N8N deve retornar (SÍNCRONA):
{
  "status": "completed",
  "client_cpf": "12345678900",
  "extracted_data": {
    "dados_pessoais": {
      "nome": "João Silva",
      "email": "joao@exemplo.com",
      "telefone": "(11) 98765-4321",
      "endereco": "Rua das Flores, 123"
    },
    "dados_documento": {
      "apolice_numero": "2025-001234",
      "data_vigencia_inicio": "2024-01-01",
      "data_vigencia_fim": "2025-01-01",
      "veiculo_marca_modelo": "Toyota Corolla",
      "veiculo_placa": "ABC1234",
      "premio_total": 2500.50
    }
  }
}
```

### ⚠️ Importante:
- Tempo máximo de resposta: **30 segundos** (limite do Vercel/Next.js)
- Se demorar mais, use a Opção 2 (Callback)

---

## 🔄 Opção 2: Callback HTTP (Assíncrono)

### Como funciona:
1. Frontend envia documento → Backend `/api/escopo/upload`
2. Backend faz upload no MinIO e envia para webhook N8N
3. N8N responde **imediatamente** com `{ "status": "processing" }`
4. Frontend fica em polling aguardando
5. **N8N chama `/api/escopo/callback` quando terminar**
6. Backend salva e frontend atualiza

### Endpoint de Callback:

```
POST https://seu-dominio.com/api/escopo/callback
Content-Type: application/json

{
  "document_id": "uuid-do-documento",
  "status": "completed",
  "client_cpf": "12345678900",
  "extracted_data": { ... }
}
```

### Configuração no N8N:

1. **Webhook Node** (recebe upload)
2. **HTTP Request Node** (baixa arquivo da URL)
3. **OpenAI/Anthropic Node** (processa documento)
4. **HTTP Request Node** (chama callback)

```
URL: https://seu-dominio.com/api/escopo/callback
Method: POST
Headers:
  Content-Type: application/json
Body:
  {
    "document_id": "{{$node["Webhook"].json["document_id"]}}",
    "status": "completed",
    "client_cpf": "{{$json["cpf"]}}",
    "extracted_data": {{$json["extracted_data"]}}
  }
```

---

## 🌐 Deploy no GitHub + Vercel

### 1. Criar Repositório no GitHub

```bash
cd c:\Nexlia\corretor

# Inicializar Git (se ainda não iniciou)
git init
git add .
git commit -m "Initial commit: Dashboard Corretor com IA"

# Criar repositório no GitHub e conectar
git remote add origin https://github.com/seu-usuario/corretor-dashboard.git
git branch -M main
git push -u origin main
```

### 2. Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Conecte sua conta GitHub
3. Importe o repositório `corretor-dashboard`
4. Configure as **variáveis de ambiente**:

```env
# PostgreSQL
POSTGRES_HOST=seu-host.supabase.co
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua-senha
POSTGRES_DB=postgres
POSTGRES_PORT=5432

# MinIO
MINIO_ENDPOINT=s3.nexlia.ai
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=sua-access-key
MINIO_SECRET_KEY=sua-secret-key
MINIO_BUCKET_NAME=corretor-docs
```

5. Clique em **Deploy** 🚀

### 3. Obter URL do Deploy

Após deploy, você terá uma URL tipo:
```
https://corretor-dashboard.vercel.app
```

### 4. Configurar Webhook no N8N

Use a URL do callback:
```
https://corretor-dashboard.vercel.app/api/escopo/callback
```

---

## 🧪 Testar Localmente

### Usar ngrok para expor localhost:

```bash
# Instalar ngrok
choco install ngrok

# Expor porta 3000
ngrok http 3000
```

Você receberá uma URL pública temporária:
```
https://abc123.ngrok.io
```

Use no N8N:
```
https://abc123.ngrok.io/api/escopo/callback
```

---

## 🔐 Segurança

### Adicionar autenticação no callback:

```typescript
// app/api/escopo/callback/route.ts
export async function POST(request: Request) {
  // Verificar token
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.WEBHOOK_SECRET;
  
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ... resto do código
}
```

No N8N, adicione header:
```
Authorization: Bearer seu-token-secreto
```

---

## 📊 Monitoramento

### Logs do Vercel:
- Acesse o dashboard da Vercel
- Vá em "Logs" → "Functions"
- Veja os logs de `/api/escopo/upload` e `/api/escopo/callback`

### Console do Navegador:
- Abra DevTools (F12)
- Veja os logs do frontend no Console

---

## 🆘 Troubleshooting

### Webhook N8N não está respondendo:
1. Verifique se a URL está correta
2. Teste com Postman/Insomnia
3. Veja os logs do N8N

### Frontend fica em loading infinito:
1. Verifique se o N8N está retornando os dados corretamente
2. Abra o DevTools e veja Network → `/api/escopo/status/{id}`
3. Verifique se `status === 'completed'` e `extracted_data` existem

### Erro de CORS:
- Configure CORS no N8N (se necessário)
- Na Vercel, o Next.js já trata CORS automaticamente

---

## 🎉 Conclusão

### Escolha sua opção:

| Característica | Opção 1 (Síncrono) | Opção 2 (Callback) |
|----------------|---------------------|---------------------|
| **Simplicidade** | ✅ Mais simples | ⚠️ Mais complexo |
| **Tempo de resposta** | < 30 segundos | Sem limite |
| **Confiabilidade** | ✅ Alta | ⚠️ Depende de rede |
| **Recomendado para** | Processamento rápido | Processamento longo |

**Recomendação:** Use **Opção 1 (Síncrono)** se o processamento for rápido (<30s).

---

## 📞 Próximos Passos

1. ✅ Fazer push no GitHub
2. ✅ Deploy na Vercel
3. ✅ Configurar variáveis de ambiente
4. ✅ Configurar webhook no N8N
5. ✅ Testar com documento real

Boa sorte! 🚀

