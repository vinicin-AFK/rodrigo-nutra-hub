#!/bin/bash
# Script para fazer push usando Personal Access Token

echo "=========================================="
echo "Push para GitHub - Personal Access Token"
echo "=========================================="
echo ""

# Limpar credenciais antigas
echo "Limpando credenciais antigas..."
git credential-osxkeychain erase <<EOF
protocol=https
host=github.com
EOF

echo ""
echo "Para fazer push, você precisa de um Personal Access Token."
echo ""
echo "Se você ainda não tem um token:"
echo "1. Acesse: https://github.com/settings/tokens"
echo "2. Generate new token (classic)"
echo "3. Marque 'repo' e gere"
echo "4. Copie o token (começa com ghp_)"
echo ""

read -p "Cole seu Personal Access Token aqui: " TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ Token não fornecido. Cancelando."
    exit 1
fi

# Configurar URL com token
echo ""
echo "Configurando Git com token..."
git remote set-url origin https://${TOKEN}@github.com/vinicin-AFK/rodrigo-nutra-hub.git

# Fazer push
echo ""
echo "Fazendo push..."
git push

# Restaurar URL normal (sem token visível)
git remote set-url origin https://github.com/vinicin-AFK/rodrigo-nutra-hub.git

echo ""
if [ $? -eq 0 ]; then
    echo "✅ Push realizado com sucesso!"
    echo ""
    echo "As credenciais foram salvas no Keychain do macOS."
    echo "Próximos pushes não precisarão do token novamente."
else
    echo "❌ Erro no push."
    echo ""
    echo "Verifique:"
    echo "- O token está correto (começa com ghp_)"
    echo "- O token tem permissão 'repo'"
    echo "- Você está usando a conta vinicin-AFK"
fi

echo "=========================================="

