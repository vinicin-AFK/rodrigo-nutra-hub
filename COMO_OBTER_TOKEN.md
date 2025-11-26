# 🔑 Como Obter Personal Access Token no GitHub

## 📍 Link Direto

**Acesse diretamente:** https://github.com/settings/tokens

---

## 📝 Passo a Passo Detalhado

### Passo 1: Acessar as Configurações

1. Faça login no GitHub com a conta **`vinicin-AFK`**
2. Clique no seu **avatar** (canto superior direito)
3. Clique em **Settings** (Configurações)

### Passo 2: Acessar Developer Settings

1. No menu lateral esquerdo, role até o final
2. Clique em **Developer settings** (Configurações do desenvolvedor)

### Passo 3: Personal Access Tokens

1. No menu lateral, clique em **Personal access tokens**
2. Clique em **Tokens (classic)**
3. Clique no botão verde **Generate new token**
4. Selecione **Generate new token (classic)**

### Passo 4: Configurar o Token

Preencha os campos:

- **Note** (Nome): `Deploy Token - MacBook` (ou qualquer nome que você quiser)
- **Expiration** (Expiração): 
  - Escolha: **90 days**, **1 year** ou **No expiration**
  - Recomendo: **90 days** ou **1 year** por segurança

- **Scopes** (Permissões): 
  - **Marque APENAS**: ✅ `repo`
  - Isso dá acesso completo aos repositórios
  - **NÃO marque outras opções** (por segurança)

### Passo 5: Gerar o Token

1. Role até o final da página
2. Clique no botão verde **Generate token**
3. **COPIE O TOKEN IMEDIATAMENTE!**
   - O token começa com `ghp_`
   - Exemplo: `ghp_1234567890abcdefghijklmnopqrstuvwxyz`
   - ⚠️ **IMPORTANTE**: O token aparece apenas UMA VEZ!
   - Se você fechar a página, terá que gerar um novo

### Passo 6: Usar o Token

Depois de copiar o token, você pode:

**Opção A: Usar o script automatizado**
```bash
./fazer-push.sh
# Cole o token quando pedir
```

**Opção B: Fazer push manual**
```bash
git push
# Username: vinicin-AFK
# Password: [cole o token aqui]
```

---

## 🎯 Resumo Rápido

1. **Acesse**: https://github.com/settings/tokens
2. **Clique**: Generate new token → Generate new token (classic)
3. **Marque**: ✅ `repo` (apenas isso)
4. **Gere**: Generate token
5. **Copie**: O token (começa com `ghp_`)
6. **Use**: No script ou no git push

---

## ⚠️ Dicas Importantes

- ✅ O token é como uma senha - **não compartilhe com ninguém**
- ✅ Se perder o token, gere um novo
- ✅ Você pode revogar tokens antigos a qualquer momento
- ✅ O macOS vai salvar o token no Keychain automaticamente
- ✅ Depois do primeiro uso, não precisará digitar novamente

---

## 🔒 Segurança

- Use tokens com expiração quando possível
- Revogue tokens que não usa mais
- Nunca commite tokens no código
- Use tokens diferentes para diferentes projetos

---

## 📸 Visual (O que você vai ver)

```
GitHub Settings
├── Profile
├── Account
├── ...
└── Developer settings  ← Clique aqui
    └── Personal access tokens
        └── Tokens (classic)  ← Clique aqui
            └── Generate new token (classic)  ← Clique aqui
```

---

## ❓ Problemas Comuns

**"Não encontro Developer settings"**
- Role o menu lateral até o final
- Está na parte de baixo das configurações

**"Token não funciona"**
- Verifique se marcou `repo` nas permissões
- Verifique se copiou o token completo (começa com `ghp_`)
- Verifique se está usando a conta correta (`vinicin-AFK`)

**"Token expirou"**
- Gere um novo token seguindo os mesmos passos
- Tokens expirados não podem ser renovados

