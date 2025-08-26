# 🚀 LMS Platform - Sistema de Gestão de Cursos Online

Uma plataforma completa de Learning Management System (LMS) desenvolvida com React, Node.js e PostgreSQL, pronta para produção.

## ✨ Funcionalidades Principais

### 👤 Usuários
- **Registro e Login** com autenticação JWT
- **Reset de senha** via email
- **Perfis de usuário** (estudante e administrador)
- **Sistema de roles** com controle de acesso

### 📚 Cursos
- **Catálogo de cursos** com categorias
- **Sistema de matrículas** automático
- **Progresso de cursos** com percentual
- **Conteúdo multimídia** (vídeos, textos, exercícios)

### 💳 Pagamentos
- **Integração com Stripe** para pagamentos
- **Webhooks** para processamento automático
- **Sistema de pedidos** completo
- **Matrículas automáticas** após pagamento

### 👨‍💼 Painel Administrativo
- **Dashboard** com métricas em tempo real
- **Gerenciamento de usuários** e cursos
- **Relatórios** e analytics
- **Sistema de certificados**

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript
- **Tailwind CSS** para estilização
- **Zustand** para gerenciamento de estado
- **React Router** para navegação
- **Lucide React** para ícones

### Backend
- **Node.js** com Express
- **PostgreSQL** com node-postgres
- **JWT** para autenticação
- **bcrypt** para hash de senhas
- **Stripe** para pagamentos

### Infraestrutura
- **Docker** para containerização
- **Neon** para banco PostgreSQL
- **Vercel/Netlify** para deploy do frontend
- **Railway/Render** para deploy do backend

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- Conta no Stripe

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/lms-platform.git
cd lms-platform
```

### 2. Instale as dependências
```bash
# Backend
npm install

# Frontend
cd src && npm install
```

### 3. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite com suas configurações
nano .env
```

### 4. Configure o banco de dados
```bash
# Execute o script de setup
psql -d seu_banco -f setup-database.sql
```

### 5. Inicie o servidor
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 🔧 Configuração para Produção

### Variáveis de Ambiente
```bash
NODE_ENV=production
DATABASE_URL=sua_url_postgresql
JWT_SECRET=seu_jwt_secret_super_seguro
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
FRONTEND_URL=https://seudominio.com
BACKEND_URL=https://api.seudominio.com
```

### Deploy
```bash
# Build do frontend
npm run build

# Deploy do backend
npm start
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais
- `users` - Usuários do sistema
- `courses` - Cursos disponíveis
- `enrollments` - Matrículas dos usuários
- `orders` - Pedidos de pagamento
- `categories` - Categorias de cursos
- `password_reset_tokens` - Tokens para reset de senha

### Relacionamentos
- Usuários podem se matricular em múltiplos cursos
- Cursos pertencem a categorias
- Pedidos geram matrículas automaticamente
- Tokens de reset expiram em 24 horas

## 🔐 Segurança

- **Senhas hasheadas** com bcrypt
- **JWT tokens** com expiração configurável
- **CORS** configurado adequadamente
- **Rate limiting** para prevenir abusos
- **Validação** de dados em todas as rotas

## 📈 Monitoramento e Logs

- **Logs estruturados** para todas as operações
- **Métricas** em tempo real no dashboard
- **Tratamento de erros** robusto
- **Auditoria** de ações administrativas

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**
   - Verifique `DATABASE_URL` no `.env`
   - Confirme se o PostgreSQL está rodando

2. **Erro de autenticação**
   - Verifique `JWT_SECRET` no `.env`
   - Confirme se o usuário existe no banco

3. **Erro de pagamento**
   - Verifique as chaves do Stripe
   - Confirme se os webhooks estão configurados

### Logs de Debug
```bash
# Ative logs detalhados
LOG_LEVEL=debug
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/lms-platform/issues)
- **Documentação**: [Wiki do projeto](https://github.com/seu-usuario/lms-platform/wiki)
- **Email**: suporte@seudominio.com

## 🎯 Roadmap

- [ ] Sistema de notificações push
- [ ] Integração com Zoom/Teams
- [ ] App mobile nativo
- [ ] Sistema de gamificação
- [ ] Analytics avançados
- [ ] Integração com outros gateways de pagamento

---

**⭐ Se este projeto te ajudou, considere dar uma estrela!**