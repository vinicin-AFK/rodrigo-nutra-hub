# 🔍 Diagnóstico: Sincronização de Postagens e Mensagens

## Como Verificar o Problema

### 1. Abra o Console do Navegador

1. Abra o app no navegador
2. Pressione `F12` ou `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
3. Vá na aba **Console**

### 2. Verifique os Logs

Procure por estas mensagens:

#### ✅ Se Supabase está configurado:
```
✅ Supabase configurado: https://xxxxx.supabase.co...
🔑 Chave configurada: eyJhbGciOiJIUzI1NiIs...
```

#### ⚠️ Se Supabase NÃO está configurado:
```
⚠️ Supabase não configurado!
📋 Variáveis encontradas: { hasUrl: false, hasKey: false, ... }
```

### 3. Teste Publicar uma Postagem

Quando você tentar publicar, verá logs como:

```
📝 Criando postagem... { isSupabaseConfigured: true/false, ... }
👤 Usuário autenticado: { userId: "...", ... }
💾 Salvando no Supabase...
✅ Postagem salva no Supabase: ...
🔄 Recarregando postagens do Supabase...
```

### 4. Possíveis Problemas e Soluções

#### Problema 1: "Supabase não configurado"

**Sintoma:**
```
⚠️ Supabase não configurado!
```

**Solução:**
1. Verifique se existe o arquivo `.env.local` na raiz do projeto
2. Verifique se contém:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-aqui
   ```
3. **Reinicie o servidor** após criar/editar o `.env.local`:
   ```bash
   # Pare o servidor (Ctrl+C)
   npm run dev
   ```

#### Problema 2: "Usuário não autenticado"

**Sintoma:**
```
⚠️ Usuário não autenticado no Supabase, usando fallback
```

**Solução:**
1. Faça logout e login novamente
2. Verifique se você está usando a autenticação do Supabase (não apenas localStorage)
3. Verifique se o `AuthContext` está usando `supabase.auth.signInWithPassword`

#### Problema 3: "Erro ao inserir no Supabase"

**Sintoma:**
```
❌ Erro ao inserir no Supabase: { message: "...", ... }
```

**Soluções possíveis:**

1. **Tabelas não criadas:**
   - Execute o arquivo `supabase_setup.sql` no Supabase SQL Editor
   - Verifique se as tabelas `posts`, `community_messages`, `profiles` existem

2. **Políticas RLS bloqueando:**
   - No Supabase, vá em **Authentication** → **Policies**
   - Verifique se as políticas permitem INSERT para usuários autenticados

3. **Erro de permissão:**
   - Verifique se a chave `anon` tem permissões corretas
   - Verifique se as políticas RLS estão configuradas corretamente

#### Problema 4: "Nenhuma postagem encontrada no Supabase"

**Sintoma:**
```
⚠️ Nenhuma postagem encontrada no Supabase, usando cache local
```

**Isso é normal se:**
- É a primeira vez que você usa o app
- Ninguém publicou ainda

**Para testar:**
1. Publique uma postagem
2. Verifique se aparece: `✅ Postagem salva no Supabase: ...`
3. Recarregue a página
4. Verifique se aparece: `✅ Postagens carregadas do Supabase: 1`

### 5. Teste Completo

Execute estes passos na ordem:

1. **Verifique configuração:**
   - Console deve mostrar: `✅ Supabase configurado`

2. **Faça login:**
   - Console deve mostrar: `👤 Usuário autenticado: { userId: "..." }`

3. **Publique uma postagem:**
   - Console deve mostrar: `✅ Postagem salva no Supabase: ...`
   - Console deve mostrar: `✅ Postagens carregadas do Supabase: X`

4. **Recarregue a página:**
   - Console deve mostrar: `✅ Postagens carregadas do Supabase: X`
   - A postagem deve aparecer no feed

5. **Teste em outro navegador/dispositivo:**
   - Faça login com outra conta
   - A postagem deve aparecer também

### 6. Se Ainda Não Funcionar

Envie estas informações:

1. **Screenshot do console** com todos os logs
2. **Mensagens de erro** completas
3. **Verificação:**
   - [ ] `.env.local` existe e tem as variáveis corretas
   - [ ] Servidor foi reiniciado após criar `.env.local`
   - [ ] Tabelas foram criadas no Supabase
   - [ ] Políticas RLS estão configuradas
   - [ ] Usuário está autenticado (não apenas localStorage)

### 7. Modo Offline (Fallback)

Se o Supabase não estiver configurado, o app funciona em **modo offline**:
- Postagens são salvas apenas no `localStorage`
- Cada usuário vê apenas suas próprias postagens
- Não há sincronização entre usuários

**Para ter rede social compartilhada, o Supabase DEVE estar configurado!**

