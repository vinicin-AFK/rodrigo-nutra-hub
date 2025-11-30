# 🚀 Configurar Novo Banco de Dados Supabase

## ✅ Credenciais Configuradas

As credenciais do novo banco de dados já foram configuradas no arquivo `.env.local`:

- **URL:** `https://kfyzcqaerlwqcmlbcgts.supabase.co`
- **Anon Key:** Configurada

---

## 📋 Próximos Passos

### **Passo 1: Executar Scripts SQL no Novo Banco**

Você precisa executar os scripts SQL no **novo** banco de dados para criar as tabelas e políticas necessárias.

#### **1.1. Script Principal (Obrigatório)**

1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Selecione o projeto: `kfyzcqaerlwqcmlbcgts`
3. Vá para **SQL Editor**
4. Execute o script `supabase_setup.sql`:
   - Copie TODO o conteúdo do arquivo
   - Cole no SQL Editor
   - Clique em **Run**

**Este script cria:**
- ✅ Tabela `profiles` (perfis de usuários)
- ✅ Tabela `posts` (publicações)
- ✅ Tabela `comments` (comentários)
- ✅ Tabela `post_likes` (curtidas)
- ✅ Tabela `community_messages` (mensagens do chat)
- ✅ Tabela `achievements` (conquistas)
- ✅ Tabela `user_stats` (estatísticas)
- ✅ Políticas RLS (Row Level Security)
- ✅ Índices para performance

#### **1.2. Script de Correção de Posts (Recomendado)**

Após executar o script principal, execute também:

1. No mesmo SQL Editor
2. Execute o script `supabase_fix_posts_definitivo.sql`
3. Isso garante que as políticas de INSERT estão corretas

---

### **Passo 2: Verificar Configuração**

1. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Abra o console do navegador (F12)
3. Procure por:
   ```
   ✅ Supabase configurado: https://kfyzcqaerlwqcmlbcgts.supabase...
   🔑 Chave configurada: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

### **Passo 3: Testar Conexão**

1. Faça **logout** no app (se estiver logado)
2. Faça **registro** de um novo usuário
3. Verifique no Supabase Dashboard → **Table Editor** → `profiles`
4. O novo perfil deve aparecer lá

---

### **Passo 4: Testar Criação de Posts**

1. Crie uma publicação no app
2. Verifique no Supabase Dashboard → **Table Editor** → `posts`
3. A publicação deve aparecer lá

---

## 🔍 Verificações Importantes

### **Verificar se as Tabelas Foram Criadas:**

No SQL Editor do Supabase, execute:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Você deve ver:
- `achievements`
- `comments`
- `community_messages`
- `posts`
- `post_likes`
- `profiles`
- `user_stats`

### **Verificar Políticas RLS:**

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

---

## ⚠️ Importante

1. **Execute os scripts SQL na ordem:**
   - Primeiro: `supabase_setup.sql`
   - Depois: `supabase_fix_posts_definitivo.sql`

2. **Reinicie o servidor** após configurar o `.env.local`

3. **Faça logout e login novamente** para garantir que a sessão está usando o novo banco

4. **Dados antigos não serão migrados automaticamente** - você precisará criar novos usuários e posts no novo banco

---

## 🎯 Checklist

- [ ] Script `supabase_setup.sql` executado no novo banco
- [ ] Script `supabase_fix_posts_definitivo.sql` executado
- [ ] Servidor reiniciado (`npm run dev`)
- [ ] Console mostra "✅ Supabase configurado"
- [ ] Registro de novo usuário testado
- [ ] Criação de post testada
- [ ] Dados aparecem no Supabase Dashboard

---

## 🚨 Problemas Comuns

### **Erro: "Invalid API key"**

**Solução:** Verifique se o `.env.local` tem as credenciais corretas e reinicie o servidor.

### **Erro: "Table does not exist"**

**Solução:** Execute o script `supabase_setup.sql` no SQL Editor.

### **Erro: "row-level security policy violation"**

**Solução:** Execute o script `supabase_fix_posts_definitivo.sql` no SQL Editor.

### **Posts não aparecem no Supabase**

**Solução:** 
1. Verifique se executou os scripts SQL
2. Verifique se está autenticado (faça login novamente)
3. Verifique o console para erros específicos

---

## 📞 Próximos Passos

Após configurar tudo:

1. ✅ Teste criar um usuário
2. ✅ Teste criar um post
3. ✅ Teste enviar mensagem no chat
4. ✅ Verifique se tudo aparece no Supabase Dashboard

Se tudo funcionar, o novo banco está configurado corretamente! 🎉

