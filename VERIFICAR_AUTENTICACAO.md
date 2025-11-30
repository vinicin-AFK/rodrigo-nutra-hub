# 🔐 Verificar Autenticação no App

O diagnóstico do Supabase mostra que **tudo está OK no banco**, então o problema está no **app não estar autenticado corretamente**.

---

## 🚨 Passo 1: Verificar Console do Navegador

1. Abra o app no navegador
2. Abra o **Console** (F12)
3. **Limpe o console** (ícone de limpar ou Ctrl+L)
4. Tente criar um post
5. **Copie TODAS as mensagens** que aparecem

**Procure especificamente por:**

```
👤 Resultado da autenticação: { hasUser: true/false, userId: "..." }
🔑 Sessão: { hasSession: true/false, userId: "..." }
```

**Se `hasUser: false` ou `hasSession: false`:**
- O problema é que você **não está autenticado no app**
- Mesmo que exista usuário no banco, o app precisa ter uma sessão ativa

---

## 🚨 Passo 2: Fazer Logout e Login Novamente

1. No app, clique no botão de **Logout**
2. Feche o app completamente
3. Abra o app novamente
4. Faça **Login** (ou **Registro** se for novo usuário)
5. Tente criar um post novamente
6. Verifique o console

**Isso recria a sessão do Supabase no app.**

---

## 🚨 Passo 3: Verificar Se Supabase Está Conectado

No console, procure por:

```
✅ Supabase configurado: https://kfyzcqaerlwqcmlbcgts.supabase...
```

**Se NÃO aparecer:**
1. Verifique o arquivo `.env.local`:
   ```bash
   cat .env.local
   ```
2. Deve mostrar:
   ```
   VITE_SUPABASE_URL=https://kfyzcqaerlwqcmlbcgts.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. **Reinicie o servidor** (`npm run dev`)

---

## 🚨 Passo 4: Testar Login/Registro

1. Faça **logout** no app
2. Tente fazer **registro** de um novo usuário
3. Verifique no console se aparece:
   ```
   ✅ Usuário registrado com sucesso
   ✅ Perfil criado no Supabase
   ```
4. Tente criar um post
5. Verifique se aparece:
   ```
   ✅ Post inserido com sucesso na tentativa 1!
   ```

---

## 🚨 Passo 5: Verificar Erros Específicos

No console, ao criar um post, procure por:

**Erro de autenticação:**
```
❌ ERRO CRÍTICO: Usuário não autenticado!
⚠️ Não autenticado
```

**Erro de RLS:**
```
❌ Tentativa 1 falhou: { error: "row-level security policy violation", code: "42501" }
🔒 ERRO DE RLS DETECTADO!
```

**Erro de API key:**
```
⚠️ API key do Supabase marcada como inválida
```

**Erro de conexão:**
```
⚠️ Erro ao buscar do Supabase
❌ Erro ao sincronizar com Supabase
```

---

## 🎯 Solução Mais Provável

Como o diagnóstico do Supabase está OK, o problema mais provável é:

**O app não está autenticado corretamente.**

**Solução:**
1. Faça **logout** no app
2. Feche o app completamente
3. Abra o app novamente
4. Faça **login** novamente
5. Tente criar um post

Isso garante que a sessão do Supabase está ativa no app.

---

## 📋 Checklist

- [ ] Console mostra "✅ Supabase configurado"
- [ ] Console mostra `hasUser: true` ao criar post
- [ ] Console mostra `hasSession: true` ao criar post
- [ ] Usuário fez logout e login novamente
- [ ] Servidor foi reiniciado após configurar `.env.local`
- [ ] Não há erros de autenticação no console
- [ ] Não há erros de RLS no console

---

## 💡 Dica

**O problema mais comum quando o banco está OK mas nada salva é:**
- Usuário não está autenticado no app
- Sessão do Supabase expirou
- App não está conectado ao Supabase (variáveis de ambiente)

**Solução rápida:**
1. Logout
2. Login novamente
3. Testar criar post
4. Verificar console

