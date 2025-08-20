# 🎓 EduPlatform - Sistema Completo de Ensino Online

Uma plataforma moderna e completa para ensino online com PostgreSQL (Neon), Stripe para pagamentos e sistema completo de carrinho de compras.

## ✨ Funcionalidades Principais

### 👨‍🎓 Para Alunos
- **Catálogo de Cursos** com filtros avançados
- **Sistema de Pagamento** integrado com Stripe
- **Player de Vídeo** com controle de progresso
- **Questionários** com sistema de aprovação (70% mínimo)
- **Certificados PDF** automáticos (100% conclusão)
- **Carrinho de Compras** com múltiplos itens
- **Dashboard Pessoal** com progresso detalhado

### 👨‍💼 Para Administradores
- **Gestão Completa de Cursos** (CRUD)
- **Sistema de Categorias** personalizável
- **Upload de Arquivos** (vídeos, PDFs, imagens)
- **Construtor de Questionários** avançado
- **Relatórios e Analytics** detalhados
- **Gestão de Alunos** e matrículas
- **Dashboard Administrativo** completo

### 💳 Sistema de Pagamentos
- **Stripe** como gateway principal
- **Confirmação por Email** automática
- **Links de Acesso** seguros
- **Webhooks** para confirmação
- **Ambiente de Teste** integrado

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** + TypeScript
- **Tailwind CSS** para estilização
- **Zustand** para gerenciamento de estado
- **React Router** para navegação
- **Lucide React** para ícones
- **jsPDF** para geração de certificados

### Backend
- **PostgreSQL (Neon)** como banco de dados
- **Node.js + Express** como servidor backend
- **JWT** para autenticação
- **bcryptjs** para hash de senhas
- **Stripe** para processamento de pagamentos

### Integrações
- **Stripe** para pagamentos
- **Neon PostgreSQL** para banco de dados
- **Webhooks** para confirmação de pagamentos

## 🚀 Instalação e Configuração

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/eduplatform.git
cd eduplatform
```

### 2. Instale as Dependências
```bash
npm install
```

### 3. Configure o Banco de Dados (Neon)

#### 3.1. Acesse o Neon
O banco já está configurado no Neon com a connection string fornecida.

#### 3.2. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas configurações
nano .env
```

Configure as seguintes variáveis principais no arquivo `.env`:
```env
DATABASE_URL=postgresql://neondb_owner:npg_9GDSU6KLqhZP@ep-delicate-shadow-acyiyp9l-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=sua_chave_jwt_super_secreta_aqui
VITE_API_URL=http://localhost:3001/api
STRIPE_SECRET_KEY=sk_test_sua_chave_stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_stripe
```

#### 3.3. Aplique o schema do banco
```bash
# Execute o script SQL no Neon (use o psql ou interface web do Neon)
psql 'postgresql://neondb_owner:npg_9GDSU6KLqhZP@ep-delicate-shadow-acyiyp9l-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -f server/database/schema.sql
```

### 4. Inicie o Servidor Backend
```bash
# Em um terminal, inicie o servidor backend
npm run server:dev
```

### 5. Inicie o Frontend
```bash
# Em outro terminal, inicie o frontend
npm run dev
```

### 6. Acesse a Aplicação
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api

### 7. Contas de Demonstração
As contas de demonstração já estão no banco:

- **Admin**: admin@lms.com / 123456
- **Aluno**: aluno@lms.com / 123456

## 📊 Estrutura do Banco de Dados

### Principais Tabelas
- **users** - Usuários do sistema
- **categories** - Categorias de cursos
- **courses** - Cursos disponíveis
- **course_modules** - Módulos dos cursos
- **course_lessons** - Aulas individuais
- **cart_items** - Itens do carrinho de compras
- **orders** - Pedidos de compra
- **order_items** - Itens dos pedidos
- **enrollments** - Matrículas dos alunos
- **certificates** - Certificados emitidos
- **stripe_customers** - Clientes no Stripe
- **quiz_questions** - Perguntas dos questionários
- **quiz_attempts** - Tentativas de questionários
- **lesson_progress** - Progresso das aulas

### Relacionamentos
- Usuários podem ter itens no carrinho
- Carrinho gera pedidos de compra
- Pedidos geram matrículas
- Usuários podem ter múltiplas matrículas
- Cursos possuem múltiplos módulos
- Módulos contêm múltiplas aulas
- Matrículas podem gerar certificados

### Segurança
- **Autenticação JWT** para proteção de rotas
- **Hash bcrypt** para senhas
- **Middleware de autorização** baseado em roles
- **Validação de dados** no backend
- **Stripe Webhooks** para confirmação segura

## 🔧 Configuração de Pagamentos

