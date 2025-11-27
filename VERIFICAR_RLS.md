# 🔒 Verificar Políticas RLS no Supabase

O erro "Invalid API key" ao acessar tabelas geralmente indica um problema com as **políticas RLS (Row Level Security)**.

## 🔍 Diagnóstico

A autenticação funciona, mas o acesso às tabelas falha. Isso significa:
- ✅ A API key está correta para autenticação
- ❌ As políticas RLS estão bloqueando o acesso às tabelas

## ✅ Solução: Verificar e Corrigir Políticas RLS

### Passo 1: Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: `qxgejhovvzczmheudkmu`
3. No menu lateral, clique em **"Table Editor"**

### Passo 2: Verificar RLS nas Tabelas

Para cada tabela (`profiles`, `posts`, `comments`, `likes`, `community_messages`):

1. Clique na tabela
2. Vá na aba **"Policies"** (ou **"RLS"**)
3. Verifique se **"Enable RLS"** está ativado
4. Verifique se existem políticas que permitem:
   - **SELECT**: Para usuários autenticados
   - **INSERT**: Para usuários autenticados
   - **UPDATE**: Para o próprio usuário
   - **DELETE**: Para o próprio usuário (opcional)

### Passo 3: Criar Políticas se Não Existirem

Se as políticas não existirem, crie-as:

#### Para a tabela `profiles`:

```sql
-- Permitir SELECT para todos os usuários autenticados
CREATE POLICY "Users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Permitir INSERT para usuários autenticados
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Permitir UPDATE apenas do próprio perfil
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);
```

#### Para a tabela `posts`:

```sql
-- Permitir SELECT para todos
CREATE POLICY "Anyone can view posts"
ON posts FOR SELECT
TO authenticated
USING (true);

-- Permitir INSERT para usuários autenticados
CREATE POLICY "Users can create posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Permitir UPDATE apenas do próprio post
CREATE POLICY "Users can update their own posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = author_id);
```

#### Para a tabela `community_messages`:

```sql
-- Permitir SELECT para todos os usuários autenticados
CREATE POLICY "Users can view all messages"
ON community_messages FOR SELECT
TO authenticated
USING (true);

-- Permitir INSERT para usuários autenticados
CREATE POLICY "Users can send messages"
ON community_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### Passo 4: Executar SQL no Supabase

1. No Supabase Dashboard, vá em **"SQL Editor"**
2. Cole o SQL acima (ajuste conforme necessário)
3. Clique em **"Run"**
4. Verifique se as políticas foram criadas

### Passo 5: Testar Novamente

Execute:
```bash
node test-supabase.js
```

Se ainda não funcionar, pode ser necessário **regenerar a API key**:

1. Vá em **Settings** → **API**
2. Clique em **"Reset"** ou **"Regenerate"** na chave "anon public"
3. Copie a nova chave
4. Atualize o `.env.local`

## 🔄 Alternativa: Desabilitar RLS Temporariamente (NÃO RECOMENDADO)

Se você quiser testar rapidamente, pode desabilitar RLS:

```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages DISABLE ROW LEVEL SECURITY;
```

⚠️ **ATENÇÃO**: Isso remove a segurança. Use apenas para testes!

