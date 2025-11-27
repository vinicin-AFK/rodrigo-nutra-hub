# 🚀 Desenvolvimento Local

## Como rodar o projeto localmente

### 1. Instalar dependências (se ainda não instalou)
```bash
npm install
```

### 2. Configurar variáveis de ambiente (se usar Supabase)

Crie um arquivo `.env.local` na raiz do projeto:
```bash
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

### 3. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

O app estará disponível em: **http://localhost:8080**

### 4. Hot Reload
- ✅ Todas as alterações são refletidas automaticamente
- ✅ Não precisa recarregar a página manualmente
- ✅ Erros aparecem no terminal e no navegador

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento (porta 8080)
- `npm run build` - Gera build de produção
- `npm run preview` - Preview do build de produção localmente

## 🚢 Deploy Manual (apenas quando necessário)

### Opção 1: Via Dashboard Vercel
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto
3. Clique em **"Deployments"** → **"Redeploy"**

### Opção 2: Via CLI (se tiver instalado)
```bash
npm run deploy
```

### Opção 3: Push para GitHub (deploy automático)
```bash
git add .
git commit -m "sua mensagem"
git push origin main
```

## 💡 Dica
- Desenvolva localmente e teste tudo antes de fazer deploy
- Faça deploy apenas quando estiver satisfeito com as mudanças
- Isso economiza seus deploys gratuitos da Vercel! 🎯

