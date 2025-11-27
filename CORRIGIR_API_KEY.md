# 🔧 Como Corrigir a API Key do Supabase

## Problema Detectado
A API key está retornando "Invalid API key" ao acessar as tabelas. Isso pode acontecer quando:
- A chave foi regenerada no dashboard do Supabase
- As políticas RLS (Row Level Security) estão bloqueando o acesso
- A chave expirou ou foi revogada

## ✅ Solução Rápida

### Passo 1: Obter Nova API Key

1. Acesse: **https://supabase.com/dashboard**
2. Selecione seu projeto: **qxgejhovvzczmheudkmu**
3. Vá em **Settings** → **API**
4. Na seção **Project API keys**, copie a chave **"anon public"**
   - ⚠️ **NÃO** use a chave "service_role" (ela é privada!)

### Passo 2: Atualizar o .env.local

Abra o arquivo `.env.local` na raiz do projeto e atualize:

```env
VITE_SUPABASE_URL=https://qxgejhovvzczmheudkmu.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_NOVA_CHAVE_AQUI
```

### Passo 3: Verificar RLS (Row Level Security)

Se ainda não funcionar, verifique as políticas RLS:

1. No Supabase Dashboard, vá em **Authentication** → **Policies**
2. Verifique se as tabelas têm políticas que permitem:
   - **SELECT** para usuários autenticados
   - **INSERT** para usuários autenticados
   - **UPDATE** para o próprio usuário

### Passo 4: Testar Novamente

Execute o script de teste:
```bash
node test-supabase.js
```

Ou simplesmente recarregue o app e tente fazer login/cadastro.

## 🔄 Modo Offline (Temporário)

Enquanto você corrige a API key, o app funciona em **modo offline**:
- ✅ Login e cadastro funcionam (salvos localmente)
- ✅ Posts e mensagens funcionam (salvos localmente)
- ⚠️ Dados não são sincronizados entre dispositivos

## 📝 Nota Importante

Se você regenerou a API key no Supabase, **todas as aplicações** que usam a chave antiga precisam ser atualizadas:
- ✅ `.env.local` (desenvolvimento local)
- ✅ Vercel Environment Variables (produção)

Para atualizar na Vercel:
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto
3. Vá em **Settings** → **Environment Variables**
4. Atualize `VITE_SUPABASE_ANON_KEY` com a nova chave
5. Faça um novo deploy

