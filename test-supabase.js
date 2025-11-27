// Script para testar a conexão com Supabase
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ler o arquivo .env.local
let envContent = '';
try {
  envContent = readFileSync(join(__dirname, '.env.local'), 'utf-8');
} catch (error) {
  console.error('❌ Erro ao ler .env.local:', error.message);
  process.exit(1);
}

// Extrair variáveis
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

if (!urlMatch || !keyMatch) {
  console.error('❌ Variáveis não encontradas no .env.local');
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseAnonKey = keyMatch[1].trim();

console.log('🔍 Testando conexão com Supabase...');
console.log('📋 URL:', supabaseUrl.substring(0, 40) + '...');
console.log('🔑 Key:', supabaseAnonKey.substring(0, 30) + '...');
console.log('');

// Criar cliente
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Testar conexão
async function testConnection() {
  try {
    console.log('1️⃣ Testando autenticação...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Erro na autenticação:', authError.message);
      if (authError.message.includes('Invalid API key') || authError.message.includes('JWT')) {
        console.error('');
        console.error('⚠️  A API key está INVÁLIDA ou EXPIRADA!');
        console.error('');
        console.error('📝 Para corrigir:');
        console.error('1. Acesse: https://supabase.com/dashboard');
        console.error('2. Selecione seu projeto');
        console.error('3. Vá em Settings → API');
        console.error('4. Copie a nova "anon public" key');
        console.error('5. Atualize o .env.local com a nova chave');
        return;
      }
    } else {
      console.log('✅ Autenticação OK');
    }
    
    console.log('');
    console.log('2️⃣ Testando acesso a tabelas...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Erro ao acessar tabela profiles:', profilesError.message);
      if (profilesError.message.includes('Invalid API key') || profilesError.code === 'PGRST301') {
        console.error('');
        console.error('⚠️  A API key está INVÁLIDA ou não tem permissões!');
        console.error('');
        console.error('📝 Para corrigir:');
        console.error('1. Acesse: https://supabase.com/dashboard');
        console.error('2. Selecione seu projeto');
        console.error('3. Vá em Settings → API');
        console.error('4. Copie a nova "anon public" key');
        console.error('5. Atualize o .env.local com a nova chave');
        return;
      }
    } else {
      console.log('✅ Acesso a tabelas OK');
    }
    
    console.log('');
    console.log('✅✅✅ TUDO FUNCIONANDO! A conexão com Supabase está OK!');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

testConnection();

