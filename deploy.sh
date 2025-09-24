#!/bin/bash

echo "🚀 Iniciando deploy para Hostinger..."

# 1. Build do Frontend
echo "📦 Fazendo build do frontend..."
npm run build

# 2. Build do Backend
echo "📦 Fazendo build do backend..."
cd server
npm install
npm run build
cd ..

# 3. Criar arquivo de configuração para produção
echo "⚙️ Criando configuração de produção..."
cat > production-config.md << EOF
# 🚀 GUIA DE DEPLOY HOSTINGER

## 📁 ESTRUTURA DE ARQUIVOS

### Frontend (public_html/)
- Copiar TUDO da pasta 'dist/' para public_html/
- Copiar o arquivo public/.htaccess para public_html/

### Backend (subdomínio ou pasta separada)
- Copiar TUDO da pasta 'server/' para uma pasta separada
- Exemplo: public_html/api/ ou subdomínio api.seudominio.com

## 🔧 CONFIGURAÇÃO DO BACKEND

1. Acesse o terminal SSH da Hostinger
2. Navegue até a pasta do backend
3. Execute os comandos:

\`\`\`bash
# Instalar dependências
npm install --production

# Iniciar com PM2
npm run start:pm2

# Verificar se está rodando
pm2 status
pm2 logs
\`\`\`

## 🌐 CONFIGURAÇÃO DO FRONTEND

1. Atualize as URLs da API no frontend:
   - Procure por 'localhost:3333' nos arquivos
   - Substitua por 'https://seudominio.com/api' ou 'https://api.seudominio.com'

2. Configure o .htaccess para React Router funcionar

## ✅ VERIFICAÇÕES FINAIS

- [ ] Backend rodando na porta correta
- [ ] Frontend acessível
- [ ] API respondendo
- [ ] PIX funcionando
- [ ] Pixels de tracking funcionando

## 🆘 COMANDOS ÚTEIS

\`\`\`bash
# Ver logs do backend
pm2 logs

# Reiniciar backend
pm2 restart vape-backend

# Parar backend
pm2 stop vape-backend

# Ver status
pm2 status
\`\`\`
EOF

echo "✅ Deploy preparado!"
echo "📋 Consulte o arquivo 'production-config.md' para instruções completas"
echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "1. Faça upload dos arquivos para Hostinger"
echo "2. Configure o backend com PM2"
echo "3. Atualize as URLs da API no frontend"
echo "4. Teste tudo funcionando"
