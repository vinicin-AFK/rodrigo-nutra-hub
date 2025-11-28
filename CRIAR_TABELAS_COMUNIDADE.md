# 📋 Criar Tabelas da Comunidade no Supabase

Este guia explica como criar as tabelas para armazenar as publicações e mensagens do chat da comunidade no Supabase.

## 🎯 Tabelas que serão criadas

1. **`posts`** - Armazena todas as publicações da comunidade
2. **`community_messages`** - Armazena todas as mensagens do chat da comunidade
3. **`post_likes`** - Armazena as curtidas das publicações
4. **`comments`** - Armazena os comentários das publicações

## 📝 Passo a Passo

### 1. Acessar o Supabase Dashboard

1. Acesse [https://app.supabase.com/](https://app.supabase.com/)
2. Faça login na sua conta
3. Selecione o projeto do NutraHub

### 2. Abrir o SQL Editor

1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique em **"New query"** para criar uma nova query

### 3. Executar o Script SQL

1. Abra o arquivo `supabase_tabelas_comunidade.sql` que está na raiz do projeto
2. Copie **TODO** o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** ou pressione `Ctrl+Enter` (Windows/Linux) ou `Cmd+Enter` (Mac)

### 4. Verificar se foi criado com sucesso

Após executar o script, você verá uma mensagem de sucesso e uma tabela mostrando:
- Total de publicações ativas
- Total de mensagens ativas

## 📊 Estrutura das Tabelas

### Tabela `posts` (Publicações)

```sql
- id (UUID) - ID único da publicação
- author_id (UUID) - ID do autor (referência a profiles)
- content (TEXT) - Conteúdo da publicação
- image (TEXT) - URL da imagem (opcional)
- result_value (INTEGER) - Valor do resultado (opcional)
- type (TEXT) - Tipo: 'post' ou 'result'
- status (TEXT) - Status: 'active', 'deleted', 'hidden'
- created_at (TIMESTAMP) - Data de criação
- updated_at (TIMESTAMP) - Data de atualização
```

### Tabela `community_messages` (Mensagens do Chat)

```sql
- id (UUID) - ID único da mensagem
- author_id (UUID) - ID do autor (referência a profiles)
- content (TEXT) - Conteúdo da mensagem
- type (TEXT) - Tipo: 'text', 'audio', 'emoji', 'image'
- image (TEXT) - URL da imagem (opcional)
- audio_duration (INTEGER) - Duração do áudio em segundos (opcional)
- audio_url (TEXT) - URL do áudio (opcional)
- status (TEXT) - Status: 'active', 'deleted', 'hidden'
- created_at (TIMESTAMP) - Data de criação
- updated_at (TIMESTAMP) - Data de atualização
```

## 🔒 Segurança (RLS - Row Level Security)

Todas as tabelas têm **Row Level Security** habilitado com as seguintes políticas:

### Para Publicações (`posts`):
- ✅ **Leitura**: Todos podem ver publicações ativas
- ✅ **Criação**: Apenas usuários autenticados podem criar
- ✅ **Atualização**: Apenas o autor pode atualizar
- ✅ **Exclusão**: Apenas o autor pode deletar
- ✅ **Suporte**: Suporte/admin pode ver todas as publicações

### Para Mensagens (`community_messages`):
- ✅ **Leitura**: Todos podem ver mensagens ativas
- ✅ **Criação**: Apenas usuários autenticados podem criar
- ✅ **Atualização**: Apenas o autor pode atualizar
- ✅ **Exclusão**: Apenas o autor pode deletar
- ✅ **Suporte**: Suporte/admin pode ver todas as mensagens

## ⚡ Funcionalidades Automáticas

O script também cria:

1. **Índices** para melhorar a performance das consultas
2. **Triggers** para atualizar contadores automaticamente:
   - Contador de comentários em cada publicação
   - Contador de curtidas em cada publicação
   - Atualização automática do campo `updated_at`
3. **Validações** para garantir integridade dos dados

## 🔄 Se as tabelas já existirem

O script usa `CREATE TABLE IF NOT EXISTS`, então:
- ✅ Se as tabelas não existirem, elas serão criadas
- ✅ Se já existirem, nada será alterado
- ✅ Colunas adicionais serão adicionadas apenas se não existirem

## ✅ Verificação

Após executar o script, você pode verificar se tudo está funcionando:

```sql
-- Ver todas as publicações
SELECT * FROM posts ORDER BY created_at DESC LIMIT 10;

-- Ver todas as mensagens
SELECT * FROM community_messages ORDER BY created_at DESC LIMIT 10;

-- Ver estrutura das tabelas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts';
```

## 🚨 Troubleshooting

### Erro: "relation already exists"
- Isso é normal se as tabelas já existem
- O script não vai sobrescrever dados existentes

### Erro: "permission denied"
- Certifique-se de estar logado como administrador do projeto
- Verifique se você tem permissões para criar tabelas

### Erro: "column already exists"
- Isso é normal se as colunas já existem
- O script verifica antes de adicionar colunas

## 📞 Suporte

Se encontrar algum problema, verifique:
1. Se está usando o projeto correto no Supabase
2. Se tem permissões de administrador
3. Se o script foi copiado completamente
4. Se não há erros de sintaxe no SQL Editor

