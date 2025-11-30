# 🚀 Configurar Variáveis de Ambiente no Vercel

## ⚠️ Problema Atual

O app em produção está mostrando a tela de erro porque as variáveis de ambiente não estão configuradas corretamente no Vercel.

**URL de produção:** `rodrigo-nutra-hub.vercel.app`

**Erro:** "Conexão com o Supabase incorreta"

---

## ✅ Solução: Configurar Variáveis no Vercel

### Passo 1: Acessar Dashboard do Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: `rodrigo-nutra-hub`

### Passo 2: Configurar Variáveis de Ambiente

1. Vá em **Settings** → **Environment Variables**
2. Adicione as seguintes variáveis:

#### Variável 1:
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://kfyzcqaerlwqcmlbcgts.supabase.co`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

#### Variável 2:
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeXpjcWFlcmx3cWNtbGJjZ3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MDQ2MjksImV4cCI6MjA4MDA4MDYyOX0.gj215HUlQ_b-68u2LC2LCwxpCDWGia1OaBOq5Zfoa04`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

### Passo 3: Fazer Redeploy

Após adicionar as variáveis:

1. Vá em **Deployments**
2. Clique nos **3 pontos** do último deployment
3. Selecione **Redeploy**
4. Aguarde o deploy completar

**OU**

Execute no terminal:
```bash
vercel --prod
```

---

## 🔍 Como Verificar

### 1. Verificar Variáveis no Vercel

1. Vá em **Settings** → **Environment Variables**
2. Deve mostrar:
   - ✅ `VITE_SUPABASE_URL` = `https://kfyzcqaerlwqcmlbcgts.supabase.co`
   - ✅ `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOi...` (chave completa)

### 2. Verificar no App

Após redeploy, acesse: `https://rodrigo-nutra-hub.vercel.app`

**Deve:**
- ✅ Não mostrar tela de erro
- ✅ Carregar o app normalmente
- ✅ Console mostrar: `✅ Supabase configurado corretamente`

### 3. Verificar Console do Navegador

Abra o console (F12) e procure por:

```
🔍 SUPABASE_URL: https://kfyzcqaerlwqcmlbcgts.supabase.co
🔍 SUPABASE_KEY: eyJhbGciOi...
✅ Supabase configurado corretamente
```

**Se aparecer:**
```
❌ ERRO CRÍTICO DE CONFIGURAÇÃO DO SUPABASE
```
**Ação:** Verificar variáveis no Vercel e fazer redeploy.

---

## 🚨 Problemas Comuns

### Problema: Tela de erro ainda aparece após configurar

**Causa:** Variáveis não foram aplicadas ou deploy não foi refeito

**Solução:**
1. Verificar que variáveis estão em **Production** (não apenas Preview)
2. Fazer **Redeploy** após adicionar variáveis
3. Limpar cache do navegador

### Problema: Variáveis não aparecem no build

**Causa:** Variáveis configuradas apenas em Preview/Development

**Solução:**
1. Editar cada variável
2. Marcar **Production** também
3. Fazer redeploy

### Problema: URL diferente no console

**Causa:** Variável `VITE_SUPABASE_URL` tem valor diferente

**Solução:**
1. Verificar valor exato no Vercel
2. Deve ser: `https://kfyzcqaerlwqcmlbcgts.supabase.co`
3. Não pode ter espaços ou caracteres extras

---

## 📋 Checklist de Configuração

Antes de fazer deploy:

- [ ] Variável `VITE_SUPABASE_URL` configurada no Vercel
- [ ] Valor: `https://kfyzcqaerlwqcmlbcgts.supabase.co` (exatamente)
- [ ] Variável `VITE_SUPABASE_ANON_KEY` configurada no Vercel
- [ ] Valor: chave completa (não truncada)
- [ ] Ambas marcadas para **Production**
- [ ] Redeploy feito após configurar
- [ ] App em produção não mostra tela de erro
- [ ] Console mostra `✅ Supabase configurado corretamente`

---

## 🎯 Resultado Esperado

**Quando tudo estiver correto:**

1. ✅ App em produção carrega normalmente
2. ✅ Não mostra tela de erro
3. ✅ Console mostra validação correta
4. ✅ Feed e chat funcionam
5. ✅ Todos os usuários veem o mesmo conteúdo

---

## 💡 Dica Rápida

**Via CLI do Vercel:**

```bash
# Instalar Vercel CLI (se não tiver)
npm i -g vercel

# Fazer login
vercel login

# Configurar variáveis
vercel env add VITE_SUPABASE_URL production
# Digite: https://kfyzcqaerlwqcmlbcgts.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Digite: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeXpjcWFlcmx3cWNtbGJjZ3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MDQ2MjksImV4cCI6MjA4MDA4MDYyOX0.gj215HUlQ_b-68u2LC2LCwxpCDWGia1OaBOq5Zfoa04

# Fazer deploy
vercel --prod
```

---

## 🔧 Configuração Automática (Opcional)

Se quiser automatizar, crie um arquivo `.env.production` (não commitar):

```env
VITE_SUPABASE_URL=https://kfyzcqaerlwqcmlbcgts.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeXpjcWFlcmx3cWNtbGJjZ3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MDQ2MjksImV4cCI6MjA4MDA4MDYyOX0.gj215HUlQ_b-68u2LC2LCwxpCDWGia1OaBOq5Zfoa04
```

**⚠️ IMPORTANTE:** Este arquivo NÃO deve ser commitado (já está no `.gitignore`).

**Melhor prática:** Configurar no Vercel Dashboard para não expor credenciais.

