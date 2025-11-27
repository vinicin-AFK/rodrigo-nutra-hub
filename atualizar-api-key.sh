#!/bin/bash

echo "🔧 Atualizar API Key do Supabase"
echo ""
echo "📋 Passos:"
echo "1. Acesse: https://supabase.com/dashboard"
echo "2. Selecione seu projeto"
echo "3. Vá em Settings → API"
echo "4. Copie a chave 'anon public'"
echo ""
read -p "Cole a nova API key aqui: " new_key

if [ -z "$new_key" ]; then
  echo "❌ Chave vazia. Operação cancelada."
  exit 1
fi

# Atualizar .env.local
if [ -f ".env.local" ]; then
  # Backup
  cp .env.local .env.local.backup
  echo "✅ Backup criado: .env.local.backup"
  
  # Atualizar
  sed -i '' "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$new_key|" .env.local
  
  echo "✅ API key atualizada no .env.local"
  echo ""
  echo "🔄 Agora recarregue o servidor de desenvolvimento:"
  echo "   Pressione Ctrl+C e execute: npm run dev"
else
  echo "❌ Arquivo .env.local não encontrado!"
  exit 1
fi

