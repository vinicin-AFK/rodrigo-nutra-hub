# 📦 Como Instalar @supabase/supabase-js

## Método 1: Script Automático (Mais Fácil)

1. No terminal, execute:
   ```bash
   ./instalar-supabase.sh
   ```

## Método 2: Manual

### Passo 1: Abrir Terminal

**No VS Code/Cursor:**
- Pressione `Ctrl + \`` (backtick) ou `Cmd + \`` no Mac
- Ou vá em: Terminal → New Terminal

**No macOS:**
- Abra o Terminal (Aplicativos → Utilitários → Terminal)

### Passo 2: Navegar até a Pasta do Projeto

```bash
cd ~/Downloads/rodrigo-nutra-hub-main/rodrigo-nutra-hub
```

### Passo 3: Verificar se está na Pasta Correta

```bash
ls package.json
```

Se aparecer `package.json`, você está no lugar certo! ✅

### Passo 4: Instalar

```bash
npm install @supabase/supabase-js
```

## ❌ Problemas Comuns

### Erro: "command not found: npm"

**Solução:** Instale o Node.js:
1. Acesse: https://nodejs.org
2. Baixe a versão LTS (Long Term Support)
3. Instale o arquivo .pkg
4. Abra um novo terminal e tente novamente

### Erro: "permission denied"

**Solução:** Use sudo (não recomendado) ou corrija permissões:
```bash
sudo npm install @supabase/supabase-js
```

### Erro: "Cannot find module"

**Solução:** Instale todas as dependências primeiro:
```bash
npm install
```

Depois instale o Supabase:
```bash
npm install @supabase/supabase-js
```

## ✅ Como Saber se Funcionou

Após executar, você deve ver algo como:

```
+ @supabase/supabase-js@2.x.x
added 1 package, and audited X packages in Ys
```

E o arquivo `package.json` será atualizado automaticamente.

## 🆘 Ainda com Problemas?

1. Verifique se o Node.js está instalado:
   ```bash
   node --version
   npm --version
   ```

2. Se não estiver instalado, baixe em: https://nodejs.org

3. Depois de instalar, feche e abra o terminal novamente

4. Tente novamente o comando de instalação

