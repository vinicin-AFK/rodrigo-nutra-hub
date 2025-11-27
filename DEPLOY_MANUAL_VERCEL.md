# 🚀 Deploy Manual na Vercel

Se a Vercel não fez o deploy automático após o push, você pode forçar um novo deploy manualmente:

## Opção 1: Via Dashboard da Vercel (Mais Fácil)

1. Acesse: https://vercel.com/dashboard
2. Encontre o projeto **rodrigo-nutra-hub**
3. Clique no projeto
4. Vá na aba **"Deployments"**
5. Clique nos **3 pontinhos** (⋮) no último deploy
6. Selecione **"Redeploy"**
7. Confirme o redeploy

## Opção 2: Via CLI da Vercel

Se você tem a Vercel CLI instalada:

```bash
npx vercel --prod
```

## Opção 3: Forçar um novo commit (trigger automático)

Se nada funcionar, podemos fazer um pequeno ajuste para forçar um novo commit:

```bash
# Adiciona um comentário vazio e faz push
git commit --allow-empty -m "trigger: forçar deploy Vercel"
git push origin main
```

## ⚠️ Verificar Configuração

Se os deploys automáticos não estão funcionando:

1. Vá em: https://vercel.com/dashboard
2. Selecione o projeto
3. Vá em **Settings** → **Git**
4. Verifique se o repositório está conectado corretamente
5. Verifique se **"Automatic deployments from Git"** está habilitado

## ✅ Após o Deploy

Após o deploy, verifique:
- Se o build passou sem erros
- Se as variáveis de ambiente estão configuradas:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

