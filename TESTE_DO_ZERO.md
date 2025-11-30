# 🧪 Teste do Zero - Feed Global

Este guia ajuda a testar o feed global do zero após limpar o banco de dados.

---

## ✅ Passo 1: Limpar Banco de Dados

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Vá para **SQL Editor** (no menu lateral esquerdo)
3. Cole o conteúdo do arquivo `supabase_limpar_tudo.sql`
4. Clique em **"Run"** para executar
5. Verifique se todas as tabelas estão vazias (o script mostra uma verificação no final)

---

## ✅ Passo 2: Garantir Políticas RLS Corretas

1. Ainda no **SQL Editor** do Supabase
2. Cole o conteúdo do arquivo `supabase_fix_feed_global.sql`
3. Clique em **"Run"** para executar
4. Isso garante que as políticas RLS estão corretas para feed global

---

## ✅ Passo 3: Limpar Cache Local em Ambos os Aparelhos

### No Aparelho 1:
1. Abra o app
2. Clique no botão 🗑️ (Limpar Cache) no header
3. Escolha "OK" para limpar cache mas manter login
4. Aguarde o app recarregar

### No Aparelho 2:
1. Repita os mesmos passos do Aparelho 1

---

## ✅ Passo 4: Testar Criação de Post

### No Aparelho 1:
1. Faça login (se necessário)
2. Crie uma publicação (texto ou imagem)
3. Verifique no console (se possível):
   ```
   ✅ Postagem sincronizada com Supabase: [id]
   ```
4. Verifique se a publicação aparece no feed do próprio aparelho

---

## ✅ Passo 5: Testar Feed Global

### No Aparelho 2:
1. Faça login (com conta DIFERENTE do Aparelho 1)
2. Clique no botão 🔄 (Forçar Sincronização) no header
3. Aguarde 10-15 segundos
4. A publicação do Aparelho 1 deve aparecer no feed

---

## 🔍 Verificar no Supabase Dashboard

### Verificar se o Post foi Salvo:
1. No Supabase Dashboard, vá para **Table Editor**
2. Selecione a tabela `posts`
3. Verifique se a publicação está lá
4. Verifique se o campo `status` está como `'active'`
5. Verifique se o campo `author_id` está preenchido

### Verificar Políticas RLS:
1. No Supabase Dashboard, vá para **Authentication** → **Policies**
2. Selecione a tabela `posts`
3. Verifique se existe a política: **"Feed global - todos veem todas as publicações ativas"**
4. Verifique se está **ativa** (não desabilitada)

---

## 🐛 Se Ainda Não Funcionar

### 1. Verificar Logs no Console

No Aparelho 2, procure por:
- `📱 Mobile - Tentativa 1/3`
- `📊 Resultado Supabase: { data: X, error: null }`
- `✅ Feed global sincronizado do Supabase`

Se aparecer erro:
- `❌ Todas as tentativas de sincronização falharam`
- Verifique a conexão
- Verifique se as variáveis de ambiente estão configuradas

### 2. Verificar Variáveis de Ambiente

No Vercel (se estiver usando):
- Settings → Environment Variables
- Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas

### 3. Testar Query Diretamente no Supabase

No SQL Editor do Supabase, execute:
```sql
-- Verificar se há posts ativos
SELECT 
  id,
  author_id,
  content,
  status,
  created_at
FROM posts
WHERE status = 'active' OR status IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

Se não aparecer nenhum post, o problema é na criação.
Se aparecer posts mas não aparecerem no app, o problema é nas políticas RLS ou na query.

### 4. Testar Políticas RLS

No SQL Editor do Supabase, execute:
```sql
-- Verificar políticas ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'posts'
ORDER BY policyname;
```

Deve aparecer a política "Feed global - todos veem todas as publicações ativas".

---

## 📊 Checklist Final

- [ ] Banco de dados limpo (todas as tabelas vazias)
- [ ] Políticas RLS aplicadas (`supabase_fix_feed_global.sql` executado)
- [ ] Cache local limpo em ambos os aparelhos
- [ ] Aparelho 1: Publicação criada com sucesso
- [ ] Aparelho 1: Publicação aparece no próprio feed
- [ ] Aparelho 2: Publicação aparece no feed após forçar sincronização
- [ ] Post aparece no Supabase Dashboard (tabela `posts`)
- [ ] Post tem `status = 'active'`
- [ ] Políticas RLS estão ativas

---

## 💡 Dicas

1. **Use Wi-Fi:** Teste primeiro com Wi-Fi para garantir que não é problema de conexão
2. **Aguarde:** No mobile, pode levar 10-20 segundos para sincronizar
3. **Forçar Sincronização:** Sempre use o botão 🔄 após criar publicação em outro aparelho
4. **Verificar Logs:** Se possível, abra o console do navegador para ver os logs

---

## 🎯 Resultado Esperado

Após seguir todos os passos:
- ✅ Aparelho 1 cria publicação → aparece no próprio feed
- ✅ Aparelho 2 força sincronização → publicação do Aparelho 1 aparece
- ✅ Ambos veem o mesmo feed global
- ✅ Publicações persistem após recarregar a página

