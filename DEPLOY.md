# 🚀 Guia de Deploy - LMS EduPlatform

## 📋 Pré-requisitos
- ✅ Banco PostgreSQL (Neon) já configurado
- ✅ Conta no GitHub
- ✅ Código commitado no repositório

## 🛤️ Opção 1: Railway (Recomendado)

### 1. Criar conta no Railway
1. Acesse: https://railway.app
2. Faça login com GitHub
3. Conecte seu repositório

### 2. Configurar Deploy
1. **New Project** → **Deploy from GitHub repo**
2. Selecione: `LucasSlessa/LMSedu-school`
3. Branch: `main`

### 3. Configurar Variáveis de Ambiente
No painel do Railway, vá em **Variables** e adicione:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://neondb_owner:npg_9GDSU6KLqhZP@ep-delicate-shadow-acyiyp9l-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=your_super_secret_jwt_key_production_2024
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publica_stripe
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta_stripe
DEBUG=false
```

### 4. Atualizar URLs após Deploy
Após o deploy, Railway fornecerá uma URL (ex: `https://lms-production.railway.app`).
Atualize as variáveis:

```env
VITE_APP_URL=https://sua-url.railway.app
VITE_API_URL=https://sua-url.railway.app/api
FRONTEND_URL=https://sua-url.railway.app
```

## 🔄 Opção 2: Vercel (Frontend) + Railway (Backend)

### Frontend no Vercel:
1. Acesse: https://vercel.com
2. **New Project** → Import do GitHub
3. Framework: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`

### Backend no Railway:
1. Novo projeto Railway só para backend
2. Configurar variáveis de ambiente
3. Deploy command: `npm run server`

## 🔧 Comandos Úteis

```bash
# Testar build local
npm run build

# Testar produção local
npm run build:production

# Verificar logs
railway logs

# Redeploy
git push origin main
```

## 📊 Monitoramento

### Railway Dashboard:
- CPU/RAM usage
- Logs em tempo real
- Métricas de performance
- Variáveis de ambiente

### Verificações Pós-Deploy:
- [ ] Site carrega corretamente
- [ ] Login/registro funcionando
- [ ] Criação de cursos
- [ ] Pagamentos (Stripe)
- [ ] Upload de imagens
- [ ] Banco de dados conectado

## 🆘 Troubleshooting

### Erro comum: Build falha
```bash
# Verificar se todas dependências estão no package.json
npm install
npm run build
```

### Erro: Banco não conecta
- Verificar DATABASE_URL
- Confirmar SSL settings
- Testar conexão local

### Erro: CORS
- Verificar FRONTEND_URL
- Atualizar CORS no backend

## 💰 Custos

### Railway (Gratuito):
- $5/mês de crédito gratuito
- Suficiente para ~500MB RAM
- Bandwidth ilimitado

### Vercel (Gratuito):
- 100GB bandwidth/mês
- Deploy ilimitado
- CDN global

## 🔐 Segurança

- ✅ JWT_SECRET forte em produção
- ✅ Variáveis sensíveis no .env
- ✅ HTTPS automático
- ✅ CORS configurado
- ✅ SSL no banco (Neon)
