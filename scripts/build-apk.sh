#!/bin/bash

# Script para build do APK com validação
# Garante que o .env correto seja usado

set -e  # Parar em caso de erro

echo "🚀 Iniciando build do APK com validação..."

# Validar variáveis de ambiente
echo "🔍 Validando variáveis de ambiente..."
npm run verify:env

if [ $? -ne 0 ]; then
  echo "❌ Validação falhou. Abortando build do APK."
  exit 1
fi

# Limpar builds antigas
echo "🧹 Limpando builds antigas..."
rm -rf dist build android/app/build 2>/dev/null || true

# Build do projeto
echo "📦 Fazendo build do projeto..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build falhou. Abortando."
  exit 1
fi

echo "✅ Build concluído com sucesso!"
echo "📱 Agora você pode gerar o APK usando seu framework mobile (Capacitor/Cordova/etc)"

