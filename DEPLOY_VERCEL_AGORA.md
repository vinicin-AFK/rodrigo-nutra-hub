# 🚀 Deploy Direto no Vercel - Guia Rápido

## ⚡ Passo a Passo (2 minutos)

### 1. Acesse a Vercel
**Link direto**: https://vercel.com/new

### 2. Faça Login
- Clique em **"Continue with GitHub"**
- Faça login com sua conta GitHub (vinicin-AFK)

### 3. Importe o Projeto
- Se já tiver projetos, clique em **"Add New Project"**
- Procure por: **`vinicin-AFK/rodrigo-nutra-hub`**
- Clique em **"Import"**

### 4. Configure (Já está tudo configurado!)
A Vercel vai detectar automaticamente:
- ✅ **Framework**: Vite
- ✅ **Build Command**: `npm run build`
- ✅ **Output Directory**: `dist`
- ✅ **Install Command**: `npm install`

**Não precisa mudar nada!** Só clique em **"Deploy"**

### 5. Aguarde
- O deploy leva 1-2 minutos
- Você verá o progresso em tempo real
- Quando terminar, terá uma URL: `rodrigo-nutra-hub.vercel.app`

### 6. Pronto! 🎉
Seu projeto estará no ar com todas as correções!

---

## 🔄 Para Atualizar Depois

Depois que conectar o repositório, a Vercel faz **deploy automático** sempre que você fizer push para a branch `main`.

Mas se quiser fazer deploy manual agora (sem push):

1. Vá em: https://vercel.com
2. Clique no seu projeto
3. Vá em **"Deployments"**
4. Clique nos **3 pontinhos** do último deploy
5. Clique em **"Redeploy"**

---

## ✅ O que está sendo deployado

- ✅ Layout estilo Instagram na página inicial
- ✅ Correção da tela preta (ErrorBoundary + animações)
- ✅ Feed completo de postagens
- ✅ Todas as funcionalidades

---

## 🆘 Problemas?

**"Repositório não encontrado"**
- Certifique-se de estar logado com a conta `vinicin-AFK`
- Verifique se o repositório existe: https://github.com/vinicin-AFK/rodrigo-nutra-hub

**"Erro no build"**
- Verifique se todas as dependências estão no `package.json`
- A Vercel mostra os erros no log de build

**"Ainda está com tela preta"**
- Aguarde o deploy terminar completamente
- Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)
- Verifique o console do navegador (F12) para erros

---

## 📝 Nota

Você não precisa fazer push para fazer deploy na Vercel! A Vercel acessa o repositório diretamente do GitHub.

Mas se quiser que as alterações locais apareçam, você precisará fazer push primeiro (ou fazer commit direto no GitHub).

