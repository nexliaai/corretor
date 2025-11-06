# 🚀 Início Rápido - 3 Passos

## ⚡ Configure em 3 minutos!

### Passo 1: Instalar Dependências
```bash
npm install
```

### Passo 2: Configurar MinIO
Crie o arquivo `.env` na raiz com:

```env
MINIO_ENDPOINT=SEU-ENDPOINT-AQUI.com
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=oVgj4JI2njeosMdcJwC7
MINIO_SECRET_KEY=1SUXb9F23nKfyYv8AvbURvxyjbCOwhxlWbWhFrAD
MINIO_BUCKET=la-villa-corretora

POSTGRES_HOST=178.156.184.48
POSTGRES_PORT=5433
POSTGRES_USER=postgres
POSTGRES_PASSWORD=n6f7oHxCuaGnsK41sviICQ4C4
POSTGRES_DB=corretor
```

**⚠️ Substitua `SEU-ENDPOINT-AQUI.com` pelo endpoint real do MinIO!**

### Passo 3: Testar e Iniciar
```bash
# Testar conexões
npm run test:connections

# Se tudo OK, inicie o projeto
npm run dev
```

**Acesse:** http://localhost:3000

---

## 🎯 O que você pode fazer?

### 1️⃣ Gerenciar Usuários
- Listar todos os usuários
- Adicionar novos usuários
- Excluir usuários

### 2️⃣ Gerenciar Arquivos
- Fazer upload de documentos e imagens
- Baixar arquivos
- Excluir arquivos
- Ver informações (tamanho, data, tipo)

### 3️⃣ Organização
- Arquivos organizados por usuário no MinIO
- Busca fácil por usuário
- Interface limpa e moderna

---

## 📱 Como Usar a Interface

```
┌─────────────────────────────────────────────────────────┐
│  Painel de Gestão                                       │
├──────────────────┬──────────────────────────────────────┤
│                  │                                      │
│  USUÁRIOS        │  ARQUIVOS DO USUÁRIO SELECIONADO    │
│                  │                                      │
│  [+ Novo]        │  ┌──────────────────────────────┐  │
│                  │  │ Arraste arquivos aqui        │  │
│  ┌────────────┐  │  │ ou clique para selecionar    │  │
│  │ João Silva │  │  └──────────────────────────────┘  │
│  │ joao@...   │  │                                      │
│  └────────────┘  │  Lista de Arquivos:                 │
│                  │  ┌──────────────────────────────┐  │
│  ┌────────────┐  │  │ 📄 contrato.pdf  [↓] [🗑]   │  │
│  │ Maria Luz  │  │  │ 🖼️  foto.jpg      [↓] [🗑]   │  │
│  │ maria@...  │  │  └──────────────────────────────┘  │
│  └────────────┘  │                                      │
│                  │                                      │
└──────────────────┴──────────────────────────────────────┘
```

### Fluxo de Uso:

1. **Adicionar Usuário**
   - Clique em `[+ Novo]`
   - Preencha: Nome, Sobrenome, Email, etc.
   - Clique em `Salvar Usuário`

2. **Upload de Arquivo**
   - Clique em um usuário na lista
   - Arraste arquivos para a área de upload
   - OU clique para selecionar
   - Preencha "Origem" (opcional)
   - Clique em `Enviar`

3. **Download de Arquivo**
   - Clique no ícone `[↓]` ao lado do arquivo

4. **Excluir Arquivo**
   - Clique no ícone `[🗑]` ao lado do arquivo
   - Confirme a exclusão

5. **Excluir Usuário**
   - Clique no ícone `[🗑]` ao lado do nome do usuário
   - ⚠️ Todos os arquivos do usuário serão excluídos!

---

## 📋 Arquivos Suportados

✅ **Imagens**
- PNG, JPG, JPEG, GIF, WEBP

✅ **Documentos**
- PDF
- Word (DOC, DOCX)
- Excel (XLS, XLSX)

---

## ⚙️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor local

# Testes
npm run test:connections # Testa PostgreSQL e MinIO

# Produção
npm run build           # Cria build otimizado
npm start               # Inicia produção

# Qualidade
npm run lint            # Verifica erros
npm run format          # Formata código
```

---

## 🆘 Problemas Comuns

### ❌ "Cannot connect to database"
```bash
# Teste a conexão
npm run test:connections

# Verifique o arquivo .env
# Confirme que está no diretório correto
```

### ❌ "MinIO connection failed"
```bash
# Verifique se o MINIO_ENDPOINT está correto
# Teste manualmente no navegador
# Confirme que as credenciais estão corretas
```

### ❌ "Upload failed"
```bash
# Verifique o tamanho do arquivo (max 50MB)
# Confirme que o bucket existe
# Veja os logs no console do navegador
```

---

## 📚 Documentação Completa

- **README.md** - Documentação principal detalhada
- **SETUP.md** - Guia completo de instalação
- **DEPLOY.md** - Como fazer deploy em produção
- **CHANGELOG.md** - Histórico de versões
- **OVERVIEW.md** - Visão geral técnica

---

## ✅ Está Tudo Pronto!

O sistema está **100% funcional** e esperando apenas:

1. ⚠️ Você configurar o endpoint do MinIO no `.env`
2. ✅ Rodar `npm run test:connections`
3. ✅ Rodar `npm run dev`
4. 🎉 Começar a usar!

---

**Dúvidas?** Consulte os arquivos de documentação ou entre em contato com a equipe.

**Boa sorte! 🚀**

