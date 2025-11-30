# 🔍 Debug: Por Que Nada Está Sendo Salvo?

## 🚨 Passo 1: Verificar Console do Navegador

1. Abra o app no navegador
2. Abra o **Console** (F12 ou Cmd+Option+I)
3. Tente criar um post
4. **Copie TODAS as mensagens** que aparecem, especialmente:
   - Mensagens que começam com `❌`
   - Mensagens que começam com `🔒`
   - Mensagens que começam com `⚠️`
   - Qualquer erro em vermelho

---

## 🚨 Passo 2: Verificar Se Supabase Está Configurado

No console, procure por:

**Se estiver configurado:**
```
✅ Supabase configurado: https://kfyzcqaerlwqcmlbcgts.supabase...
🔑 Chave configurada: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Se NÃO estiver configurado:**
```
⚠️ Supabase não configurado!
❌ CRÍTICO: Supabase NÃO está configurado!
```

**Se aparecer "não configurado":**
1. Verifique o arquivo `.env.local`:
   ```bash
   cat .env.local
   ```
2. Deve mostrar:
   ```
   VITE_SUPABASE_URL=https://kfyzcqaerlwqcmlbcgts.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. **Reinicie o servidor** (`npm run dev`)

---

## 🚨 Passo 3: Verificar Autenticação

No console, ao criar um post, procure por:

```
👤 Resultado da autenticação: { hasUser: true, userId: "..." }
🔑 Sessão: { hasSession: true, userId: "..." }
```

**Se `hasUser: false`:**
- Faça **logout** e **login novamente**
- Isso recria a sessão do Supabase

---

## 🚨 Passo 4: Verificar Erros de Inserção

No console, ao criar um post, procure por:

**Se funcionar:**
```
📤 Tentativa 1/3 de inserir post no Supabase...
✅ Post inserido com sucesso na tentativa 1!
✅ Postagem sincronizada com Supabase: [id]
```

**Se falhar:**
```
❌ Tentativa 1 falhou: { error: "...", code: "42501" }
🔒 ERRO DE RLS DETECTADO!
```

**Erro 42501 = Política RLS bloqueando**
- Execute `supabase_fix_posts_definitivo.sql` no Supabase

**Outros erros:**
- Copie o erro completo e me envie

---

## 🚨 Passo 5: Executar Script de Teste no Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Selecione o projeto: `kfyzcqaerlwqcmlbcgts`
3. Vá para **SQL Editor**
4. Execute o arquivo `TESTE_SUPABASE_COMPLETO.sql`
5. **Copie TODOS os resultados** e me envie

Este script verifica:
- ✅ Se as tabelas existem
- ✅ Se RLS está habilitado
- ✅ Se as políticas existem
- ✅ Se há dados nas tabelas
- ✅ Se há usuários autenticados

---

## 🚨 Passo 6: Verificar Tabelas no Supabase

1. No Supabase Dashboard, vá para **Table Editor**
2. Verifique se estas tabelas existem:
   - `profiles`
   - `posts`
   - `comments`
   - `post_likes`
   - `community_messages`

**Se não existirem:**
- Execute `supabase_setup.sql` no SQL Editor

---

## 🚨 Passo 7: Testar Inserção Manual

No SQL Editor do Supabase, execute:

```sql
-- 1. Pegar seu user_id
SELECT id, email FROM auth.users LIMIT 1;

-- 2. Substituir USER_ID abaixo pelo ID acima e executar:
INSERT INTO posts (author_id, content, status, type)
VALUES ('USER_ID_AQUI', 'Teste manual', 'active', 'post')
RETURNING *;
```

**Se funcionar:**
- O problema está no código do app
- Verifique os logs do console

**Se não funcionar:**
- O problema está nas políticas RLS
- Execute `supabase_fix_posts_definitivo.sql`

---

## 📋 Checklist de Verificação

- [ ] Console mostra "✅ Supabase configurado"
- [ ] Console mostra `hasUser: true` ao criar post
- [ ] Console mostra "✅ Post inserido com sucesso"
- [ ] Tabelas existem no Supabase Dashboard
- [ ] Script `supabase_setup.sql` foi executado
- [ ] Script `supabase_fix_posts_definitivo.sql` foi executado
- [ ] Servidor foi reiniciado após configurar `.env.local`
- [ ] Usuário fez logout e login novamente

---

## 🎯 Próximos Passos

1. **Execute o script `TESTE_SUPABASE_COMPLETO.sql`** no Supabase
2. **Copie os resultados** e me envie
3. **Copie os logs do console** ao tentar criar um post
4. Com essas informações, posso identificar o problema exato!

---

## 💡 Dica

**90% dos problemas são:**
1. Scripts SQL não executados
2. Políticas RLS bloqueando
3. Usuário não autenticado
4. Servidor não reiniciado após mudar `.env.local`

**Verifique esses 4 pontos primeiro!**

