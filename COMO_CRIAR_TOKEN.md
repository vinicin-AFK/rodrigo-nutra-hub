# 🔑 Como Criar Personal Access Token no GitHub

## Passo a Passo Visual:

### 1. Acesse o GitHub
- Faça login na conta **`vinicin-AFK`**
- Vá para: https://github.com/settings/tokens

### 2. Criar Novo Token
- Clique em: **"Generate new token"** → **"Generate new token (classic)"**

### 3. Configurar o Token
- **Note**: `Deploy Token - MacBook` (ou qualquer nome)
- **Expiration**: Escolha (recomendo 90 dias ou 1 ano)
- **Scopes**: Marque **APENAS** `repo` ✅
  - Isso dá acesso completo aos repositórios
  - Não marque outras opções por segurança

### 4. Gerar e Copiar
- Role até o final
- Clique em: **"Generate token"** (botão verde)
- **COPIE O TOKEN IMEDIATAMENTE!**
  - Começa com `ghp_`
  - Exemplo: `ghp_1234567890abcdefghijklmnopqrstuvwxyz`
  - ⚠️ **Aparece apenas uma vez!**

### 5. Usar o Token

No terminal, execute:
```bash
git push
```

Quando pedir:
- **Username**: `vinicin-AFK`
- **Password**: Cole o token (começa com `ghp_`)

Pronto! O macOS vai salvar automaticamente no Keychain.

---

## ⚡ Solução Mais Rápida: Deploy Direto na Vercel

Se você só quer fazer o deploy **AGORA** sem se preocupar com o push:

1. Acesse: **https://vercel.com/new**
2. Faça login com GitHub
3. Importe: `vinicin-AFK/rodrigo-nutra-hub`
4. Clique em **Deploy**

**Pronto!** O projeto estará no ar em 1-2 minutos.

A Vercel acessa o repositório diretamente, então não precisa do push local!

