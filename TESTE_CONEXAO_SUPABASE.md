# 🔍 Teste de Conexão com Supabase

## Passo 1: Verificar Credenciais

Execute no terminal:

```bash
cat .env.local
```

Você deve ver:
```
VITE_SUPABASE_URL=https://kfyzcqaerlwqcmlbcgts.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Passo 2: Verificar no Console do Navegador

1. Abra o app no navegador
2. Abra o Console (F12)
3. Procure por:

**Se estiver conectado:**
```
✅ Supabase configurado: https://kfyzcqaerlwqcmlbcgts.supabase...
🔑 Chave configurada: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Se NÃO estiver conectado:**
```
⚠️ Supabase não configurado!
```

---

## Passo 3: Testar Inserção Manual no Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Selecione o projeto: `kfyzcqaerlwqcmlbcgts`
3. Vá para **SQL Editor**
4. Execute este teste:

```sql
-- 1. Verificar se você está autenticado
SELECT auth.uid() as user_id;

-- 2. Verificar se a tabela posts existe
SELECT * FROM information_schema.tables 
WHERE table_name = 'posts';

-- 3. Verificar políticas RLS
SELECT * FROM pg_policies 
WHERE tablename = 'posts';

-- 4. Testar inserção (substitua USER_ID pelo seu ID de usuário)
-- Primeiro, pegue seu user_id:
SELECT id FROM auth.users LIMIT 1;

-- Depois, tente inserir:
INSERT INTO posts (author_id, content, status, type)
VALUES ('SEU_USER_ID_AQUI', 'Teste manual', 'active', 'post')
RETURNING *;
```

---

## Passo 4: Verificar Erros no Console

Quando você tenta criar um post, o console deve mostrar:

**Se funcionar:**
```
📤 Tentativa 1/3 de inserir post no Supabase...
✅ Post inserido com sucesso na tentativa 1!
```

**Se falhar:**
```
❌ Tentativa 1 falhou: { error: "...", code: "42501" }
🔒 ERRO DE RLS DETECTADO!
```

---

## Problemas Comuns

### 1. "Supabase não configurado"
**Causa:** Variáveis de ambiente não estão sendo lidas
**Solução:** 
- Verifique se `.env.local` existe
- Reinicie o servidor (`npm run dev`)

### 2. "row-level security policy violation" (42501)
**Causa:** Políticas RLS bloqueando
**Solução:** Execute `supabase_fix_posts_definitivo.sql`

### 3. "JWT expired" ou "Invalid API key"
**Causa:** Credenciais inválidas
**Solução:** Verifique as credenciais no `.env.local`

### 4. "User not authenticated"
**Causa:** Usuário não está logado
**Solução:** Faça login no app

### 5. "Table does not exist"
**Causa:** Tabelas não foram criadas
**Solução:** Execute `supabase_setup.sql`

