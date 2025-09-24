#!/bin/bash
# Script para executar npm run dev em qualquer projeto
# Uso: ./dev.sh

# Configurar PATH
export PATH="/usr/local/bin:$PATH"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado!"
    echo "Execute este script no diretório do projeto."
    exit 1
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Executar servidor de desenvolvimento
echo "🚀 Iniciando servidor de desenvolvimento..."
npm run dev
