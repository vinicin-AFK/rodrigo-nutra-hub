#!/bin/bash
# Script para fazer push usando Personal Access Token

echo "=========================================="
echo "Push com Personal Access Token"
echo "=========================================="
echo ""
echo "Este script vai fazer push usando HTTPS."
echo "Quando pedir a senha, use seu TOKEN (não a senha do GitHub)."
echo ""
echo "Se você ainda não tem um token:"
echo "1. GitHub → Settings → Developer settings → Personal access tokens"
echo "2. Generate new token (classic)"
echo "3. Marque 'repo' e gere o token"
echo "4. Copie o token (começa com ghp_)"
echo ""
read -p "Pressione Enter para continuar ou Ctrl+C para cancelar..."
echo ""

# Fazer push
git push

echo ""
echo "=========================================="
if [ $? -eq 0 ]; then
    echo "✅ Push realizado com sucesso!"
else
    echo "❌ Erro no push."
    echo ""
    echo "Certifique-se de:"
    echo "- Usar o TOKEN como senha (não sua senha do GitHub)"
    echo "- O token começa com 'ghp_'"
    echo "- O token tem permissão 'repo'"
fi
echo "=========================================="

