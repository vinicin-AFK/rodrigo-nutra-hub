# 🖥️ Como Rodar o Projeto Localmente

## 📋 Pré-requisitos

- Node.js instalado (versão 18 ou superior)
- npm ou yarn

## 🚀 Passos para Rodar Localmente

### 1. Instalar Dependências

```bash
npm install
```

ou

```bash
yarn install
```

### 2. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

O projeto estará disponível em:
- **Local**: http://localhost:8080
- **Rede**: http://[seu-ip]:8080

### 3. Build para Produção (Opcional)

```bash
npm run build
```

Isso cria a pasta `dist` com os arquivos otimizados.

### 4. Preview do Build (Opcional)

```bash
npm run preview
```

Isso serve a versão de produção localmente.

---

## 🔧 Configuração do Servidor

O servidor está configurado para:
- **Porta**: 8080
- **Host**: `::` (aceita conexões de qualquer IP)
- **Hot Reload**: Ativado (mudanças aparecem automaticamente)

---

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Serve build de produção localmente
- `npm run lint` - Verifica erros de código

---

## 🆘 Problemas Comuns

### "command not found: npm"
- Instale o Node.js: https://nodejs.org/
- Ou use: `nvm install node` (se tiver nvm)

### "Port 8080 already in use"
- Mude a porta no `vite.config.ts`
- Ou mate o processo: `lsof -ti:8080 | xargs kill`

### "Module not found"
- Execute: `npm install` novamente
- Delete `node_modules` e `package-lock.json`, depois `npm install`

### Erros de TypeScript
- Execute: `npm run build` para ver erros detalhados
- Verifique se todas as dependências estão instaladas

---

## 🌐 Acessar de Outros Dispositivos

Se quiser acessar de outro dispositivo na mesma rede:

1. Descubra seu IP local:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "
   
   # Ou
   ipconfig getifaddr en0
   ```

2. Acesse de outro dispositivo:
   ```
   http://[seu-ip]:8080
   ```

---

## ✅ Verificação

Após iniciar, você deve ver:
- Console mostrando: `Local: http://localhost:8080`
- Navegador abrindo automaticamente
- Página carregando sem erros

---

## 🎯 Dica

Se o Node não estiver no PATH, tente:
- `source ~/.zshrc` (se usar zsh)
- `source ~/.bash_profile` (se usar bash)
- Ou use o caminho completo: `/usr/local/bin/npm`

