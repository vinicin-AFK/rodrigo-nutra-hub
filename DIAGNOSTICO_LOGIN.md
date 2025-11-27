# 🔍 Diagnóstico: Erro no Login

## Como Identificar o Problema

### 1. Abra o Console do Navegador

1. Pressione `F12` ou `Cmd+Option+I` (Mac)
2. Vá na aba **Console**

### 2. Tente Fazer Login

Observe os logs que aparecem. Procure por:

#### ✅ Se funcionar:
```
🔐 AuthContext.login chamado
🌐 Tentando login no Supabase...
✅ Login no Supabase bem-sucedido
✅ Perfil carregado
✅ Login completo
```

#### ❌ Se der erro, você verá uma dessas mensagens:

**A) Email não confirmado:**
```
❌ Erro ao fazer login: email_not_confirmed
```
**Solução:** Desabilite confirmação de email no Supabase (veja abaixo)

**B) Credenciais incorretas:**
```
❌ Erro ao fazer login: Invalid login credentials
```
**Solução:** Verifique email e senha

**C) Timeout:**
```
❌ Erro ao fazer login: Timeout: Login demorou mais de 10 segundos
```
**Solução:** Problema de conexão com Supabase

**D) Perfil não encontrado:**
```
⚠️ Perfil não encontrado, criando automaticamente...
```
**Solução:** O sistema deve criar automaticamente (já implementado)

## Soluções Comuns

### Solução 1: Desabilitar Confirmação de Email (RECOMENDADO)

1. Acesse o Supabase Dashboard
2. Vá em **Authentication** → **Providers** → **Email**
3. **Desmarque** a opção "Confirm email"
4. Clique em **Save**
5. Tente fazer login novamente

### Solução 2: Confirmar Email Manualmente

1. Acesse o Supabase Dashboard
2. Vá em **Authentication** → **Users**
3. Encontre seu usuário pelo email
4. Clique no usuário
5. Clique em **"Confirm user"** ou marque **"Email confirmed"**
6. Tente fazer login novamente

### Solução 3: Verificar Variáveis de Ambiente

1. Verifique se o arquivo `.env.local` existe na raiz do projeto
2. Verifique se contém:
   ```env
   VITE_SUPABASE_URL=https://qxgejhovvzczmheudkmu.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-aqui
   ```
3. **Reinicie o servidor** após criar/editar o `.env.local`

### Solução 4: Verificar se o Usuário Existe

1. Acesse o Supabase Dashboard
2. Vá em **Authentication** → **Users**
3. Verifique se seu email está na lista
4. Se não estiver, você precisa se cadastrar primeiro

### Solução 5: Recriar Usuário

Se nada funcionar:

1. No Supabase, vá em **Authentication** → **Users**
2. Delete o usuário problemático
3. No app, vá em **Cadastre-se** e crie uma nova conta
4. Tente fazer login com a nova conta

## Enviar Informações para Diagnóstico

Se ainda não funcionar, envie:

1. **Screenshot do console** com todos os logs
2. **Mensagem de erro exata** que aparece na tela
3. **Verificações:**
   - [ ] `.env.local` existe e está configurado?
   - [ ] Confirmação de email está desabilitada?
   - [ ] Usuário existe no Supabase?
   - [ ] Variáveis estão configuradas na Vercel?

## Logs Esperados

Quando você faz login, deve ver esta sequência:

```
🔐 AuthContext.login chamado { email: "...", isSupabaseConfigured: true }
🌐 Tentando login no Supabase...
✅ Login no Supabase bem-sucedido, carregando dados... [user-id]
📥 Carregando perfil do usuário: [user-id]
✅ Perfil encontrado: [nome]
✅ Perfil carregado
✅ Login completo
```

Se algum desses logs não aparecer, me envie qual foi o último log que apareceu.

