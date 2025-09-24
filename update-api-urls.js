#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuração - ALTERE AQUI SUA URL DE PRODUÇÃO
const PRODUCTION_API_URL = 'https://seudominio.com/api'; // ALTERE PARA SUA URL REAL

console.log('🔄 Atualizando URLs da API para produção...');
console.log(`📡 Nova URL: ${PRODUCTION_API_URL}`);

// Arquivos para atualizar
const filesToUpdate = [
  'src/payments/paradise.ts',
  'src/components/PaymentModal.tsx'
];

// Função para atualizar arquivo
function updateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Arquivo não encontrado: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Substituir localhost:3333 pela URL de produção
    content = content.replace(/http:\/\/localhost:3333/g, PRODUCTION_API_URL);
    content = content.replace(/localhost:3333/g, PRODUCTION_API_URL.replace('https://', ''));

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Atualizado: ${filePath}`);
    } else {
      console.log(`ℹ️  Nenhuma alteração necessária: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao atualizar ${filePath}:`, error.message);
  }
}

// Atualizar todos os arquivos
filesToUpdate.forEach(updateFile);

console.log('🎉 Atualização concluída!');
console.log('');
console.log('📋 PRÓXIMOS PASSOS:');
console.log('1. Execute: npm run build');
console.log('2. Faça upload da pasta dist/ para public_html/');
console.log('3. Configure o backend na Hostinger');
console.log('4. Teste tudo funcionando!');
