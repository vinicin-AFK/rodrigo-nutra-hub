#!/bin/bash

echo "🔧 Atualizando API Key do Supabase..."
echo ""

# Nova chave fornecida
NEW_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Z2VqaG92dnpjem1oZXVka211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTU1NjcsImV4cCI6MjA3OTc3MTU2N30.uCmJswdQ5QmfE930yqOfwhEGRTKMzRwxeRaupp4gtVM"

if [ -f ".env.local" ]; then
  # Backup
  cp .env.local .env.local.backup
  echo "✅ Backup criado"
  
  # Atualizar
  sed -i '' "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$NEW_KEY|" .env.local
  
  echo "✅ Chave atualizada no .env.local"
  echo ""
  echo "🔄 Testando conexão..."
  node test-supabase.js
else
  echo "❌ Arquivo .env.local não encontrado!"
  exit 1
fi
