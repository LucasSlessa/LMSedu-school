# 📋 Configuração do Arquivo .env

## 🚨 IMPORTANTE: Crie o arquivo .env na raiz do projeto

Copie o conteúdo abaixo para um arquivo chamado `.env` na raiz do projeto:

```bash
# ========================================
# 🚀 LMS Platform - Variáveis de Ambiente
# ========================================

# 🌍 Ambiente
NODE_ENV=development

# 🗄️ Banco de Dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/lms_platform

# 🔐 JWT (Autenticação)
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d

# 💳 Stripe (Pagamentos)
# DESENVOLVIMENTO
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PRODUÇÃO (descomente quando for fazer deploy)
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_PUBLISHABLE_KEY=pk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...

# 🌐 URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001

# 📧 Email (para reset de senha)
# Implementar quando for para produção
# EMAIL_SERVICE=sendgrid
# EMAIL_API_KEY=sua_api_key
# EMAIL_FROM=noreply@seudominio.com

# 📊 Logs
LOG_LEVEL=info

# 🔒 Segurança
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 📁 Uploads
UPLOAD_MAX_SIZE=10485760
UPLOAD_PATH=./uploads
```

## 🔧 Passos para Configuração

### 1. Desenvolvimento
```bash
# Copie o arquivo
cp .env.example .env

# Edite as variáveis
nano .env
```

### 2. Produção
```bash
# Mude o ambiente
NODE_ENV=production

# Use chaves live do Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Configure URLs de produção
FRONTEND_URL=https://seudominio.com
BACKEND_URL=https://api.seudominio.com
```

## 🚨 Variáveis Obrigatórias

- `DATABASE_URL` - URL do PostgreSQL
- `JWT_SECRET` - Chave secreta para JWT
- `STRIPE_SECRET_KEY` - Chave secreta do Stripe
- `STRIPE_PUBLISHABLE_KEY` - Chave pública do Stripe

## 💡 Dicas de Segurança

1. **JWT_SECRET**: Use uma string aleatória de pelo menos 32 caracteres
2. **Nunca commite o arquivo .env** no Git
3. **Use variáveis diferentes** para desenvolvimento e produção
4. **Rotacione as chaves** periodicamente em produção

