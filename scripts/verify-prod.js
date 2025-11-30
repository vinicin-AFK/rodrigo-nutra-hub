#!/usr/bin/env node

/**
 * Script de Validação para Produção
 * 
 * Valida que as variáveis do Supabase estão corretas antes do deploy
 * Versão mais rigorosa que verify-env.js
 */

const SUPABASE_URL_REQUIRED = 'https://kfyzcqaerlwqcmlbcgts.supabase.co';
const MIN_KEY_LENGTH = 20;

function validateProduction() {
  console.log('🔍 ============================================');
  console.log('🔍 VALIDAÇÃO DE PRODUÇÃO');
  console.log('🔍 ============================================\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  let hasErrors = false;

  // Validar URL
  if (!supabaseUrl) {
    console.error('❌ ERRO: VITE_SUPABASE_URL não está definida');
    hasErrors = true;
  } else if (supabaseUrl !== SUPABASE_URL_REQUIRED) {
    console.error('❌ ERRO: VITE_SUPABASE_URL está incorreta');
    console.error(`   Esperado: ${SUPABASE_URL_REQUIRED}`);
    console.error(`   Encontrado: ${supabaseUrl}`);
    hasErrors = true;
  } else {
    console.log('✅ VITE_SUPABASE_URL:', supabaseUrl);
  }

  // Validar Key
  if (!supabaseKey) {
    console.error('❌ ERRO: VITE_SUPABASE_ANON_KEY não está definida');
    hasErrors = true;
  } else if (supabaseKey.length < MIN_KEY_LENGTH) {
    console.error(`❌ ERRO: VITE_SUPABASE_ANON_KEY muito curta (${supabaseKey.length} caracteres, mínimo ${MIN_KEY_LENGTH})`);
    hasErrors = true;
  } else if (supabaseKey.includes('localhost') || supabaseKey.includes('placeholder')) {
    console.error('❌ ERRO: VITE_SUPABASE_ANON_KEY parece ser inválida (contém localhost ou placeholder)');
    hasErrors = true;
  } else {
    console.log('✅ VITE_SUPABASE_ANON_KEY:', supabaseKey.slice(0, 20) + '...');
  }

  // Validar URL não contém localhost
  if (supabaseUrl && (
    supabaseUrl.includes('localhost') ||
    supabaseUrl.includes('127.0.0.1') ||
    supabaseUrl.includes('192.168.') ||
    supabaseUrl.includes('10.0.') ||
    supabaseUrl.startsWith('http://')
  )) {
    console.error('❌ ERRO: VITE_SUPABASE_URL contém localhost ou IP local');
    console.error('   Use APENAS a URL pública do Supabase');
    hasErrors = true;
  }

  console.log('\n🔍 ============================================');
  
  if (hasErrors) {
    console.error('❌ VALIDAÇÃO FALHOU - ABORTANDO DEPLOY');
    console.error('\n📋 Configure as variáveis de ambiente:');
    console.error(`   VITE_SUPABASE_URL=${SUPABASE_URL_REQUIRED}`);
    console.error('   VITE_SUPABASE_ANON_KEY=sua_chave_aqui');
    process.exit(1);
  } else {
    console.log('✅ VALIDAÇÃO PASSOU - Pronto para deploy');
    console.log('🔍 ============================================\n');
    process.exit(0);
  }
}

validateProduction();

