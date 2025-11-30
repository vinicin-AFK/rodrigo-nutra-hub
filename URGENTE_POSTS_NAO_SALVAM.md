# 🚨 URGENTE: Posts Não Estão Sendo Salvos no Supabase

## ✅ Correções Implementadas

### 1. **Inserção Síncrona (não mais em background)**
- **ANTES:** Inserção era feita em background `(async () => { ... })()` sem aguardar
- **AGORA:** Inserção é **síncrona** - aguarda o resultado antes de continuar

### 2. **Retry de 3 Tentativas**
- Se a primeira tentativa falhar, tenta mais 2 vezes
- Aguarda 1s, 2s, 3s entre tentativas
- Logs detalhados de cada tentativa

### 3. **Logs Detalhados**
- Mostra cada tentativa de inserção
- Mostra resposta completa do Supabase
- Mostra erros específicos (RLS, autenticação, etc.)

---

## 🔧 AÇÃO IMEDIATA NECESSÁRIA

### Passo 1: Execute o Script SQL (CRÍTICO)

1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Vá para **SQL Editor**
3. Cole o conteúdo de `supabase_fix_insert_posts.sql`
4. Clique em **Run**

**Este é o passo mais importante!** Sem isso, as políticas RLS podem estar bloqueando a inserção.

### Passo 2: Verificar Autenticação

1. Abra o app
2. Faça **logout** e **login novamente**
3. Isso garante que o token de autenticação está válido

### Passo 3: Testar Criação de Post

1. Crie uma publicação
2. **Aguarde** (não feche o app imediatamente)
3. Verifique o console (F12) para ver os logs:
   ```
   📤 Tentativa 1/3 de inserir post no Supabase...
   📥 Resposta do Supabase (tentativa 1): { hasData: true/false, hasError: true/false, ... }
   ```

### Passo 4: Verificar no Supabase

1. Vá para **Table Editor** → `posts`
2. A publicação deve aparecer lá

---

## 🔍 Como Diagnosticar

### Se aparecer erro no console:

**Erro de RLS:**
```
❌ Tentativa 1 falhou: { error: "new row violates row-level security policy", code: "42501" }
```

**Solução:** Execute `supabase_fix_insert_posts.sql`

**Erro de Autenticação:**
```
❌ Tentativa 1 falhou: { error: "JWT expired", code: "PGRST301" }
```

**Solução:** Faça logout e login novamente

**Erro de Perfil:**
```
⚠️ Erro ao verificar perfil
```

**Solução:** O app tentará criar o perfil automaticamente

---

## 📊 Logs Esperados (Sucesso)

```
📤 Tentativa 1/3 de inserir post no Supabase...
📋 Dados: { author_id: "...", content_length: 50, has_image: false, type: "post" }
📥 Resposta do Supabase (tentativa 1): { hasData: true, hasError: false, postId: "..." }
✅ Post inserido com sucesso na tentativa 1!
✅ Postagem sincronizada com Supabase: [id]
```

---

## 📊 Logs Esperados (Falha)

```
📤 Tentativa 1/3 de inserir post no Supabase...
📥 Resposta do Supabase (tentativa 1): { hasData: false, hasError: true, errorMessage: "..." }
❌ Tentativa 1 falhou: { error: "...", code: "..." }
⏳ Aguardando 1000ms antes da próxima tentativa...
📤 Tentativa 2/3 de inserir post no Supabase...
...
```

---

## 🎯 Checklist de Resolução

- [ ] Script `supabase_fix_insert_posts.sql` executado
- [ ] Logout e login novamente
- [ ] Publicação criada
- [ ] Console mostra logs detalhados
- [ ] Post aparece na tabela `posts` do Supabase
- [ ] Notificação de sucesso aparece no app

---

## 💡 Se Ainda Não Funcionar

1. **Copie o erro completo do console** (incluindo `errorCode`, `errorMessage`, `errorDetails`)
2. **Verifique se o usuário está autenticado:**
   - No console, procure por: `👤 Resultado da autenticação: { hasUser: true, ... }`
3. **Teste inserção manual no Supabase:**
   ```sql
   -- Pegue o ID de um usuário autenticado
   SELECT id FROM auth.users LIMIT 1;
   
   -- Tente inserir manualmente (substitua USER_ID)
   INSERT INTO posts (author_id, content, status, type)
   VALUES ('USER_ID', 'Teste manual', 'active', 'post')
   RETURNING *;
   ```
   
   Se funcionar manualmente, o problema está no código do app.
   Se não funcionar, o problema está nas políticas RLS.

---

## 🚀 Mudanças no Código

### Antes:
```typescript
if (isSupabaseConfigured) {
  (async () => {  // ← Executava em background
    // inserção...
  })();
}
```

### Agora:
```typescript
if (isSupabaseConfigured) {
  try {
    // inserção com retry...
    // Aguarda resultado antes de continuar
  } catch (error) {
    // tratamento de erro...
  }
}
```

---

## ⚠️ IMPORTANTE

**A inserção agora é SÍNCRONA** - o app aguarda o resultado antes de continuar. Isso significa:
- ✅ Você verá erros imediatamente (se houver)
- ✅ Notificações de erro aparecerão
- ✅ Logs detalhados no console
- ⚠️ O app pode parecer "travado" por 1-3 segundos enquanto tenta inserir

**Isso é normal e necessário** para garantir que o post seja salvo!

