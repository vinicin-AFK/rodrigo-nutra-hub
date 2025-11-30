# 🚫 Como Desabilitar o Supabase

## Método 1: Variável de Ambiente (Recomendado)

Adicione esta linha no arquivo `.env.local`:

```env
VITE_DISABLE_SUPABASE=true
```

**Vantagens:**
- ✅ Fácil de ativar/desativar
- ✅ Não precisa modificar código
- ✅ Funciona imediatamente após reiniciar o servidor

**Passos:**
1. Abra o arquivo `.env.local` na raiz do projeto
2. Adicione a linha: `VITE_DISABLE_SUPABASE=true`
3. Salve o arquivo
4. **Reinicie o servidor de desenvolvimento** (`npm run dev`)

---

## Método 2: Comentar Variáveis do Supabase

Comente ou remova as variáveis do Supabase no `.env.local`:

```env
# VITE_SUPABASE_URL=https://seu-projeto.supabase.co
# VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

**Passos:**
1. Abra o arquivo `.env.local`
2. Adicione `#` no início das linhas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. Salve o arquivo
4. **Reinicie o servidor de desenvolvimento** (`npm run dev`)

---

## Método 3: Remover Variáveis Completamente

Simplesmente remova ou delete as linhas do `.env.local`:

```env
# Remova estas linhas:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
```

**Passos:**
1. Abra o arquivo `.env.local`
2. Delete as linhas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. Salve o arquivo
4. **Reinicie o servidor de desenvolvimento** (`npm run dev`)

---

## ✅ Como Verificar se Está Desabilitado

Após reiniciar o servidor, abra o console do navegador (F12) e procure por:

```
🚫 Supabase DESABILITADO manualmente (VITE_DISABLE_SUPABASE=true)
📱 Aplicação funcionando em modo OFFLINE completo
```

ou

```
⚠️ Supabase não configurado!
A aplicação funcionará em modo offline.
```

---

## 🔄 Como Reabilitar o Supabase

### Se usou Método 1:
Remova ou comente a linha `VITE_DISABLE_SUPABASE=true` do `.env.local`

### Se usou Método 2 ou 3:
Adicione novamente as variáveis no `.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

**Importante:** Sempre reinicie o servidor após alterar o `.env.local`!

---

## 📱 O Que Acontece no Modo Offline?

Quando o Supabase está desabilitado:

- ✅ **Posts:** Salvos apenas no `localStorage` (não sincronizam entre dispositivos)
- ✅ **Mensagens:** Salvos apenas no `localStorage` (não sincronizam entre dispositivos)
- ✅ **Login/Registro:** Funciona apenas localmente (sem persistência no servidor)
- ✅ **Perfil:** Atualizações apenas locais
- ✅ **Feed:** Mostra apenas posts salvos localmente
- ✅ **Chat:** Mostra apenas mensagens salvas localmente

**Limitação:** Dados não são compartilhados entre usuários ou dispositivos.

---

## ⚠️ Importante

- **Sempre reinicie o servidor** após alterar o `.env.local`
- Dados salvos no `localStorage` **não são perdidos** ao desabilitar o Supabase
- Para reabilitar, basta remover a variável `VITE_DISABLE_SUPABASE` ou adicionar as credenciais novamente

