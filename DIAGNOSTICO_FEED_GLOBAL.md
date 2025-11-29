# 🔍 Diagnóstico: Feed Global - Dois Aparelhos Não Veem Publicações

Este guia ajuda a diagnosticar e corrigir o problema onde dois aparelhos conectados não conseguem ver as publicações um do outro.

---

## ✅ Passo 1: Executar Script SQL no Supabase

**IMPORTANTE:** Execute o arquivo `supabase_fix_feed_global.sql` no SQL Editor do Supabase.

### Como executar:

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá para **SQL Editor** (no menu lateral esquerdo)
4. Cole o conteúdo do arquivo `supabase_fix_feed_global.sql`
5. Clique em **"Run"** para executar

### O que o script faz:

- ✅ Garante que todos os posts tenham `status = 'active'`
- ✅ Remove políticas RLS antigas que podem estar bloqueando
- ✅ Cria políticas RLS globais que permitem que TODOS vejam TODAS as publicações ativas
- ✅ Verifica se RLS está habilitado
- ✅ Mostra estatísticas de posts e mensagens

---

## ✅ Passo 2: Verificar Variáveis de Ambiente

Certifique-se de que as variáveis de ambiente estão configuradas corretamente:

### No arquivo `.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

### No Vercel (se estiver usando):

1. Acesse o [Vercel Dashboard](https://vercel.com/)
2. Vá para seu projeto
3. **Settings** → **Environment Variables**
4. Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas

---

## ✅ Passo 3: Limpar Cache Local

Cada aparelho pode ter cache local que está impedindo a sincronização.

### No navegador (desktop):

1. Abra as Ferramentas do Desenvolvedor (F12)
2. Vá para **Application** → **Local Storage**
3. Clique com o botão direito no domínio do seu app
4. Selecione **"Clear"** ou **"Limpar"**
5. Recarregue a página

### No mobile:

1. Abra o aplicativo
2. No header, procure o botão **"CLR"** (apenas em desenvolvimento)
3. Ou limpe os dados do navegador nas configurações do dispositivo

### Via console (qualquer dispositivo):

```javascript
localStorage.clear();
window.location.reload();
```

---

## ✅ Passo 4: Verificar Autenticação

Ambos os aparelhos precisam estar autenticados no Supabase.

### Como verificar:

1. Abra o console do navegador (F12)
2. Execute:

```javascript
// Verificar se está autenticado
const { data: { user } } = await supabase.auth.getUser();
console.log('Usuário autenticado:', user?.id);
```

3. Se `user` for `null`, faça login novamente

---

## ✅ Passo 5: Verificar Políticas RLS no Supabase

### No Supabase Dashboard:

1. Vá para **Authentication** → **Policies**
2. Selecione a tabela `posts`
3. Verifique se existe a política: **"Feed global - todos veem todas as publicações ativas"**
4. Verifique se a política está **ativa** (não desabilitada)

### Política esperada:

```sql
CREATE POLICY "Feed global - todos veem todas as publicações ativas"
  ON posts FOR SELECT
  USING (
    (status = 'active' OR status IS NULL) OR
    auth.uid() = author_id
  );
```

---

## ✅ Passo 6: Testar Criação de Post

### No Aparelho 1:

1. Faça login
2. Crie uma publicação
3. Verifique no console se aparece: `✅ Postagem sincronizada com Supabase: [id]`
4. Verifique se a publicação aparece no feed

### No Aparelho 2:

1. Faça login (com conta diferente)
2. Recarregue a página (ou aguarde alguns segundos)
3. Verifique se a publicação do Aparelho 1 aparece no feed

---

## ✅ Passo 7: Verificar no Supabase Dashboard

### Verificar se os posts estão sendo salvos:

1. No Supabase Dashboard, vá para **Table Editor**
2. Selecione a tabela `posts`
3. Verifique se as publicações estão lá
4. Verifique se o campo `status` está como `'active'`
5. Verifique se o campo `author_id` está preenchido

### Verificar se os posts são visíveis:

1. No Supabase Dashboard, vá para **SQL Editor**
2. Execute:

```sql
-- Verificar posts ativos
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

3. Se não aparecer nenhum post, pode haver um problema com a criação
4. Se aparecer posts, mas não aparecerem no app, pode haver um problema com RLS

---

## ✅ Passo 8: Verificar Logs do Console

### No console do navegador, procure por:

- ✅ `✅ Feed global sincronizado do Supabase - TODOS os usuários veem o mesmo conteúdo`
- ✅ `📊 Resultado Supabase: { data: X, error: null }`
- ❌ `⚠️ Erro ao sincronizar feed com Supabase`
- ❌ `❌ Erro ao buscar do Supabase`

### Se houver erros:

- **"Invalid API key"**: Verifique as variáveis de ambiente
- **"Row Level Security policy violation"**: Execute o script SQL novamente
- **"Timeout"**: Aumente o timeout ou verifique a conexão

---

## ✅ Passo 9: Forçar Recarregamento

### No código:

O app já tem sincronização automática a cada 30 segundos, mas você pode forçar:

1. Abra o console do navegador
2. Execute:

```javascript
// Forçar recarregamento do feed
window.dispatchEvent(new Event('posts-need-reload'));
```

---

## ✅ Passo 10: Verificar Realtime Subscription

O app usa Supabase Realtime para atualizar automaticamente quando há novas publicações.

### Como verificar:

1. No console, procure por:
   - `✅ Subscription ativa - recebendo atualizações em tempo real`
   - `🔄 Nova publicação detectada via Realtime`

2. Se não aparecer, pode haver um problema com a subscription

---

## 🎯 Checklist Final

- [ ] Script `supabase_fix_feed_global.sql` executado no Supabase
- [ ] Variáveis de ambiente configuradas corretamente
- [ ] Cache local limpo em ambos os aparelhos
- [ ] Ambos os aparelhos estão autenticados
- [ ] Políticas RLS verificadas e ativas
- [ ] Posts aparecem no Supabase Dashboard
- [ ] Posts têm `status = 'active'`
- [ ] Logs do console não mostram erros
- [ ] Realtime subscription está ativa

---

## 🆘 Se Ainda Não Funcionar

1. **Verifique os logs do console** em ambos os aparelhos
2. **Compare os IDs dos posts** no Supabase Dashboard com os que aparecem no app
3. **Teste com contas diferentes** para garantir que não é um problema de autenticação
4. **Verifique se o Supabase Realtime está habilitado** no projeto (Settings → API → Realtime)

---

## 📝 Notas Importantes

- O feed é **GLOBAL** - todos os usuários veem as mesmas publicações
- Não há filtro por usuário - isso é intencional para funcionar como rede social
- O localStorage é apenas **cache** - Supabase é a fonte de verdade
- Posts com `status = 'deleted'` ou `status = 'hidden'` não aparecem no feed
- Apenas posts com `status = 'active'` (ou NULL) são visíveis para todos

