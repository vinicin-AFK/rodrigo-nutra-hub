# 🔧 Como Resolver: Posts Não Estão Sendo Salvos no Supabase

## 🚨 Problema

Os posts criados no app não aparecem na tabela `posts` do Supabase.

---

## ✅ Solução Passo a Passo

### **Passo 1: Execute o Script SQL (CRÍTICO)**

Este é o passo **MAIS IMPORTANTE**. Sem isso, as políticas RLS (Row Level Security) podem estar bloqueando a inserção.

1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá para **SQL Editor** (menu lateral esquerdo)
4. Clique em **New Query**
5. **Copie TODO o conteúdo** do arquivo `supabase_fix_posts_definitivo.sql`
6. Cole no editor SQL
7. Clique em **Run** (ou pressione Ctrl+Enter)

**O que este script faz:**
- ✅ Remove políticas antigas que podem estar bloqueando
- ✅ Cria política permissiva para INSERT
- ✅ Garante que RLS está habilitado
- ✅ Cria índices para performance
- ✅ Mostra diagnóstico completo

---

### **Passo 2: Verificar Autenticação**

1. Abra o app no navegador
2. Abra o **Console** (F12)
3. Faça **logout** e **login novamente**
4. Isso garante que o token de autenticação está válido

---

### **Passo 3: Testar Criação de Post**

1. Crie uma nova publicação no app
2. **NÃO feche o app imediatamente** - aguarde alguns segundos
3. Abra o **Console** (F12) e procure por:

**Se funcionou:**
```
✅ Post inserido com sucesso na tentativa 1!
✅ Postagem sincronizada com Supabase: [id]
```

**Se falhou:**
```
❌ Tentativa 1 falhou: { error: "...", code: "42501" }
🔒 ERRO DE RLS DETECTADO!
```

---

### **Passo 4: Verificar no Supabase**

1. No Supabase Dashboard, vá para **Table Editor**
2. Selecione a tabela `posts`
3. A publicação deve aparecer lá

---

## 🔍 Diagnóstico de Problemas

### **Erro 1: "row-level security policy violation" (Código 42501)**

**Causa:** Políticas RLS estão bloqueando a inserção

**Solução:**
1. Execute o script `supabase_fix_posts_definitivo.sql` novamente
2. Verifique se a política `POLITICA_INSERT_POSTS_PERMISSIVA` foi criada:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'posts' AND cmd = 'INSERT';
   ```

---

### **Erro 2: "JWT expired" ou "Invalid API key"**

**Causa:** Token de autenticação expirado ou inválido

**Solução:**
1. Faça **logout** no app
2. Faça **login novamente**
3. Tente criar o post novamente

---

### **Erro 3: "User not authenticated"**

**Causa:** Usuário não está autenticado no Supabase

**Solução:**
1. Verifique se você está logado no app
2. Abra o console e procure por:
   ```
   👤 Resultado da autenticação: { hasUser: true, userId: "..." }
   ```
3. Se `hasUser: false`, faça login novamente

---

### **Erro 4: "Profile does not exist"**

**Causa:** Perfil do usuário não existe na tabela `profiles`

**Solução:**
1. O app tentará criar automaticamente
2. Se falhar, execute manualmente:
   ```sql
   -- Substitua USER_ID pelo ID do usuário autenticado
   INSERT INTO profiles (id, name, email)
   VALUES ('USER_ID', 'Nome do Usuário', 'email@exemplo.com');
   ```

---

## 📊 Verificações no Supabase

### **1. Verificar se a tabela existe:**
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'posts';
```

### **2. Verificar políticas RLS:**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'posts';
```

### **3. Verificar se RLS está habilitado:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'posts';
```

### **4. Testar inserção manual:**
```sql
-- Substitua USER_ID pelo ID de um usuário autenticado
INSERT INTO posts (author_id, content, status, type)
VALUES ('USER_ID', 'Teste manual', 'active', 'post')
RETURNING *;
```

Se este comando funcionar, o problema está no código do app.
Se não funcionar, o problema está nas políticas RLS.

---

## 🎯 Checklist de Resolução

- [ ] Script `supabase_fix_posts_definitivo.sql` executado no Supabase
- [ ] Logout e login novamente no app
- [ ] Publicação criada no app
- [ ] Console mostra logs detalhados
- [ ] **Nenhum erro de RLS** no console
- [ ] Post aparece na tabela `posts` do Supabase
- [ ] Notificação de sucesso aparece no app

---

## 💡 Dicas Importantes

1. **Sempre execute o script SQL primeiro** - 90% dos problemas são de RLS
2. **Aguarde alguns segundos** após criar o post - a sincronização pode levar tempo
3. **Verifique o console** - os logs mostram exatamente o que está acontecendo
4. **Teste no Supabase** - se a inserção manual funcionar, o problema está no código

---

## 🚀 Se Ainda Não Funcionar

1. **Copie o erro completo do console** (incluindo `errorCode`, `errorMessage`, `errorDetails`)
2. **Verifique as políticas RLS** no Supabase Dashboard
3. **Teste inserção manual** no SQL Editor do Supabase
4. **Verifique se o usuário está autenticado** no console

---

## 📞 Próximos Passos

Após executar o script SQL e testar:

1. Se funcionar: ✅ Problema resolvido!
2. Se não funcionar: Envie os logs do console para diagnóstico

