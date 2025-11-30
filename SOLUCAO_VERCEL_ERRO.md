# 🚨 Solução Rápida: Erro no Vercel

## ⚠️ Problema

O app em produção está mostrando:
```
Conexão com o Supabase incorreta
```

**URL:** `rodrigo-nutra-hub.vercel.app`

---

## ✅ Solução Rápida (5 minutos)

### Opção 1: Via Dashboard do Vercel (Recomendado)

1. **Acesse:** https://vercel.com/dashboard
2. **Selecione:** projeto `rodrigo-nutra-hub`
3. **Vá em:** Settings → Environment Variables
4. **Adicione:**

   **Variável 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://kfyzcqaerlwqcmlbcgts.supabase.co`
   - Environments: ✅ Production ✅ Preview ✅ Development

   **Variável 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeXpjcWFlcmx3cWNtbGJjZ3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MDQ2MjksImV4cCI6MjA4MDA4MDYyOX0.gj215HUlQ_b-68u2LC2LCwxpCDWGia1OaBOq5Zfoa04`
   - Environments: ✅ Production ✅ Preview ✅ Development

5. **Redeploy:**
   - Vá em Deployments
   - Clique nos 3 pontos do último deployment
   - Selecione "Redeploy"
   - Aguarde completar

### Opção 2: Via CLI do Vercel

```bash
# Se não tiver Vercel CLI instalado
npm i -g vercel

# Fazer login
vercel login

# Configurar variáveis
vercel env add VITE_SUPABASE_URL production
# Quando pedir, digite: https://kfyzcqaerlwqcmlbcgts.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Quando pedir, cole a chave completa

# Fazer deploy
vercel --prod
```

---

## 🔍 Verificar se Funcionou

1. **Acesse:** `https://rodrigo-nutra-hub.vercel.app`
2. **Deve:**
   - ✅ Não mostrar tela de erro
   - ✅ Carregar o app normalmente
   - ✅ Mostrar feed e chat

3. **Console (F12):**
   ```
   ✅ Supabase configurado corretamente
   ✅ URL: https://kfyzcqaerlwqcmlbcgts.supabase.co
   ```

---

## ⚠️ Importante

- As variáveis devem estar marcadas para **Production**
- Após adicionar variáveis, **SEMPRE** fazer redeploy
- A URL deve ser **exatamente**: `https://kfyzcqaerlwqcmlbcgts.supabase.co`
- A chave deve ser a **completa** (não truncada)

---

## 🎯 Resultado

Após configurar e fazer redeploy:

1. ✅ App carrega normalmente
2. ✅ Feed funciona
3. ✅ Chat funciona
4. ✅ Todos os usuários veem o mesmo conteúdo
5. ✅ Não mostra mais tela de erro

