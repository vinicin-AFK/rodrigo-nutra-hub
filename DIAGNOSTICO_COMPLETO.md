# 🔍 Diagnóstico Completo: Por Que Nada Está Sendo Salvo?

## ✅ Checklist de Verificação

### 1. **Credenciais Configuradas?**
- [ ] Arquivo `.env.local` existe
- [ ] `VITE_SUPABASE_URL` está correto
- [ ] `VITE_SUPABASE_ANON_KEY` está correto
- [ ] Servidor foi reiniciado após configurar

**Como verificar:**
```bash
cat .env.local
```

**Deve mostrar:**
```
VITE_SUPABASE_URL=https://kfyzcqaerlwqcmlbcgts.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 2. **Tabelas Criadas no Supabase?**
- [ ] Script `supabase_setup.sql` foi executado
- [ ] Script `supabase_fix_posts_definitivo.sql` foi executado
- [ ] Tabelas existem no Supabase Dashboard

**Como verificar:**
1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Vá para **Table Editor**
3. Você deve ver: `profiles`, `posts`, `comments`, `post_likes`, `community_messages`

**Se não existir, execute:**
```sql
-- No SQL Editor do Supabase
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

### 3. **Políticas RLS Configuradas?**
- [ ] Política de INSERT existe
- [ ] Política de SELECT existe
- [ ] RLS está habilitado

**Como verificar:**
```sql
-- No SQL Editor do Supabase
SELECT * FROM pg_policies 
WHERE tablename = 'posts';
```

**Deve mostrar pelo menos:**
- `POLITICA_INSERT_POSTS_PERMISSIVA` (cmd = INSERT)
- `POLITICA_SELECT_POSTS_PUBLICA` (cmd = SELECT)

---

### 4. **App Está Conectado?**
- [ ] Console mostra "✅ Supabase configurado"
- [ ] Não mostra "⚠️ Supabase não configurado"

**Como verificar:**
1. Abra o app no navegador
2. Abra o Console (F12)
3. Procure por mensagens do Supabase

---

### 5. **Usuário Está Autenticado?**
- [ ] Usuário fez login
- [ ] Console mostra `hasUser: true`
- [ ] Token não está expirado

**Como verificar:**
1. Abra o Console (F12)
2. Tente criar um post
3. Procure por:
```
👤 Resultado da autenticação: { hasUser: true, userId: "..." }
```

**Se `hasUser: false`:**
- Faça logout e login novamente

---

### 6. **Erros no Console?**
- [ ] Não há erros de RLS (código 42501)
- [ ] Não há erros de autenticação (JWT expired)
- [ ] Não há erros de API key inválida

**Como verificar:**
1. Abra o Console (F12)
2. Tente criar um post
3. Procure por mensagens de erro em vermelho

---

## 🚨 Problemas Mais Comuns

### **Problema 1: Scripts SQL Não Foram Executados**

**Sintomas:**
- Erro: "Table does not exist"
- Tabelas não aparecem no Supabase Dashboard

**Solução:**
1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Vá para **SQL Editor**
3. Execute `supabase_setup.sql`
4. Execute `supabase_fix_posts_definitivo.sql`

---

### **Problema 2: Políticas RLS Bloqueando**

**Sintomas:**
- Erro: "row-level security policy violation" (código 42501)
- Console mostra: "🔒 ERRO DE RLS DETECTADO!"

**Solução:**
1. Execute `supabase_fix_posts_definitivo.sql` novamente
2. Verifique se a política `POLITICA_INSERT_POSTS_PERMISSIVA` existe:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'posts' AND cmd = 'INSERT';
   ```

---

### **Problema 3: Usuário Não Autenticado**

**Sintomas:**
- Erro: "User not authenticated"
- Console mostra: `hasUser: false`

**Solução:**
1. Faça logout no app
2. Faça login novamente
3. Tente criar um post novamente

---

### **Problema 4: Credenciais Inválidas**

**Sintomas:**
- Erro: "Invalid API key" ou "JWT expired"
- Console mostra: "⚠️ Supabase não configurado"

**Solução:**
1. Verifique o arquivo `.env.local`
2. Verifique se as credenciais estão corretas no Supabase Dashboard
3. Reinicie o servidor (`npm run dev`)

---

### **Problema 5: Perfil Não Existe**

**Sintomas:**
- Erro ao criar post
- Perfil não aparece na tabela `profiles`

**Solução:**
1. Faça logout e login novamente (isso cria o perfil automaticamente)
2. Ou crie manualmente:
   ```sql
   INSERT INTO profiles (id, name, email)
   VALUES ('USER_ID', 'Nome', 'email@exemplo.com');
   ```

---

## 🔧 Teste Passo a Passo

### **Teste 1: Verificar Conexão**

1. Abra o Console (F12)
2. Procure por: "✅ Supabase configurado"
3. Se não aparecer, verifique `.env.local` e reinicie o servidor

---

### **Teste 2: Verificar Autenticação**

1. Faça login no app
2. Abra o Console (F12)
3. Tente criar um post
4. Procure por: `👤 Resultado da autenticação: { hasUser: true }`
5. Se `hasUser: false`, faça logout e login novamente

---

### **Teste 3: Verificar Inserção**

1. Tente criar um post
2. Abra o Console (F12)
3. Procure por:
   ```
   📤 Tentativa 1/3 de inserir post no Supabase...
   ✅ Post inserido com sucesso na tentativa 1!
   ```
4. Se falhar, veja o erro específico

---

### **Teste 4: Verificar no Supabase**

1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Vá para **Table Editor** → `posts`
3. O post deve aparecer lá
4. Se não aparecer, verifique os erros no console

---

## 📊 Comandos SQL Úteis

### **Verificar Tabelas:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### **Verificar Políticas:**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'posts';
```

### **Verificar RLS:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'posts';
```

### **Testar Inserção Manual:**
```sql
-- Pegue seu user_id primeiro
SELECT id FROM auth.users LIMIT 1;

-- Depois insira
INSERT INTO posts (author_id, content, status, type)
VALUES ('SEU_USER_ID', 'Teste', 'active', 'post')
RETURNING *;
```

---

## 🎯 Próximos Passos

1. **Execute o checklist acima** e marque o que está OK
2. **Identifique o problema** específico
3. **Siga a solução** correspondente
4. **Teste novamente** após corrigir

---

## 💡 Dica Final

**90% dos problemas são:**
1. Scripts SQL não executados
2. Políticas RLS bloqueando
3. Usuário não autenticado

**Comece verificando esses 3 pontos primeiro!**

