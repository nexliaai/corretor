# 🚀 Guia de Deploy - Painel de Gestão

## Deploy em Produção

### Opção 1: Vercel (Recomendado para Next.js)

#### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login na Vercel

```bash
vercel login
```

#### 3. Deploy

```bash
vercel
```

#### 4. Configurar Variáveis de Ambiente

No painel da Vercel (vercel.com):
- Vá em Settings → Environment Variables
- Adicione todas as variáveis do arquivo `.env`

#### 5. Redeploy

```bash
vercel --prod
```

### Opção 2: Docker

#### Criar Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Dependências
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Criar docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
```

#### Deploy com Docker

```bash
docker-compose up -d
```

### Opção 3: VPS (Linux)

#### 1. Preparar o Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
sudo npm install -g pm2
```

#### 2. Clonar e Configurar

```bash
# Clonar repositório
git clone https://github.com/nexliaai/corretor.git
cd corretor

# Instalar dependências
npm install

# Configurar .env
nano .env
# (Cole as variáveis de ambiente)

# Build
npm run build
```

#### 3. Iniciar com PM2

```bash
# Iniciar aplicação
pm2 start npm --name "corretor" -- start

# Salvar configuração PM2
pm2 save

# Iniciar PM2 no boot
pm2 startup
```

#### 4. Configurar Nginx (Opcional)

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Configurações de Segurança

### 1. Variáveis de Ambiente

⚠️ **NUNCA** commite o arquivo `.env` no Git!

### 2. CORS (se necessário)

Adicione em `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'seu-dominio.com' },
      ],
    },
  ];
}
```

### 3. Rate Limiting

Considere adicionar rate limiting nas API routes para evitar abusos.

### 4. HTTPS

Sempre use HTTPS em produção. Com Vercel é automático. Com VPS, use Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

## Monitoramento

### PM2 Monitoring

```bash
# Ver logs
pm2 logs corretor

# Ver status
pm2 status

# Restart
pm2 restart corretor

# Stop
pm2 stop corretor
```

### Logs em Produção

Configure logs estruturados para facilitar debugging:

```bash
# Ver últimos logs
pm2 logs --lines 100

# Logs em tempo real
pm2 logs --raw
```

## Backup

### Banco de Dados

```bash
# Backup PostgreSQL
pg_dump -h 178.156.184.48 -p 5433 -U postgres -d corretor > backup_$(date +%Y%m%d).sql

# Restore
psql -h 178.156.184.48 -p 5433 -U postgres -d corretor < backup.sql
```

### MinIO

Configure replicação ou backup automático dos buckets do MinIO.

## Troubleshooting

### Aplicação não inicia

1. Verifique logs: `pm2 logs`
2. Verifique .env está configurado
3. Verifique portas disponíveis: `lsof -i :3000`

### Erro de conexão com banco

1. Teste conexão: `npm run test:connections`
2. Verifique firewall do servidor
3. Confirme credenciais do banco

### Upload de arquivos falha

1. Verifique endpoint do MinIO
2. Confirme credenciais MinIO
3. Verifique se bucket existe

## Performance

### Otimizações Next.js

- ✅ Use `next/image` para imagens otimizadas
- ✅ Configure cache no MinIO
- ✅ Use ISR (Incremental Static Regeneration) quando possível
- ✅ Configure CDN para assets estáticos

### Database

- ✅ Adicione índices nas colunas mais consultadas
- ✅ Configure pool de conexões adequado
- ✅ Monitore queries lentas

## Atualizações

### Deploy de novas versões

```bash
# No servidor
cd corretor
git pull
npm install
npm run build
pm2 restart corretor
```

### Rollback

```bash
git revert HEAD
npm install
npm run build
pm2 restart corretor
```

## Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados acessível
- [ ] MinIO acessível e bucket criado
- [ ] SSL/HTTPS configurado
- [ ] Firewall configurado
- [ ] Backup automatizado
- [ ] Monitoramento configurado
- [ ] Logs configurados
- [ ] PM2 ou process manager instalado
- [ ] Domínio apontado corretamente

---

Para mais informações, consulte a documentação oficial do Next.js: https://nextjs.org/docs/deployment

