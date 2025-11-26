# ✅ Próximos Passos - Integração Supabase

## ✅ Passo 1: Banco de Dados Configurado
Você já executou o `supabase_setup.sql` com sucesso! 🎉

## 📋 Passo 2: Instalar Dependência

Execute no terminal:

```bash
npm install @supabase/supabase-js
```

## 🔑 Passo 3: Configurar Variáveis de Ambiente

1. No Supabase, vá em **Settings** → **API**
2. Copie:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon/public key**

3. Crie o arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-aqui
```

⚠️ **IMPORTANTE**: O arquivo `.env.local` já está no `.gitignore`, então suas credenciais não serão commitadas.

## 🔧 Passo 4: Criar Cliente Supabase

Crie o arquivo `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## 🚀 Passo 5: Testar Conexão

Crie um arquivo de teste temporário `src/test-supabase.ts`:

```typescript
import { supabase } from './lib/supabase';

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count');

    if (error) {
      console.error('❌ Erro:', error);
    } else {
      console.log('✅ Conexão com Supabase funcionando!');
    }
  } catch (error) {
    console.error('❌ Erro de conexão:', error);
  }
}

testConnection();
```

## 📝 Passo 6: Integrar com o Código

Agora você pode seguir o guia `INTEGRACAO_SUPABASE.md` para:

1. Atualizar o `AuthContext` para usar autenticação do Supabase
2. Criar hooks para postagens e mensagens
3. Substituir localStorage por Supabase

## 🎯 Checklist

- [x] Banco de dados criado no Supabase
- [x] Tabelas e políticas configuradas
- [ ] Dependência `@supabase/supabase-js` instalada
- [ ] Variáveis de ambiente configuradas
- [ ] Cliente Supabase criado
- [ ] Conexão testada
- [ ] Código integrado

## 💡 Dicas

- **Teste primeiro**: Use o SQL Editor do Supabase para testar queries
- **Verifique RLS**: As políticas de segurança estão ativas
- **Logs**: Use `console.log` para debugar queries
- **Tempo Real**: O Supabase suporta atualizações em tempo real via WebSockets

## 🆘 Problemas Comuns

### Erro: "Variáveis de ambiente não configuradas"
- Verifique se o arquivo `.env.local` existe
- Reinicie o servidor de desenvolvimento após criar `.env.local`

### Erro: "Row Level Security policy violation"
- Verifique se as políticas RLS estão corretas
- Certifique-se de que o usuário está autenticado

### Erro: "relation does not exist"
- Verifique se executou todo o `supabase_setup.sql`
- Confira se as tabelas foram criadas no Supabase

Boa sorte com a integração! 🚀

