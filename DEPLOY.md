# 🚀 Guia de Deploy no Vercel

## Método 1: Via Interface Web (Recomendado - Mais Fácil)

1. **Acesse a Vercel**
   - Vá para [vercel.com](https://vercel.com)
   - Faça login com sua conta GitHub

2. **Importe o Projeto**
   - Clique em "Add New Project" ou "New Project"
   - Selecione o repositório deste projeto
   - A Vercel detectará automaticamente que é um projeto Vite

3. **Configure o Deploy**
   - **Framework Preset**: Vite (deve ser detectado automaticamente)
   - **Build Command**: `npm run build` (já configurado)
   - **Output Directory**: `dist` (já configurado)
   - **Install Command**: `npm install` (já configurado)

4. **Deploy**
   - Clique em "Deploy"
   - Aguarde o processo (geralmente 1-2 minutos)
   - Pronto! Seu projeto estará no ar

5. **Deploy Automático**
   - Após o primeiro deploy, todos os pushes para a branch `main` farão deploy automático
   - Você receberá uma URL única para cada deploy

## Método 2: Via CLI

### Instalação da CLI

```bash
npm i -g vercel
```

### Primeiro Deploy

```bash
# Fazer login
vercel login

# Deploy de preview (teste)
npm run deploy:preview

# Deploy de produção
npm run deploy
```

### Comandos Disponíveis

- `npm run deploy` - Build e deploy de produção
- `npm run deploy:preview` - Build e deploy de preview/teste
- `vercel` - Deploy interativo
- `vercel --prod` - Deploy direto para produção

## Configurações

O projeto já está configurado com `vercel.json` que inclui:
- ✅ Build command configurado
- ✅ Output directory configurado
- ✅ Rewrites para SPA (React Router)
- ✅ Framework detectado automaticamente

## Variáveis de Ambiente

Se precisar adicionar variáveis de ambiente:
1. Vá em Project Settings > Environment Variables
2. Adicione as variáveis necessárias
3. Faça um novo deploy

## Domínio Personalizado

Para adicionar um domínio personalizado:
1. Vá em Project Settings > Domains
2. Adicione seu domínio
3. Siga as instruções de DNS

## Troubleshooting

### Erro de Build
- Verifique se todas as dependências estão no `package.json`
- Execute `npm install` localmente para testar

### Rotas não funcionam
- O `vercel.json` já está configurado com rewrites para SPA
- Todas as rotas redirecionam para `index.html`

### Deploy lento
- Use o cache da Vercel (já configurado automaticamente)
- Considere usar `npm ci` em vez de `npm install` para builds mais rápidos

