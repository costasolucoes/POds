# 🚀 GUIA COMPLETO DE DEPLOY NA HOSTINGER

## 📋 PREPARAÇÃO LOCAL

### 1. Build do Frontend
```bash
npm run build
```
Isso criará uma pasta `dist/` com todos os arquivos otimizados.

### 2. Build do Backend
```bash
cd server
npm install
npm run build
cd ..
```
Isso criará uma pasta `server/dist/` com o código compilado.

## 📁 ESTRUTURA PARA UPLOAD

### Frontend (public_html/)
```
public_html/
├── index.html
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
└── .htaccess (copiar de public/.htaccess)
```

### Backend (pasta separada ou subdomínio)
```
api/ (ou subdomínio)
├── dist/
│   └── index.js
├── package.json
├── ecosystem.config.js
└── node_modules/ (após npm install)
```

## 🔧 CONFIGURAÇÃO NA HOSTINGER

### 1. Upload dos Arquivos
- **Frontend**: Upload da pasta `dist/` para `public_html/`
- **Backend**: Upload da pasta `server/` para uma pasta separada (ex: `api/`)

### 2. Configurar Backend via SSH
```bash
# Acessar pasta do backend
cd /home/usuario/api

# Instalar dependências
npm install --production

# Iniciar com PM2
npm run start:pm2

# Verificar status
pm2 status
pm2 logs
```

### 3. Configurar Frontend
- Upload do arquivo `.htaccess` para `public_html/`
- Verificar se todas as imagens e assets estão funcionando

## 🌐 CONFIGURAÇÃO DE URLs

### Atualizar URLs da API no Frontend
Procure por `localhost:3333` nos arquivos e substitua por:
- `https://seudominio.com/api` (se backend estiver em pasta)
- `https://api.seudominio.com` (se backend estiver em subdomínio)

### Arquivos para atualizar:
- `src/payments/paradise.ts`
- `src/components/PaymentModal.tsx`
- Qualquer outro arquivo que use `localhost:3333`

## ⚙️ CONFIGURAÇÃO DO PM2

### Comandos úteis:
```bash
# Ver status
pm2 status

# Ver logs
pm2 logs

# Reiniciar
pm2 restart vape-backend

# Parar
pm2 stop vape-backend

# Iniciar
pm2 start ecosystem.config.js
```

## 🔍 VERIFICAÇÕES FINAIS

### 1. Backend
- [ ] API respondendo em `https://seudominio.com/api/health`
- [ ] Endpoint `/checkout` funcionando
- [ ] Endpoint `/tx/:id` funcionando
- [ ] PM2 rodando sem erros

### 2. Frontend
- [ ] Site carregando normalmente
- [ ] Produtos aparecendo
- [ ] Carrinho funcionando
- [ ] PIX funcionando
- [ ] Página `/obrigado` funcionando

### 3. Integração
- [ ] Frontend conseguindo conectar com backend
- [ ] PIX gerando QR code
- [ ] Redirecionamento para `/obrigado` funcionando
- [ ] Pixels de tracking funcionando

## 🆘 SOLUÇÃO DE PROBLEMAS

### Backend não inicia:
```bash
# Verificar logs
pm2 logs

# Verificar se porta está livre
netstat -tulpn | grep 3333

# Reiniciar PM2
pm2 restart vape-backend
```

### Frontend não carrega:
- Verificar se `.htaccess` está na raiz
- Verificar se todos os assets foram uploadados
- Verificar console do navegador para erros

### API não conecta:
- Verificar URLs no frontend
- Verificar se backend está rodando
- Verificar CORS no backend

## 📞 SUPORTE

Se precisar de ajuda:
1. Verificar logs do PM2: `pm2 logs`
2. Verificar console do navegador
3. Testar endpoints da API diretamente
4. Verificar configuração de DNS/subdomínios

## 🎯 CHECKLIST FINAL

- [ ] Frontend buildado e uploadado
- [ ] Backend buildado e uploadado
- [ ] PM2 configurado e rodando
- [ ] URLs atualizadas no frontend
- [ ] .htaccess configurado
- [ ] Teste completo de compra
- [ ] PIX funcionando
- [ ] Redirecionamento funcionando
- [ ] Pixels de tracking funcionando

**🎉 Se tudo estiver funcionando, seu site está no ar!**
