# 🌍 Arquitetura Global - Comunidade Única

## ✅ Configuração Atual

O app está configurado para usar **Supabase como backend único e global**:

- **Backend:** Supabase (PostgreSQL + Realtime)
- **URL Única:** Configurada via `VITE_SUPABASE_URL` no `.env.local`
- **Chave Única:** Configurada via `VITE_SUPABASE_ANON_KEY` no `.env.local`
- **Banco de Dados:** PostgreSQL global no Supabase
- **Real-time:** Supabase Realtime para sincronização instantânea

---

## 🔧 Garantir que Todos os Dispositivos Usam o Mesmo Backend

### 1. Variáveis de Ambiente

**CRÍTICO:** Todos os dispositivos (web, mobile, notebook) devem usar as **MESMAS** variáveis de ambiente.

**Arquivo:** `.env.local` (na raiz do projeto)

```env
VITE_SUPABASE_URL=https://kfyzcqaerlwqcmlbcgts.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

**⚠️ IMPORTANTE:**
- Não use `localhost` ou IPs locais
- Não use URLs diferentes por dispositivo
- Não use variáveis de ambiente diferentes em dev/prod

### 2. Verificar Configuração

Execute este comando para verificar se as variáveis estão configuradas:

```bash
cat .env.local | grep VITE_SUPABASE
```

**Deve mostrar:**
```
VITE_SUPABASE_URL=https://kfyzcqaerlwqcmlbcgts.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Reiniciar Servidor

Após alterar `.env.local`, **SEMPRE** reinicie o servidor:

```bash
# Parar o servidor (Ctrl+C)
# Depois iniciar novamente
npm run dev
```

### 4. Verificar no Console do Navegador

Abra o console (F12) e procure por:

```
✅ Supabase configurado: https://kfyzcqaerlwqcmlbcgts.supabase...
```

**Se aparecer:** ✅ Todos os dispositivos estão usando o mesmo backend

**Se NÃO aparecer:** ❌ Verifique `.env.local` e reinicie o servidor

---

## 📊 Como Funciona a Comunidade Global

### Feed Global

1. **Todos os posts vêm da mesma tabela:** `posts`
2. **Sem filtros por usuário:** Todos veem todas as publicações
3. **Ordenação:** Por data (mais recentes primeiro)
4. **Real-time:** Quando alguém posta, todos recebem atualização instantânea

**Query Supabase:**
```typescript
supabase
  .from('posts')
  .select('*')
  .order('created_at', { ascending: false })
  // ✅ SEM .eq('author_id', userId) - busca TODAS as postagens
```

### Chat Global

1. **Todas as mensagens vêm da mesma tabela:** `community_messages`
2. **Sem filtros por usuário:** Todos veem todas as mensagens
3. **Sem rooms separados:** Existe apenas uma sala global
4. **Real-time:** Quando alguém envia mensagem, todos recebem instantaneamente

**Query Supabase:**
```typescript
supabase
  .from('community_messages')
  .select('*')
  .order('created_at', { ascending: true })
  // ✅ SEM .eq('author_id', userId) - busca TODAS as mensagens
```

---

## 🔄 Sincronização Real-time

O app usa **Supabase Realtime** para sincronização instantânea:

### Posts
- Quando alguém cria um post → Todos recebem atualização
- Quando alguém comenta → Todos recebem atualização
- Quando alguém curte → Todos recebem atualização

### Mensagens
- Quando alguém envia mensagem → Todos recebem instantaneamente

**Subscription:**
```typescript
supabase
  .channel('posts_changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, ...)
  .subscribe()
```

---

## 🚨 Problemas Comuns e Soluções

### Problema: Dispositivos veem feeds diferentes

**Causa:** Cada dispositivo está usando localStorage como fallback

**Solução:**
1. Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configurados
2. Reinicie o servidor
3. Limpe o cache do navegador
4. Faça logout e login novamente

### Problema: Mensagens não aparecem em tempo real

**Causa:** Subscription de real-time não está ativa

**Solução:**
1. Verifique o console: deve aparecer `✅ Real-time ativo`
2. Verifique se o Supabase Realtime está habilitado no dashboard
3. Verifique se as políticas RLS permitem leitura

### Problema: Posts não aparecem em outros dispositivos

**Causa:** Post não foi salvo no Supabase (apenas no localStorage)

**Solução:**
1. Verifique o console ao criar post
2. Deve aparecer: `✅ Post inserido com sucesso na tentativa 1!`
3. Se aparecer erro, verifique autenticação e RLS

---

## ✅ Checklist de Verificação

Antes de testar em múltiplos dispositivos:

- [ ] `.env.local` tem `VITE_SUPABASE_URL` configurado
- [ ] `.env.local` tem `VITE_SUPABASE_ANON_KEY` configurado
- [ ] Servidor foi reiniciado após configurar `.env.local`
- [ ] Console mostra `✅ Supabase configurado`
- [ ] Console mostra `✅ Real-time ativo`
- [ ] Usuário está autenticado (console mostra `hasUser: true`)
- [ ] Posts são salvos no Supabase (verificar tabela `posts` no dashboard)
- [ ] Mensagens são salvas no Supabase (verificar tabela `community_messages` no dashboard)

---

## 🎯 Resultado Esperado

**Quando tudo estiver configurado corretamente:**

1. ✅ Usuário A posta → Usuário B vê instantaneamente
2. ✅ Usuário A envia mensagem → Usuário B recebe instantaneamente
3. ✅ Todos os dispositivos veem o mesmo feed
4. ✅ Todos os dispositivos veem o mesmo chat
5. ✅ Dados são salvos no Supabase (não apenas localStorage)

---

## 📝 Notas Técnicas

- **localStorage:** Usado apenas como cache local, não como fonte primária
- **Supabase:** Sempre a fonte primária de dados
- **Real-time:** Garante sincronização instantânea entre todos os dispositivos
- **RLS:** Políticas de segurança garantem que todos podem ler, mas apenas o autor pode editar/deletar

