# Painel de Gestão - Corretor

Sistema completo de gestão de usuários e documentos com integração ao MinIO para armazenamento de arquivos.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização moderna e responsiva
- **PostgreSQL** - Banco de dados relacional
- **MinIO** - Armazenamento de objetos (S3-compatible)
- **ESLint & Prettier** - Qualidade e formatação de código

## 📋 Funcionalidades

### Gerenciamento de Usuários
- ✅ Listagem de usuários
- ✅ Cadastro de novos usuários (nome, sobrenome, email, telefone, documento, cidade, país)
- ✅ Exclusão de usuários
- ✅ Seleção de usuário para visualizar arquivos

### Gerenciamento de Arquivos
- ✅ Upload de múltiplos arquivos via drag-and-drop
- ✅ Suporte para imagens, PDFs, documentos Word e Excel
- ✅ Armazenamento no MinIO com paths organizados por usuário
- ✅ Download de arquivos
- ✅ Exclusão de arquivos
- ✅ Visualização de metadados (tamanho, data, origem)
- ✅ Campo opcional "origem" para categorizar uploads

## 🗄️ Estrutura do Banco de Dados

O sistema utiliza as seguintes tabelas existentes:

### Tabela `users`
- `id`, `first_name`, `last_name`, `email`, `phone`
- `city`, `country`, `address`, `number`, `postal_code`, `address_extra`
- `document`, `cargo`, `id_drive`, `clientes_associados`
- `active`, `metadata`, `created_at`, `updated_at`

### Tabela `documentos`
- `id`, `user_id`, `nome_arquivo`, `caminho_minio`
- `tipo`, `tamanho_bytes`, `origem`, `metadata`, `criado_em`

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/nexliaai/corretor.git
cd corretor
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

O arquivo `.env` já está configurado com as credenciais. Se necessário, ajuste o `MINIO_ENDPOINT`:

```env
MINIO_ENDPOINT=seu-endpoint-minio.com
```

### 4. Execute o projeto em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📦 Build para Produção

```bash
npm run build
npm start
```

## 🎨 Comandos Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Cria build de produção
npm start            # Inicia servidor de produção
npm run lint         # Verifica problemas com ESLint
npm run format       # Formata código com Prettier
npm run format:check # Verifica formatação sem alterar
```

## 📁 Estrutura do Projeto

```
corretor/
├── app/
│   ├── api/                # API Routes
│   │   ├── users/         # Endpoints de usuários
│   │   └── files/         # Endpoints de arquivos
│   ├── components/        # Componentes React
│   │   ├── UserList.tsx
│   │   ├── UserForm.tsx
│   │   ├── FileManager.tsx
│   │   ├── FileUpload.tsx
│   │   └── FileList.tsx
│   ├── types.ts          # Tipos TypeScript
│   ├── globals.css       # Estilos globais
│   ├── layout.tsx        # Layout principal
│   └── page.tsx          # Página inicial
├── lib/
│   ├── db.ts            # Configuração PostgreSQL
│   └── minio.ts         # Configuração MinIO
├── public/              # Arquivos estáticos
└── ...
```

## 🔌 API Endpoints

### Usuários

- `GET /api/users` - Lista todos os usuários
- `POST /api/users` - Cria novo usuário
- `DELETE /api/users/[id]` - Exclui usuário e seus arquivos

### Arquivos

- `GET /api/files?userId=X` - Lista arquivos de um usuário
- `POST /api/files/upload` - Upload de arquivo
- `GET /api/files/download?userId=X&fileName=Y` - Download de arquivo
- `DELETE /api/files/[id]` - Exclui arquivo

## 🔐 Configuração do MinIO

O sistema está configurado para usar o bucket `la-villa-corretora`. Os arquivos são organizados da seguinte forma:

```
la-villa-corretora/
  └── user_1/
      ├── 1699123456789_documento.pdf
      └── 1699123457890_foto.jpg
```

## 🎯 Uso do Sistema

1. **Adicionar Usuário**: Clique em "+ Novo" e preencha o formulário
2. **Selecionar Usuário**: Clique em um usuário na lista lateral
3. **Upload de Arquivos**: Arraste arquivos ou clique na área de upload
4. **Download**: Clique no ícone de download ao lado do arquivo
5. **Excluir**: Clique no ícone de lixeira (usuário ou arquivo)

## 🛠️ Tecnologias e Bibliotecas

- **react-dropzone** - Upload com drag-and-drop
- **lucide-react** - Ícones modernos
- **pg** - Cliente PostgreSQL
- **minio** - Cliente MinIO/S3

## 📝 Notas

- O sistema já está configurado para usar as tabelas existentes no banco
- Não é necessário executar migrations
- Os arquivos são armazenados de forma segura no MinIO
- A exclusão de usuário remove automaticamente todos os seus arquivos

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e pertence à Nexlia AI.

---

Desenvolvido com ❤️ pela equipe Nexlia AI

