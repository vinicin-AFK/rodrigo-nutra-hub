#!/bin/bash

echo "🚀 Iniciando desenvolvimento local..."
echo ""

# Verifica se node_modules existe
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependências..."
  npm install
  echo ""
fi

# Verifica se .env.local existe
if [ ! -f ".env.local" ]; then
  echo "⚠️  Arquivo .env.local não encontrado!"
  echo "💡 Se você usa Supabase, crie um arquivo .env.local com:"
  echo "   VITE_SUPABASE_URL=sua_url"
  echo "   VITE_SUPABASE_ANON_KEY=sua_chave"
  echo ""
fi

echo "✅ Iniciando servidor de desenvolvimento..."
echo "🌐 O app estará disponível em: http://localhost:8080"
echo ""
echo "💡 Pressione Ctrl+C para parar o servidor"
echo ""

npm run dev

