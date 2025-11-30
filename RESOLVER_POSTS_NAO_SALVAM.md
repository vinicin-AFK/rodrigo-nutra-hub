# 🔧 Resolver: Posts Não Estão Sendo Salvos no Supabase

Este guia ajuda a diagnosticar e resolver o problema de publicações não aparecerem na tabela `posts` do Supabase.

---

## ✅ Passo 1: Executar Script SQL para Corrigir Políticas RLS

**CRÍTICO:** O problema mais comum é que as políticas RLS estão bloqueando a inserção de posts.

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Vá para **SQL Editor**
3. Cole o conteúdo do arquivo `supabase_fix_insert_posts.sql`
4. Clique em **"Run"** para executar

Este script:
- Remove políticas RLS antigas que podem estar bloqueando
- Cria uma política permissiva para INSERT
- Garante que usuários autenticados possam criar posts

---

## ✅ Passo 2: Verificar Autenticação

O app precisa estar autenticado no Supabase para salvar posts.

### Como verificar:

1. Abra o console do navegador (F12)
2. Crie uma publicação
3. Procure por no console:
   ```
   👤 Resultado da autenticação: { hasUser: true, userId: '...' }
   ```

Se `hasUser: false`, o problema é autenticação:
- Faça logout e login novamente
- Verifique se as variáveis de ambiente estão configuradas

---

## ✅ Passo 3: Verificar Erros no Console

Após criar uma publicação, verifique o console para erros específicos:

### Erro de RLS (Política):
```
❌ ERRO CRÍTICO ao salvar post no Supabase
🔒 Erro de Permissão (RLS)
```

**Solução:** Execute o script `supabase_fix_insert_posts.sql`

### Erro de Autenticação:
```
🔐 Erro de Autenticação
Você não está autenticado corretamente
```

**Solução:** Faça login novamente

### Erro de Perfil:
```
⚠️ Erro ao verificar perfil
```

**Solução:** O app tentará criar o perfil automaticamente, mas se falhar, verifique se a tabela `profiles` existe

---

## ✅ Passo 4: Verificar Políticas RLS no Supabase

1. No Supabase Dashboard, vá para **Authentication** → **Policies**
2. Selecione a tabela `posts`
3. Procure pela política: **"Usuários podem criar publicações"**
4. Verifique se está **ativa** (não desabilitada)
5. Verifique se a condição `WITH CHECK` está correta:
   ```sql
   auth.uid() IS NOT NULL AND auth.uid() = author_id
   ```

---

## ✅ Passo 5: Testar Inserção Manual

No SQL Editor do Supabase, execute (substitua `USER_ID` pelo ID de um usuário autenticado):

```sql
-- Primeiro, pegue o ID de um usuário autenticado
SELECT id, email FROM auth.users LIMIT 1;

-- Depois, tente inserir um post manualmente
-- (Substitua 'USER_ID_AQUI' pelo ID do usuário acima)
INSERT INTO posts (author_id, content, status, type)
VALUES ('USER_ID_AQUI', 'Teste manual', 'active', 'post')
RETURNING *;
```

**Se funcionar:** O problema está no código do app
**Se não funcionar:** O problema está nas políticas RLS

---

## ✅ Passo 6: Verificar Variáveis de Ambiente

No Vercel (se estiver usando):
1. Settings → Environment Variables
2. Verifique se `VITE_SUPABASE_URL` está configurada
3. Verifique se `VITE_SUPABASE_ANON_KEY` está configurada
4. Reinicie o deploy após alterar variáveis

---

## ✅ Passo 7: Verificar Logs Detalhados

O app agora mostra logs detalhados. Após criar uma publicação, procure por:

```
📤 Criando post no feed global...
📥 Resposta do Supabase: { hasData: true/false, hasError: true/false, ... }
```

**Se `hasError: true`:**
- Veja `errorMessage`, `errorCode`, `errorDetails`
- Isso indicará o problema exato

**Se `hasData: true`:**
- O post foi salvo com sucesso
- Verifique se aparece na tabela `posts` no Supabase Dashboard

---

## 🐛 Problemas Comuns e Soluções

### Problema 1: "permission denied" ou "row-level security"
**Causa:** Políticas RLS bloqueando
**Solução:** Execute `supabase_fix_insert_posts.sql`

### Problema 2: "JWT expired" ou "Invalid JWT"
**Causa:** Token de autenticação expirado
**Solução:** Faça logout e login novamente

### Problema 3: "new row violates row-level security policy"
**Causa:** Política RLS muito restritiva
**Solução:** Execute `supabase_fix_insert_posts.sql`

### Problema 4: Post aparece no app mas não no Supabase
**Causa:** Post foi salvo apenas localmente (localStorage)
**Solução:** 
- Verifique se Supabase está configurado
- Verifique se está autenticado
- Verifique erros no console

---

## 📊 Checklist de Diagnóstico

- [ ] Script `supabase_fix_insert_posts.sql` executado
- [ ] Políticas RLS verificadas e ativas
- [ ] Usuário está autenticado (`hasUser: true` no console)
- [ ] Variáveis de ambiente configuradas
- [ ] Teste manual de INSERT funcionou
- [ ] Logs do console não mostram erros
- [ ] Post aparece na tabela `posts` no Supabase Dashboard

---

## 🎯 Teste Final

1. Limpe o cache do app (botão 🗑️)
2. Faça login novamente
3. Crie uma publicação
4. Verifique no Supabase Dashboard → Table Editor → `posts`
5. A publicação deve aparecer lá

---

## 💡 Se Ainda Não Funcionar

1. **Copie o erro completo do console** (incluindo `errorCode`, `errorMessage`, `errorDetails`)
2. **Verifique se o perfil existe:**
   ```sql
   SELECT * FROM profiles WHERE id = 'USER_ID_AQUI';
   ```
3. **Verifique se RLS está habilitado:**
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'posts';
   ```
   Deve retornar `rowsecurity: true`

---

## 📝 Notas Importantes

- O app salva posts localmente primeiro (para feedback imediato)
- Depois tenta sincronizar com Supabase em background
- Se Supabase falhar, o post fica apenas local
- Erros agora são mostrados claramente com notificações visíveis
- Logs detalhados ajudam a identificar o problema exato

