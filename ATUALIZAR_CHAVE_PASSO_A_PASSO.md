# 🔑 Atualizar API Key - Passo a Passo

## 📋 Passo 1: Obter a Nova Chave no Supabase

1. **Abra o navegador** e acesse: https://supabase.com/dashboard
2. **Faça login** na sua conta
3. **Selecione o projeto**: `qxgejhovvzczmheudkmu`
4. No menu lateral esquerdo, clique em **"Settings"** (⚙️)
5. Clique em **"API"** (dentro de Settings)
6. Na seção **"Project API keys"**, você verá várias chaves:
   - ⚠️ **NÃO use** "service_role" (é privada!)
   - ✅ **USE** "anon public" (é a pública)
7. **Clique no ícone de copiar** ao lado de "anon public"
8. A chave será copiada para a área de transferência

## 📝 Passo 2: Atualizar o Arquivo .env.local

Agora você tem duas opções:

### Opção A: Usar o Script Automático (Recomendado)

No terminal, execute:
```bash
./atualizar-api-key.sh
```

Quando pedir, cole a chave que você copiou e pressione Enter.

### Opção B: Editar Manualmente

1. Abra o arquivo `.env.local` na raiz do projeto
2. Encontre a linha:
   ```
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Substitua tudo depois do `=` pela nova chave que você copiou
4. Salve o arquivo

## 🔄 Passo 3: Recarregar o Servidor

Se o servidor de desenvolvimento estiver rodando:

1. **Pare o servidor**: Pressione `Ctrl+C` no terminal
2. **Inicie novamente**: Execute `npm run dev`

## ✅ Passo 4: Testar

Execute o teste:
```bash
node test-supabase.js
```

Se aparecer "✅✅✅ TUDO FUNCIONANDO!", está tudo certo!

## 🚀 Passo 5: Atualizar na Vercel (Produção)

Para que o app em produção também funcione:

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto **rodrigo-nutra-hub**
3. Vá em **Settings** → **Environment Variables**
4. Encontre `VITE_SUPABASE_ANON_KEY`
5. Clique em **Edit** (ou **Add** se não existir)
6. Cole a nova chave
7. Clique em **Save**
8. Vá em **Deployments** e faça um **Redeploy**

---

## ❓ Precisa de Ajuda?

Se tiver alguma dúvida em algum passo, me avise!

