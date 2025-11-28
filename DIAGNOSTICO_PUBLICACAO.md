# 🔍 Diagnóstico: Publicação não aparece no Supabase

## Passos para Diagnosticar

### 1. Verificar Console do Navegador

1. Abra o aplicativo no navegador
2. Pressione `F12` ou `Ctrl+Shift+I` (Windows/Linux) ou `Cmd+Option+I` (Mac)
3. Vá para a aba **Console**
4. Crie uma nova publicação
5. Procure por estas mensagens:

#### ✅ Se aparecer:
```
✅ Postagem sincronizada com Supabase: [id]
```
**Significa que foi salvo com sucesso!** Verifique se o ID aparece na tabela.

#### ❌ Se aparecer:
```
❌ Erro ao sincronizar com Supabase: [erro]
📋 Detalhes do erro: {...}
```

Copie os detalhes do erro e veja abaixo o que fazer.

### 2. Verificar Autenticação

No console, digite:
```javascript
// Verificar se está autenticado
const { data: { user } } = await supabase.auth.getUser();
console.log('Usuário autenticado:', user);
```

**Se `user` for `null`**: Você não está autenticado. Faça login novamente.

### 3. Verificar Perfil no Supabase

No console, digite:
```javascript
// Verificar se o perfil existe
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  console.log('Perfil:', profile);
  console.log('Erro:', error);
}
```

**Se `profile` for `null`**: O perfil não existe. O sistema tentará criar automaticamente, mas pode falhar.

### 4. Verificar Variáveis de Ambiente

No console, digite:
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
```

**Se aparecer `undefined`**: As variáveis não estão configuradas. Veja o passo 5.

### 5. Verificar Arquivo .env.local

1. Na raiz do projeto, verifique se existe o arquivo `.env.local`
2. Abra o arquivo e verifique se contém:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```
3. **IMPORTANTE**: Após modificar `.env.local`, você precisa **reiniciar o servidor de desenvolvimento**:
   - Pare o servidor (Ctrl+C)
   - Execute `npm run dev` novamente

### 6. Testar Inserção Manual

No console do navegador, digite:
```javascript
// Testar inserção manual
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      content: 'Teste de publicação',
      status: 'active',
    })
    .select()
    .single();
  
  console.log('Resultado:', data);
  console.log('Erro:', error);
}
```

**Se der erro**, copie a mensagem de erro completa.

## Erros Comuns e Soluções

### Erro: "new row violates row-level security policy"
**Causa**: As políticas RLS estão bloqueando a inserção.
**Solução**: Verifique se você está autenticado e se o `author_id` corresponde ao `auth.uid()`.

### Erro: "Invalid API key"
**Causa**: A chave do Supabase está incorreta ou expirada.
**Solução**: 
1. Vá no Supabase Dashboard → Settings → API
2. Copie a chave `anon/public key` novamente
3. Atualize o `.env.local`
4. Reinicie o servidor

### Erro: "relation 'posts' does not exist"
**Causa**: A tabela `posts` não foi criada.
**Solução**: Execute o script `supabase_tabelas_comunidade.sql` no Supabase.

### Erro: "duplicate key value violates unique constraint"
**Causa**: Tentando inserir um post com ID duplicado.
**Solução**: Isso é normal se você tentar inserir o mesmo post duas vezes. O sistema deve gerar um novo ID.

### Erro: "null value in column 'author_id' violates not-null constraint"
**Causa**: O usuário não está autenticado.
**Solução**: Faça login novamente.

## Verificar no Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá em **Table Editor** → **posts**
4. Verifique se há publicações lá
5. Se não houver, veja a aba **Logs** para verificar erros

## Próximos Passos

Se após seguir todos os passos acima ainda não funcionar:

1. Copie TODA a mensagem de erro do console
2. Verifique se você está logado
3. Verifique se as variáveis de ambiente estão configuradas
4. Verifique se o servidor foi reiniciado após configurar as variáveis

