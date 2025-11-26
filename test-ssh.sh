#!/bin/bash
# Script para testar a conexão SSH após adicionar a chave

echo "=========================================="
echo "Testando conexão SSH com GitHub..."
echo "=========================================="
echo ""

# Testar com a nova chave
ssh -T -i ~/.ssh/id_ed25519_vinicin_afk git@github.com 2>&1

echo ""
echo "=========================================="
echo "Se aparecer 'Hi vinicin-AFK!', está funcionando!"
echo "=========================================="

