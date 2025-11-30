# 🔧 Como Corrigir a Variável no Vercel - Passo a Passo

## ⚠️ Problema Atual

A URL do Supabase no Vercel está **ERRADA**:
- ❌ **Atual (ERRADO):** `https://qxgejhovvzczmheudkmu.supabase.co`
- ✅ **Correto:** `https://kfyzcqaerlwqcmlbcgts.supabase.co`

---

## 📋 Passo a Passo Completo

### **PASSO 1: Acessar o Vercel Dashboard**

1. Abra seu navegador
2. Acesse: **https://vercel.com/dashboard**
3. Faça login se necessário

### **PASSO 2: Selecionar o Projeto**

1. Na lista de projetos, encontre: **`rodrigo-nutra-hub`**
2. Clique no nome do projeto

### **PASSO 3: Acessar Settings (Configurações)**

1. No topo da página, clique na aba **"Settings"** (Configurações)
2. No menu lateral esquerdo, clique em **"Environment Variables"** (Variáveis de Ambiente)

### **PASSO 4: Encontrar e Editar a Variável `VITE_SUPABASE_URL`**

1. Você verá uma lista de variáveis de ambiente
2. Procure por: **`VITE_SUPABASE_URL`**
3. Você verá que o valor atual é: `https://qxgejhovvzczmheudkmu.supabase.co`
4. Clique nos **3 pontinhos** (⋯) à direita da variável
5. Selecione **"Edit"** (Editar)

### **PASSO 5: Corrigir o Valor**

1. No campo **"Value"** (Valor), você verá:
   ```
   https://qxgejhovvzczmheudkmu.supabase.co
   ```

2. **APAGUE** esse valor completamente

3. **DIGITE** o valor correto:
   ```
   https://kfyzcqaerlwqcmlbcgts.supabase.co
   ```

4. **IMPORTANTE:** Verifique que está marcado para **Production** (Produção)
   - ✅ Production
   - ✅ Preview (opcional)
   - ✅ Development (opcional)

5. Clique em **"Save"** (Salvar)

### **PASSO 6: Verificar a Variável `VITE_SUPABASE_ANON_KEY`**

1. Procure por: **`VITE_SUPABASE_ANON_KEY`**
2. Verifique se está configurada
3. Se não estiver, adicione:
   - Clique em **"Add New"** (Adicionar Nova)
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** Cole a chave completa do Supabase
   - Marque **Production**
   - Clique em **"Save"**

### **PASSO 7: Fazer Redeploy (OBRIGATÓRIO)**

⚠️ **IMPORTANTE:** Após alterar variáveis, você DEVE fazer redeploy!

**Opção A: Via Dashboard**
1. Clique na aba **"Deployments"** (Deployments)
2. Encontre o último deployment (o mais recente)
3. Clique nos **3 pontinhos** (⋯) à direita
4. Selecione **"Redeploy"** (Refazer Deploy)
5. Aguarde alguns minutos até completar

**Opção B: Via CLI**
```bash
vercel --prod
```

### **PASSO 8: Verificar se Funcionou**

1. Após o redeploy completar, acesse: **https://rodrigo-nutra-hub.vercel.app**
2. Abra o console do navegador (`Cmd + Option + J`)
3. Procure por:
   ```
   ✅ Supabase configurado corretamente
   ✅ URL: https://kfyzcqaerlwqcmlbcgts.supabase.co
   ```
4. Se aparecer isso, **funcionou!** 🎉

---

## 🎯 Resumo Rápido

1. **Vercel Dashboard** → Projeto `rodrigo-nutra-hub`
2. **Settings** → **Environment Variables**
3. **Editar** `VITE_SUPABASE_URL`
4. **Alterar** para: `https://kfyzcqaerlwqcmlbcgts.supabase.co`
5. **Salvar**
6. **Redeploy** (obrigatório!)
7. **Verificar** no console

---

## 🚨 Problemas Comuns

### Problema: Não encontro a variável

**Solução:**
- Pode não existir ainda
- Clique em **"Add New"** e crie:
  - Name: `VITE_SUPABASE_URL`
  - Value: `https://kfyzcqaerlwqcmlbcgts.supabase.co`
  - Environments: ✅ Production

### Problema: Redeploy não atualizou

**Solução:**
1. Limpe o cache do navegador (`Cmd + Shift + Delete`)
2. Faça hard refresh (`Cmd + Shift + R`)
3. Tente em modo anônimo

### Problema: Ainda mostra erro

**Solução:**
1. Verifique se o redeploy foi concluído
2. Verifique se a variável está marcada para **Production**
3. Aguarde 2-3 minutos e tente novamente

---

## 📸 Onde Encontrar no Vercel

```
Vercel Dashboard
  └── rodrigo-nutra-hub (projeto)
      └── Settings (aba no topo)
          └── Environment Variables (menu lateral)
              └── VITE_SUPABASE_URL (editar aqui)
```

---

## ✅ Checklist Final

Antes de considerar resolvido:

- [ ] Variável `VITE_SUPABASE_URL` editada
- [ ] Valor alterado para `https://kfyzcqaerlwqcmlbcgts.supabase.co`
- [ ] Marcada para **Production**
- [ ] Variável `VITE_SUPABASE_ANON_KEY` configurada
- [ ] **Redeploy feito** (obrigatório!)
- [ ] Console mostra `✅ Supabase configurado corretamente`
- [ ] App carrega sem tela de erro

---

## 💡 Dica

Se tiver dúvidas, tire um screenshot da tela de Environment Variables e me envie. Posso ajudar a identificar o que precisa ser alterado!

