# Variáveis de Ambiente para o Render

Configure estas variáveis no Render Dashboard → Environment:

## Variáveis Obrigatórias

```
PARADISE_API_BASE=https://api.paradisepagbr.com/api/public/v1
PARADISE_API_TOKEN=P7SGw5TO8Iee797VOorUzRhkF5fTGUtGl0gITfzmAD004ISgcPHqIHYb0Imd
PARADISE_ANCHOR_PRODUCT_HASH=w7jmhixqn2
POSTBACK_URL=https://pods-p3qt.onrender.com/webhooks/paradise
PARADISE_LEAN_BODY=1
PORT=10000
NODE_ENV=production
```

## Explicação das Variáveis

- **PARADISE_API_BASE**: URL base da API do Paradise
- **PARADISE_API_TOKEN**: Token de autenticação (mesmo usado em desenvolvimento)
- **PARADISE_ANCHOR_PRODUCT_HASH**: Hash do produto base (mesmo usado em desenvolvimento)
- **POSTBACK_URL**: URL do webhook para notificações de pagamento
- **PARADISE_LEAN_BODY**: Flag para otimização do payload
- **PORT**: Porta do servidor (Render usa porta dinâmica)
- **NODE_ENV**: Ambiente de produção

## ⚠️ IMPORTANTE

- **PARADISE_ANCHOR_PRODUCT_HASH** e **PARADISE_API_TOKEN** devem ser os mesmos que funcionavam em desenvolvimento
- Se trocar essas variáveis, a Paradise não encontrará o produto/offer e retornará erro 4xx
- O **POSTBACK_URL** deve apontar para o domínio do Render, não localhost

## Como Configurar no Render

1. Acesse o Dashboard do Render
2. Vá para seu serviço backend
3. Clique em "Environment"
4. Adicione cada variável acima
5. Clique em "Save Changes"
6. Faça redeploy do serviço
