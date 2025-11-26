#!/bin/bash

echo "🚀 Instalando @supabase/supabase-js..."
echo ""

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado!"
    echo ""
    echo "Por favor, instale o Node.js primeiro:"
    echo "1. Acesse: https://nodejs.org"
    echo "2. Baixe e instale a versão LTS"
    echo "3. Depois execute este script novamente"
    exit 1
fi

# Verificar se está na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Arquivo package.json não encontrado!"
    echo "Certifique-se de estar na pasta raiz do projeto"
    exit 1
fi

# Instalar dependência
echo "📦 Instalando @supabase/supabase-js..."
npm install @supabase/supabase-js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Instalação concluída com sucesso!"
    echo ""
    echo "Próximos passos:"
    echo "1. Configure as variáveis de ambiente no arquivo .env.local"
    echo "2. Crie o arquivo src/lib/supabase.ts"
    echo "3. Veja o guia PROXIMOS_PASSOS.md para mais detalhes"
else
    echo ""
    echo "❌ Erro na instalação. Verifique se você tem permissões ou conexão com internet."
fi

