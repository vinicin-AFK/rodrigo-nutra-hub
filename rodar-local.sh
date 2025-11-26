#!/bin/bash
# Script para rodar o projeto localmente

echo "=========================================="
echo "Rodando Projeto Localmente"
echo "=========================================="
echo ""

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    echo ""
    
    # Tentar diferentes comandos
    if command -v npm &> /dev/null; then
        npm install
    elif command -v yarn &> /dev/null; then
        yarn install
    elif [ -f "/usr/local/bin/npm" ]; then
        /usr/local/bin/npm install
    else
        echo "❌ npm não encontrado!"
        echo ""
        echo "Instale o Node.js: https://nodejs.org/"
        echo "Ou execute manualmente: npm install"
        exit 1
    fi
    
    echo ""
    echo "✅ Dependências instaladas!"
    echo ""
fi

# Iniciar servidor
echo "🚀 Iniciando servidor de desenvolvimento..."
echo ""
echo "O projeto estará disponível em:"
echo "  - Local: http://localhost:8080"
echo "  - Rede: http://[seu-ip]:8080"
echo ""
echo "Pressione Ctrl+C para parar o servidor"
echo "=========================================="
echo ""

# Tentar diferentes comandos
if command -v npm &> /dev/null; then
    npm run dev
elif command -v yarn &> /dev/null; then
    yarn dev
elif [ -f "/usr/local/bin/npm" ]; then
    /usr/local/bin/npm run dev
else
    echo "❌ npm não encontrado!"
    echo ""
    echo "Instale o Node.js: https://nodejs.org/"
    exit 1
fi

