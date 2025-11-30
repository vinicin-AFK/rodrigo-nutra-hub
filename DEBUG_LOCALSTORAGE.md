# 🔍 Debug: Por que os dados desaparecem após refresh?

## ⚠️ Problema

Após atualizar a página:
- Login é finalizado
- Conversas somem
- Publicações somem

## 🔍 Como Diagnosticar

### 1. Abrir Console do Navegador

1. Pressione `Cmd + Option + J` (Mac) ou `F12` (Windows)
2. Vá na aba **Console**

### 2. Verificar Logs de Salvamento

Procure por estas mensagens:

```
💾 [AUTO-SAVE] Salvando usuário no localStorage: Nome do Usuário
✅ [AUTO-SAVE] Usuário salvo com sucesso
💾 Posts salvos no localStorage: 10
💾 Mensagens salvas no localStorage: 20
```

**Se aparecer:**
```
❌ [AUTO-SAVE] ERRO: Usuário NÃO foi salvo!
❌ ERRO: Não foi possível salvar posts no localStorage!
```

**Problema:** localStorage está cheio ou bloqueado

### 3. Verificar localStorage Manualmente

No console, digite:

```javascript
// Verificar usuário
localStorage.getItem('nutraelite_auth')

// Verificar posts
localStorage.getItem('nutraelite_posts')

// Verificar mensagens
localStorage.getItem('nutraelite_community_messages')
```

**Se retornar `null`:**
- Dados não foram salvos
- localStorage foi limpo
- Há um erro ao salvar

### 4. Verificar se localStorage está Cheio

No console, digite:

```javascript
// Verificar espaço usado
let total = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    total += localStorage[key].length + key.length;
  }
}
console.log('Espaço usado:', total, 'bytes');
console.log('Espaço disponível:', (5 * 1024 * 1024) - total, 'bytes');
```

**Se estiver perto de 5MB:**
- localStorage está cheio
- Dados podem não estar sendo salvos

### 5. Verificar se Há Código Limpando localStorage

No console, digite:

```javascript
// Monitorar remoções
const originalRemove = localStorage.removeItem;
localStorage.removeItem = function(key) {
  console.warn('⚠️ localStorage.removeItem chamado:', key);
  return originalRemove.apply(this, arguments);
};

const originalClear = localStorage.clear;
localStorage.clear = function() {
  console.error('❌ localStorage.clear chamado!');
  return originalClear.apply(this, arguments);
};
```

**Isso mostrará quando e o que está sendo removido**

---

## 🛠️ Soluções

### Solução 1: Limpar localStorage Manualmente

Se localStorage estiver cheio:

1. Abra o console
2. Digite:
```javascript
// Limpar apenas dados temporários
localStorage.removeItem('nutraelite_temp');
localStorage.removeItem('nutraelite_cache');
localStorage.removeItem('__storage_test__');
```

### Solução 2: Verificar se Dados Estão Sendo Salvos

1. Faça login
2. Crie um post
3. No console, verifique:
```javascript
localStorage.getItem('nutraelite_auth')
localStorage.getItem('nutraelite_posts')
```

**Se retornar dados:**
- Dados estão sendo salvos
- Problema pode ser no carregamento

**Se retornar `null`:**
- Dados não estão sendo salvos
- Verificar erros no console

### Solução 3: Forçar Salvamento Manual

No console, digite:

```javascript
// Salvar usuário manualmente
const user = { id: 'xxx', name: 'Teste', email: 'teste@teste.com' };
localStorage.setItem('nutraelite_auth', JSON.stringify({ user, timestamp: Date.now() }));

// Verificar se foi salvo
console.log('Salvo:', localStorage.getItem('nutraelite_auth'));
```

---

## 📋 Checklist de Debug

- [ ] Console mostra logs de salvamento (`💾`)
- [ ] `localStorage.getItem('nutraelite_auth')` retorna dados
- [ ] `localStorage.getItem('nutraelite_posts')` retorna dados
- [ ] `localStorage.getItem('nutraelite_community_messages')` retorna dados
- [ ] Não há erros de quota no console
- [ ] Não há código limpando localStorage inesperadamente

---

## 🚨 Problemas Comuns

### Problema: localStorage retorna `null`

**Causa:** Dados não foram salvos ou foram limpos

**Solução:**
1. Verificar se há erros no console
2. Verificar se localStorage está cheio
3. Verificar se há código limpando dados

### Problema: Dados aparecem mas somem após refresh

**Causa:** Código está limpando dados após carregar

**Solução:**
1. Verificar logs de `removeItem` ou `clear`
2. Verificar se há código que limpa dados quando Supabase falha

### Problema: localStorage está cheio

**Causa:** Muitos dados salvos

**Solução:**
1. Limpar dados temporários
2. Reduzir quantidade de posts/mensagens salvos
3. Usar IndexedDB para dados maiores

---

## 💡 Próximos Passos

1. Abrir console
2. Verificar logs de salvamento
3. Verificar se dados estão no localStorage
4. Compartilhar resultados para diagnóstico

