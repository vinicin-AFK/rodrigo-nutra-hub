# 🔍 Debug: Erro Persistente no Vercel

## ⚠️ Problema

Mesmo após configurar as variáveis no Vercel, o erro ainda persiste.

## 🔍 Passos para Diagnosticar

### 1. Verificar Console do Navegador

Abra o console (F12) e procure por:

```
🔍 VALIDAÇÃO SUPABASE - BOOT DO APP
🔍 SUPABASE_URL: ...
🔍 SUPABASE_KEY: ...
```

**O que procurar:**
- Se `SUPABASE_URL` mostra `❌ NÃO CONFIGURADO` → Variável não está configurada
- Se mostra uma URL diferente → Variável está com valor errado
- Se mostra a URL correta mas ainda dá erro → Problema na validação

### 2. Verificar Logs Detalhados

Procure por:

```
🔍 Validação detalhada:
🔍 envUrl original: ...
🔍 envUrl normalizada: ...
🔍 URL esperada: ...
🔍 envKey length: ...
```

**O que procurar:**
- `envUrl original` deve mostrar a URL completa
- `envUrl normalizada` deve ser igual a `URL esperada`
- `envKey length` deve ser maior que 20

### 3. Verificar Variáveis no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto
3. Vá em **Settings** → **Environment Variables**
4. Verifique:

**VITE_SUPABASE_URL:**
- ✅ Deve estar marcada para **Production**
- ✅ Valor deve ser exatamente: `https://kfyzcqaerlwqcmlbcgts.supabase.co`
- ❌ Não pode ter espaços no início ou fim
- ❌ Não pode ter trailing slash (`/`)

**VITE_SUPABASE_ANON_KEY:**
- ✅ Deve estar marcada para **Production**
- ✅ Valor deve ser a chave completa
- ✅ Deve ter mais de 20 caracteres
- ❌ Não pode ter espaços no início ou fim

### 4. Verificar se Foi Feito Redeploy

**IMPORTANTE:** Após adicionar/editar variáveis, você DEVE fazer redeploy:

1. Vá em **Deployments**
2. Clique nos **3 pontos** do último deployment
3. Selecione **Redeploy**
4. Aguarde completar

**OU** via CLI:
```bash
vercel --prod
```

### 5. Verificar Build Logs

No Vercel Dashboard:
1. Vá em **Deployments**
2. Clique no último deployment
3. Veja os **Build Logs**

**O que procurar:**
- Se mostra `VITE_SUPABASE_URL` nos logs
- Se mostra algum erro relacionado a variáveis

---

## 🛠️ Soluções Comuns

### Problema: Variável não aparece no console

**Causa:** Variável não está marcada para Production ou não foi feito redeploy

**Solução:**
1. Editar variável no Vercel
2. Marcar **Production**
3. Salvar
4. Fazer **Redeploy**

### Problema: URL aparece mas é diferente

**Causa:** Variável tem valor errado ou tem espaços

**Solução:**
1. Editar variável no Vercel
2. Copiar valor exato: `https://kfyzcqaerlwqcmlbcgts.supabase.co`
3. Colar sem espaços
4. Salvar
5. Fazer **Redeploy**

### Problema: Key aparece mas é muito curta

**Causa:** Key está truncada ou incompleta

**Solução:**
1. Verificar key completa no Supabase Dashboard
2. Copiar key completa
3. Colar no Vercel (sem espaços)
4. Salvar
5. Fazer **Redeploy**

### Problema: Variáveis estão corretas mas erro persiste

**Causa:** Cache do navegador ou build antigo

**Solução:**
1. Limpar cache do navegador (Ctrl+Shift+Delete)
2. Fazer hard refresh (Ctrl+Shift+R)
3. Tentar em modo anônimo
4. Verificar se o deployment mais recente foi usado

---

## 📋 Checklist de Debug

- [ ] Console mostra `SUPABASE_URL` configurada
- [ ] Console mostra `SUPABASE_KEY` configurada
- [ ] URL no console é exatamente `https://kfyzcqaerlwqcmlbcgts.supabase.co`
- [ ] Key no console tem mais de 20 caracteres
- [ ] Variáveis no Vercel estão marcadas para **Production**
- [ ] Foi feito **Redeploy** após configurar variáveis
- [ ] Cache do navegador foi limpo
- [ ] Tentou em modo anônimo

---

## 🚨 Se Nada Funcionar

### Opção 1: Verificar Build Logs

1. Vá em **Deployments** → Último deployment
2. Veja **Build Logs**
3. Procure por `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY`
4. Verifique se aparecem nos logs

### Opção 2: Testar Localmente

1. Criar arquivo `.env.local`:
```env
VITE_SUPABASE_URL=https://kfyzcqaerlwqcmlbcgts.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

2. Rodar localmente:
```bash
npm run dev
```

3. Verificar se funciona localmente
4. Se funcionar localmente, problema é no Vercel

### Opção 3: Verificar via API do Vercel

Se tiver acesso à API do Vercel, verificar variáveis:

```bash
vercel env ls
```

Isso mostra todas as variáveis configuradas.

---

## 💡 Dica Final

**A validação foi ajustada para ser mais tolerante:**
- Remove espaços automaticamente
- Remove trailing slash
- Permite URLs que contenham o domínio correto mesmo com pequenas diferenças

**Mas ainda requer:**
- URL deve conter `kfyzcqaerlwqcmlbcgts.supabase.co`
- Key deve ter mais de 20 caracteres
- Variáveis devem estar marcadas para Production
- Deve fazer redeploy após configurar

---

## 📞 Próximos Passos

1. Verificar console do navegador
2. Verificar variáveis no Vercel
3. Fazer redeploy
4. Limpar cache
5. Testar novamente

Se ainda não funcionar, compartilhe:
- Screenshot do console
- Screenshot das variáveis no Vercel
- Logs do build no Vercel

