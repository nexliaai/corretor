# 🚀 Guia de Configuração Rápida

## 1. Instalar Dependências

```bash
npm install
```

## 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
# MinIO Configuration
MINIO_ENDPOINT=seu-endpoint-minio.com
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=oVgj4JI2njeosMdcJwC7
MINIO_SECRET_KEY=1SUXb9F23nKfyYv8AvbURvxyjbCOwhxlWbWhFrAD
MINIO_BUCKET=la-villa-corretora

# PostgreSQL Configuration
POSTGRES_HOST=178.156.184.48
POSTGRES_PORT=5433
POSTGRES_USER=postgres
POSTGRES_PASSWORD=n6f7oHxCuaGnsK41sviICQ4C4
POSTGRES_DB=corretor
```

**⚠️ IMPORTANTE:** Substitua `seu-endpoint-minio.com` pelo endpoint real do seu MinIO.

## 3. Verificar Banco de Dados

O sistema espera encontrar as seguintes tabelas:

- **users** - Já existe no seu banco
- **documentos** - Já existe no seu banco

✅ Não é necessário rodar migrations!

## 4. Testar Conexão

### Testar PostgreSQL

```bash
node -e "const {Pool} = require('pg'); const pool = new Pool({host:'178.156.184.48',port:5433,user:'postgres',password:'n6f7oHxCuaGnsK41sviICQ4C4',database:'corretor',ssl:{rejectUnauthorized:false}}); pool.query('SELECT NOW()', (err, res) => {console.log(err ? err : 'PostgreSQL OK!'); pool.end();});"
```

### Testar MinIO

Verifique se o bucket `la-villa-corretora` existe no seu MinIO.

## 5. Executar o Projeto

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 🎯 Próximos Passos

1. ✅ Adicione alguns usuários de teste
2. ✅ Faça upload de documentos
3. ✅ Teste o download e exclusão
4. ✅ Verifique os arquivos no MinIO

## ❓ Problemas Comuns

### Erro ao conectar no PostgreSQL
- Verifique se o IP/porta estão corretos
- Verifique se o firewall permite a conexão
- Confirme usuário e senha

### Erro ao fazer upload no MinIO
- Verifique o endpoint do MinIO
- Confirme as credenciais (Access Key e Secret Key)
- Verifique se o bucket existe
- Confirme se a porta está correta (geralmente 9000)

### Tabelas não encontradas
- Confirme que está usando o banco de dados correto
- Verifique se as tabelas `users` e `documentos` existem

## 📞 Suporte

Em caso de dúvidas, entre em contato com a equipe de desenvolvimento.

