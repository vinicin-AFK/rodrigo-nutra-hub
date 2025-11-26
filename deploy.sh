#!/bin/bash
# Script para fazer deploy na Vercel

echo "=========================================="
echo "Deploy na Vercel"
echo "=========================================="
echo ""

# Verificar se npx está disponível
if command -v npx &> /dev/null; then
    echo "✅ npx encontrado!"
    echo ""
    echo "Fazendo deploy via Vercel CLI..."
    echo ""
    
    # Fazer deploy
    npx vercel --prod
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Deploy realizado com sucesso!"
    else
        echo ""
        echo "❌ Erro no deploy."
        echo ""
        echo "Tente fazer deploy via interface web:"
        echo "https://vercel.com/new"
    fi
else
    echo "❌ npx não encontrado."
    echo ""
    echo "Para fazer deploy, você tem 2 opções:"
    echo ""
    echo "OPÇÃO 1: Via Interface Web (Recomendado)"
    echo "─────────────────────────────────────────────"
    echo "1. Acesse: https://vercel.com/new"
    echo "2. Login com GitHub"
    echo "3. Importe: vinicin-AFK/rodrigo-nutra-hub"
    echo "4. Clique em Deploy"
    echo ""
    echo "OPÇÃO 2: Instalar Vercel CLI"
    echo "─────────────────────────────────────────────"
    echo "npm i -g vercel"
    echo "vercel login"
    echo "vercel --prod"
    echo ""
fi

echo "=========================================="

