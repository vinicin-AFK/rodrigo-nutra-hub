#!/bin/bash
# Script definitivo para configurar push automático

echo "=========================================="
echo "CONFIGURAÇÃO DEFINITIVA DE PUSH"
echo "=========================================="
echo ""

# Verificar se token foi passado como argumento
if [ -z "$1" ]; then
    echo "❌ ERRO: Token não fornecido!"
    echo ""
    echo "Uso: $0 <seu-token-ghp_...>"
    echo ""
    echo "Para obter o token:"
    echo "1. Acesse: https://github.com/settings/tokens"
    echo "2. Generate new token (classic)"
    echo "3. Marque APENAS 'repo'"
    echo "4. Copie o token (começa com ghp_)"
    echo ""
    exit 1
fi

TOKEN=$1

echo "🔧 Configurando Git..."
echo ""

# Limpar credenciais antigas
echo "Limpando credenciais antigas..."
git credential-osxkeychain erase <<EOF
protocol=https
host=github.com
EOF
echo ""

# Configurar remote
git remote set-url origin https://github.com/vinicin-AFK/rodrigo-nutra-hub.git

# Salvar credenciais no keychain
echo "Salvando credenciais no Keychain..."
echo "protocol=https
host=github.com
username=vinicin-AFK
password=${TOKEN}" | git credential-osxkeychain store

echo "✅ Credenciais salvas!"
echo ""

# Testar push
echo "🧪 Testando push..."
git push

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ SUCESSO! Push automático configurado!"
    echo "=========================================="
    echo ""
    echo "Agora todos os commits farão push automaticamente!"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "❌ ERRO no push"
    echo "=========================================="
    echo ""
    echo "Verifique:"
    echo "- Token está correto (começa com ghp_)"
    echo "- Token tem permissão 'repo'"
    echo "- Está usando conta vinicin-AFK"
    echo ""
    exit 1
fi

