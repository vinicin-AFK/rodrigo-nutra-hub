# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/2c7f1fe4-401f-41e0-a889-ce0e4e05f5e5

---

## 🚀 Desenvolvimento Local (Recomendado)

**Para economizar deploys gratuitos da Vercel, desenvolva localmente!**

### Início Rápido

```sh
# 1. Instalar dependências (apenas na primeira vez)
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev
# ou
npm start
```

O app estará disponível em: **http://localhost:8080**

### ✨ Hot Reload Automático
- Todas as alterações são refletidas instantaneamente
- Não precisa recarregar a página manualmente
- Erros aparecem no terminal e no navegador

### 📝 Variáveis de Ambiente (Opcional - se usar Supabase)

Crie um arquivo `.env.local` na raiz:
```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

### 🚢 Deploy Manual (apenas quando necessário)

**Opção 1: Via Dashboard Vercel**
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto → "Deployments" → "Redeploy"

**Opção 2: Via Push (deploy automático)**
```sh
git add .
git commit -m "sua mensagem"
git push origin main
```

💡 **Dica**: Desenvolva e teste tudo localmente antes de fazer deploy!

---

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2c7f1fe4-401f-41e0-a889-ce0e4e05f5e5) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### Deploy no Vercel (Recomendado)

O projeto está configurado para deploy automático no Vercel. Você pode fazer deploy de duas formas:

#### Opção 1: Via Interface Web (Mais Fácil)

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta GitHub
2. Clique em "Add New Project"
3. Importe o repositório deste projeto
4. A Vercel detectará automaticamente as configurações (Vite + React)
5. Clique em "Deploy"
6. Pronto! Seu projeto estará no ar

#### Opção 2: Via CLI

```sh
# Instalar a CLI do Vercel (se ainda não tiver)
npm i -g vercel

# Fazer login
vercel login

# Deploy (na raiz do projeto)
vercel

# Para produção
vercel --prod
```

#### Deploy Automático

Após conectar o repositório, a Vercel fará deploy automático sempre que você fizer push para a branch `main`.

### Outras opções

Você também pode usar o [Lovable](https://lovable.dev/projects/2c7f1fe4-401f-41e0-a889-ce0e4e05f5e5) e clicar em Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
