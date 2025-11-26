# 🔐 Configurar Autenticação para Push Automático

## 🎯 Objetivo
Configurar autenticação uma vez para que o push automático funcione sempre.

---

## ✅ Opção 1: Personal Access Token (Recomendado - Mais Fácil)

### Passo 1: Criar Token no GitHub

1. **Acesse**: https://github.com/settings/tokens
2. **Faça login** com a conta `vinicin-AFK`
3. Clique em: **"Generate new token"** → **"Generate new token (classic)"**
4. **Preencha**:
   - **Note**: `Push Automático - MacBook`
   - **Expiration**: Escolha (90 dias, 1 ano, ou sem expiração)
   - **Scopes**: Marque **APENAS** ✅ `repo`
5. Clique em: **"Generate token"** (verde)
6. **COPIE O TOKEN** (começa com `ghp_`)
   - ⚠️ Aparece apenas UMA VEZ!

### Passo 2: Configurar no Git

Execute no terminal:

```bash
git push
```

Quando pedir:
- **Username**: `vinicin-AFK`
- **Password**: Cole o token (não sua senha do GitHub)

O macOS Keychain salvará automaticamente!

### Passo 3: Testar

```bash
git commit --allow-empty -m "teste push automático"
```

Se aparecer "✅ Push realizado com sucesso", está funcionando!

---

## ✅ Opção 2: SSH (Alternativa)

### Passo 1: Verificar se tem chave SSH

```bash
ls -la ~/.ssh/id_*.pub
```

### Passo 2: Se não tiver, criar

```bash
ssh-keygen -t ed25519 -C "vinicin-AFK@github" -f ~/.ssh/id_ed25519_vinicin_afk
```

### Passo 3: Copiar chave pública

```bash
cat ~/.ssh/id_ed25519_vinicin_afk.pub
```

### Passo 4: Adicionar no GitHub

1. Acesse: https://github.com/settings/ssh/new
2. Cole a chave
3. Salve

### Passo 5: Configurar Git

```bash
git remote set-url origin git@github.com:vinicin-AFK/rodrigo-nutra-hub.git
```

### Passo 6: Testar

```bash
ssh -T git@github.com
```

Deve aparecer: "Hi vinicin-AFK! You've successfully authenticated..."

---

## 🔍 Verificar se está funcionando

### Teste rápido:

```bash
# Fazer commit de teste
git commit --allow-empty -m "teste"

# Deve aparecer:
# ✅ Push realizado com sucesso para origin/main
```

### Verificar credenciais salvas:

```bash
# Ver credenciais no Keychain
git credential-osxkeychain get <<EOF
protocol=https
host=github.com
EOF
```

---

## 🆘 Problemas Comuns

### "could not read Username"
- Execute `git push` manualmente uma vez
- Cole o token quando pedir

### "Permission denied"
- Verifique se o token tem permissão `repo`
- Verifique se está usando a conta correta

### "Token expirado"
- Gere um novo token
- Execute `git push` novamente para atualizar

### Limpar credenciais antigas:

```bash
git credential-osxkeychain erase <<EOF
protocol=https
host=github.com
EOF
```

---

## ✅ Checklist

- [ ] Token criado no GitHub
- [ ] Token copiado (ghp_...)
- [ ] `git push` executado uma vez
- [ ] Credenciais salvas no Keychain
- [ ] Teste de commit funcionando
- [ ] Push automático ativo

---

## 🎉 Depois de Configurar

Todos os commits farão push automaticamente!

```bash
git commit -m "minha mensagem"
# Automaticamente faz push! 🚀
```