### Stripe
1. Crie uma conta no [Stripe](https://stripe.com)
2. Obtenha suas chaves de API
3. Configure no arquivo `.env`:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (para produção)
```

## 🎯 Fluxo de Compra

1. **Aluno** navega pelo catálogo
2. **Adiciona** cursos ao carrinho
3. **Finaliza** a compra no carrinho
4. **Sistema** cria sessão de checkout no Stripe
5. **Redireciona** para página de pagamento do Stripe
6. **Stripe** processa o pagamento
7. **Webhook** confirma e matricula o aluno automaticamente
8. **Aluno** recebe acesso imediato aos cursos

## 📋 Funcionalidades Detalhadas

### Sistema de Questionários
- **Múltiplos tipos**: Múltipla escolha, V/F, resposta curta
- **Pontuação mínima**: 70% para aprovação
- **Tentativas ilimitadas** até aprovação
- **Feedback imediato** com explicações
- **Bloqueio de progresso** até aprovação

### Certificados Automáticos
- **Geração em PDF** com design profissional
- **Dados personalizados** (nome, curso, data)
- **Código de verificação** único
- **Download disponível** apenas com 100% conclusão
- **Armazenamento seguro** no sistema

### Dashboard Administrativo
- **Métricas em tempo real**
- **Gráficos de performance**
- **Gestão de usuários**
- **Relatórios financeiros**
- **Logs de atividade**

## 🔒 Segurança

### Autenticação
- **JWT tokens** para autenticação
- **bcrypt** para hash de senhas
- **Middleware de autorização** baseado em roles
- **Validação de dados** em todas as camadas

### Pagamentos
- **Dados criptografados** em trânsito
- **Webhooks assinados** para verificação
- **Logs de transação** detalhados
- **Conformidade PCI** através dos gateways

### Dados
- **Validação rigorosa** de entrada
- **Sanitização** de dados
- **Validação de entrada** no frontend e backend
- **CORS configurado** adequadamente

## 📱 Responsividade

- **Design Mobile-First**
- **Breakpoints otimizados**
- **Touch-friendly** em dispositivos móveis
- **Performance otimizada** para todas as telas

## 🧪 Ambiente de Teste

### Dados de Teste
Contas já disponíveis no banco:
- **Admin**: admin@lms.com / 123456  
- **Aluno**: aluno@lms.com / 123456

### Pagamentos com Stripe
- Use cartões de teste do Stripe
- **Sucesso**: 4242 4242 4242 4242
- **Falha**: 4000 0000 0000 0002
- CVV: qualquer 3 dígitos
- Data: qualquer data futura

## 🔧 Comandos Úteis

### Desenvolvimento
```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Iniciar servidor backend
npm run server:dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Linting
npm run lint
```

### Neon PostgreSQL
```bash
# Conectar ao banco Neon
psql 'postgresql://neondb_owner:npg_9GDSU6KLqhZP@ep-delicate-shadow-acyiyp9l-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

# Executar schema
psql 'postgresql://neondb_owner:npg_9GDSU6KLqhZP@ep-delicate-shadow-acyiyp9l-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -f server/database/schema.sql

# Backup do banco
pg_dump 'postgresql://neondb_owner:npg_9GDSU6KLqhZP@ep-delicate-shadow-acyiyp9l-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' > backup.sql
```

## 📈 Próximas Funcionalidades

- [ ] **Chat em tempo real** entre alunos e instrutores
- [ ] **Gamificação** com pontos e badges
- [ ] **Trilhas de aprendizado** personalizadas
- [ ] **App mobile** nativo
- [ ] **Marketplace** para instrutores externos
- [ ] **Assinatura mensal** para acesso ilimitado
- [ ] **Inteligência artificial** para recomendações

## 🐛 Solução de Problemas

### Erro: "relation does not exist"
1. Verifique se o Neon está acessível
2. Execute o schema: Use o comando psql com a connection string do Neon
3. Confirme que todas as tabelas foram criadas

### Erro de conexão com banco
1. Verifique se a connection string do Neon está correta
2. Confirme as credenciais no arquivo `.env`
3. Teste a conexão com o Neon

### Servidor backend não inicia
1. Verifique se todas as dependências foram instaladas: `npm install`
2. Confirme as variáveis de ambiente no `.env`
3. Verifique se a porta 3001 não está em uso

### Erro no Stripe
1. Verifique se as chaves do Stripe estão corretas no `.env`
2. Confirme se está usando chaves de teste (começam com `sk_test_` e `pk_test_`)
3. Verifique se o webhook está configurado corretamente

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **Email**: suporte@eduplatform.com
- **WhatsApp**: (11) 99999-9999

## 🙏 Agradecimentos

- **React Team** pelo framework incrível
- **Tailwind CSS** pela facilidade de estilização
- **Neon** pela hospedagem PostgreSQL
- **Stripe** pelo gateway de pagamento
- **Comunidade Open Source** pelas bibliotecas utilizadas

---

**Desenvolvido com ❤️ para democratizar a educação online**