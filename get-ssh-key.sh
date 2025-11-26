#!/bin/bash
# Script para copiar chave SSH de forma limpa

echo "=========================================="
echo "Chave SSH Ed25519 (Recomendada):"
echo "=========================================="
cat ~/.ssh/id_ed25519_github.pub | tr -d '\n'
echo ""
echo ""
echo "=========================================="
echo "Chave SSH RSA (Alternativa):"
echo "=========================================="
cat ~/.ssh/id_rsa_github.pub | tr -d '\n'
echo ""
echo ""
echo "=========================================="
echo "Instruções:"
echo "=========================================="
echo "1. Copie APENAS a linha da chave (sem espaços extras)"
echo "2. No GitHub: Settings > SSH and GPG keys > New SSH key"
echo "3. Title: 'MacBook - Deploy' (ou qualquer nome)"
echo "4. Key: Cole a chave (deve começar com 'ssh-ed25519' ou 'ssh-rsa')"
echo "5. Clique em 'Add SSH key'"
echo ""

