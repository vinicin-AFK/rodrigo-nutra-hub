# 📱 Correções para Feed Global no Mobile

Este documento descreve as melhorias implementadas para garantir que o feed global funcione corretamente no mobile.

---

## ✅ Problemas Identificados e Soluções

### 1. **Timeout Muito Curto no Mobile**

**Problema:** Conexões móveis são mais lentas e instáveis, causando timeouts prematuros.

**Solução:**
- ✅ Timeout aumentado de 8s para 15s no mobile (12s no desktop)
- ✅ Segunda tentativa automática no mobile após timeout
- ✅ Timeout de query aumentado de 10s para 15s no mobile

### 2. **Cache Local Priorizado no Mobile**

**Problema:** O mobile pode carregar cache local desatualizado antes de sincronizar com Supabase.

**Solução:**
- ✅ Mobile sempre tenta sincronizar com Supabase primeiro
- ✅ Se Supabase falhar, tenta novamente antes de usar cache
- ✅ Cache local usado apenas como último recurso

### 3. **Sincronização Periódica Menos Frequente**

**Problema:** Mobile precisa de sincronização mais frequente devido a conexões instáveis.

**Solução:**
- ✅ Mobile: sincronização a cada 20 segundos
- ✅ Desktop: sincronização a cada 30 segundos

---

## 🔧 Como Testar no Mobile

### Passo 1: Limpar Cache

1. Abra o app no mobile
2. Clique no botão de limpar cache (🗑️) no header
3. Escolha "OK" para limpar cache mas manter login
4. Aguarde o app recarregar

### Passo 2: Verificar Sincronização

1. Abra o console do navegador (se possível) ou verifique os logs
2. Procure por:
   - `📱 Mobile detectado - timeout: 15000ms`
   - `✅ Feed global sincronizado do Supabase`
   - `🔄 Sincronização periódica de posts (Mobile)...`

### Passo 3: Testar com Dois Aparelhos

1. **Aparelho 1:**
   - Faça login
   - Crie uma publicação
   - Verifique se aparece: `✅ Postagem sincronizada com Supabase`

2. **Aparelho 2:**
   - Faça login (conta diferente)
   - Aguarde alguns segundos (ou puxe para baixo para atualizar)
   - A publicação do Aparelho 1 deve aparecer

---

## 🐛 Se Ainda Não Funcionar

### Verificar Políticas RLS

Execute o script `supabase_fix_feed_global.sql` no Supabase Dashboard:

1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Vá para **SQL Editor**
3. Cole o conteúdo de `supabase_fix_feed_global.sql`
4. Clique em **Run**

### Verificar Variáveis de Ambiente

No mobile, as variáveis de ambiente podem não estar configuradas. Verifique:

1. No Vercel (se estiver usando):
   - Settings → Environment Variables
   - Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas

2. No `.env.local` (desenvolvimento local):
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon
   ```

### Verificar Autenticação

Ambos os aparelhos precisam estar autenticados:

1. No console do navegador (se possível):
   ```javascript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('Usuário:', user?.id);
   ```

2. Se `user` for `null`, faça login novamente

### Forçar Sincronização

No console do navegador (se possível):

```javascript
// Forçar recarregamento do feed
window.dispatchEvent(new Event('posts-need-reload'));
```

---

## 📊 Logs Esperados no Mobile

### Sincronização Bem-Sucedida:
```
📱 Mobile detectado - timeout: 15000ms
🌍 COMUNIDADE GLOBAL: Sincronizando FEED GLOBAL com Supabase...
📊 Resultado Supabase: { data: X, error: null }
✅ Feed global sincronizado do Supabase
```

### Se Houver Timeout:
```
⚠️ Erro ao sincronizar com Supabase, usando cache local: Timeout
🔄 Mobile: Tentando sincronizar novamente após timeout...
✅ Feed global sincronizado do Supabase (segunda tentativa)
```

### Sincronização Periódica:
```
🔄 Sincronização periódica de posts (Mobile)...
```

---

## 🎯 Checklist para Mobile

- [ ] Cache limpo em ambos os aparelhos
- [ ] Script `supabase_fix_feed_global.sql` executado
- [ ] Variáveis de ambiente configuradas
- [ ] Ambos os aparelhos autenticados
- [ ] Logs mostram "Mobile detectado"
- [ ] Logs mostram "Feed global sincronizado"
- [ ] Publicação criada no Aparelho 1 aparece no Aparelho 2

---

## 💡 Dicas Adicionais

1. **Conexão Wi-Fi:** Teste primeiro com Wi-Fi para garantir que não é problema de conexão
2. **Aguardar:** No mobile, pode levar alguns segundos para sincronizar - aguarde 10-15 segundos
3. **Puxar para Baixo:** Muitos apps mobile têm "pull to refresh" - tente puxar o feed para baixo para forçar atualização
4. **Fechar e Reabrir:** Feche completamente o app e reabra para garantir que não há cache em memória

