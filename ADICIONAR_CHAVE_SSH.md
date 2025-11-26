# 🔑 Como Adicionar Chave SSH no GitHub (Passo a Passo)

## ⚠️ Erro: "Key is invalid. You must supply a key in OpenSSH public key format"

Este erro geralmente acontece quando:
- Há espaços extras no início/fim
- Há quebras de linha
- Faltou copiar alguma parte da chave
- Foi copiado algo além da chave

## ✅ Solução Passo a Passo

### Passo 1: Obter a Chave SSH Correta

Execute no terminal:
```bash
./get-ssh-key.sh
```

Ou copie manualmente:
```bash
cat ~/.ssh/id_ed25519_github.pub
```

### Passo 2: Copiar APENAS a Linha da Chave

**IMPORTANTE**: Copie EXATAMENTE esta linha (sem espaços antes/depois):

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOCBUABT9NdVt2EqrqvTg6aDOhwL0Y5a8QdqOQ1F6txO vinicin0102@github
```

**OU** a chave RSA (alternativa):

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCjoUmivX6/Y9vutviNY3rzBDGYWIl9DqY5CkIyUWmpg7FxEaM1xbAhdPkYN7+XHE5/XUmjjAkzheSEQuAOGZY1QxaWzk0ruTiOXOefqcrIkbvqXlh2p0Bl63CXXw5+jy5/EWBrlUjWwgBGK5CqLYqgNZw5lyRkLh7cJYEO0MYNGor3OWb6mA4P7FGXugiG8ys/KOY3Bfb3qyhVzWCnQtMYIX6oSuU/YkLdBQ6BKSs4RVAisN98FoEPEceSn5ZvyAPy3riHhnrZlkPrPpg70eSjwfnnNN6spZHGs9hctEyfvnjyHzFNKk7qDkulF2GIOOon3cKy+uEoF2C9h0hfvZlF91P9LptVfshtSgRyzXzT6tb8NCwIzWvpL73X50k2Y+qVlQLyPjGpnbJ5Sc81UEPrF/tidEn2aIn0NPBa3K9WNn9wWxMIeoFB7xRfWTtratCJCwu5jP/50/CJc+3r5VCvnr/8GTpwEDbTBjwpruOn8NT5tJDy9KaT9Ez1sFAsLXm1ozfIxftOwotjo4MqxBjgjmCGbBdAepwIF0NNDEf4Z7QeUgZoSef2dRMq1bgF0P4IQnyO1nF4YvwBy7ksvWrafWi3OS4AD3SZjBkWCVHxksvLNHpF7iP5sIr1ag5DRK6BbFvdeheVTDILFjmRPotqeVOSVMvE6Lfijhdqci+L2Q== vinicin0102@github
```

### Passo 3: Adicionar no GitHub

1. **Faça login na conta `vinicin-AFK`** no GitHub
2. Vá em: **Settings** (ícone de engrenagem no canto superior direito)
3. No menu lateral, clique em: **SSH and GPG keys**
4. Clique em: **New SSH key** (botão verde)
5. Preencha:
   - **Title**: `MacBook - Deploy` (ou qualquer nome descritivo)
   - **Key type**: `Authentication Key` (padrão)
   - **Key**: Cole a chave que você copiou (a linha completa começando com `ssh-ed25519` ou `ssh-rsa`)
6. Clique em: **Add SSH key**

### Passo 4: Verificar

Teste se funcionou:
```bash
ssh -T git@github.com
```

Deve aparecer:
```
Hi vinicin-AFK! You've successfully authenticated, but GitHub does not provide shell access.
```

### Passo 5: Fazer Push

Depois que a chave estiver adicionada:
```bash
git push
```

## 🔍 Dicas Importantes

1. **Copie a linha inteira**: A chave deve começar com `ssh-ed25519` ou `ssh-rsa` e terminar com o email/comentário
2. **Sem quebras de linha**: A chave deve ser uma única linha
3. **Sem espaços extras**: Não adicione espaços no início ou fim
4. **Use a chave Ed25519**: É mais segura e recomendada (a primeira opção)

## ❌ Se Ainda Não Funcionar

Tente gerar uma nova chave SSH:

```bash
# Gerar nova chave
ssh-keygen -t ed25519 -C "vinicin-AFK@github" -f ~/.ssh/id_ed25519_vinicin_afk

# Ver a nova chave
cat ~/.ssh/id_ed25519_vinicin_afk.pub

# Adicionar ao SSH config (opcional)
echo "Host github.com-vinicin-afk
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_vinicin_afk" >> ~/.ssh/config

# Testar
ssh -T git@github.com-vinicin-afk
```

