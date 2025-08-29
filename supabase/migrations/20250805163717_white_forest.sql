-- ============================================
-- EDUPLATFORM - SCHEMA POSTGRESQL (NEON)
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABELA: USUÁRIOS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) UNIQUE NOT NULL,
  password_hash varchar(255) NOT NULL,
  name varchar(255) NOT NULL,
  role varchar(50) DEFAULT 'student' CHECK (role IN ('student', 'admin', 'instructor')),
  avatar_url text,
  email_verified boolean DEFAULT false,
  status varchar(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABELA: CATEGORIAS
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL UNIQUE,
  description text,
  color varchar(7) DEFAULT '#3B82F6',
  slug varchar(255) UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABELA: CURSOS
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(500) NOT NULL,
  slug varchar(500) UNIQUE NOT NULL,
  description text NOT NULL,
  short_description varchar(500) NOT NULL,
  price decimal(10,2) DEFAULT 0,
  duration_hours integer DEFAULT 0,
  instructor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  image_url text,
  level varchar(50) DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  status varchar(50) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  rating decimal(3,2) DEFAULT 0,
  students_count integer DEFAULT 0,
  requirements text,
  what_you_learn text,
  target_audience text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABELA: MÓDULOS DO CURSO
-- ============================================
CREATE TABLE IF NOT EXISTS course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title varchar(500) NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABELA: AULAS DO CURSO
-- ============================================
CREATE TABLE IF NOT EXISTS course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES course_modules(id) ON DELETE CASCADE,
  title varchar(500) NOT NULL,
  description text,
  content_type varchar(50) DEFAULT 'video' CHECK (content_type IN ('video', 'text', 'quiz', 'file', 'pdf', 'pptx')),
  content_url text,
  quiz_questions jsonb,
  duration_minutes integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  is_free boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABELA: CARRINHO DE COMPRAS
-- ============================================
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- ============================================
-- TABELA: PEDIDOS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  total_amount decimal(10,2) NOT NULL,
  currency varchar(3) DEFAULT 'BRL',
  status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
  payment_method varchar(50) DEFAULT 'stripe',
  payment_intent_id varchar(255),
  stripe_session_id varchar(255),
  payment_url text,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABELA: ITENS DO PEDIDO
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  price decimal(10,2) NOT NULL,
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- TABELA: MATRÍCULAS
-- ============================================
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  status varchar(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended', 'cancelled')),
  progress_percentage integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  certificate_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- ============================================
-- TABELA: PROGRESSO DAS AULAS
-- ============================================
CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES course_lessons(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  status varchar(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- ============================================
-- TABELA: PERGUNTAS DE QUIZ
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES course_lessons(id) ON DELETE CASCADE,
  question text NOT NULL,
  question_type varchar(50) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
  options jsonb,
  correct_answer text NOT NULL,
  explanation text,
  points integer DEFAULT 1,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABELA: TENTATIVAS DE QUIZ
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES course_lessons(id) ON DELETE CASCADE,
  answers jsonb NOT NULL,
  score integer NOT NULL,
  max_score integer NOT NULL,
  percentage decimal(5,2) NOT NULL,
  passed boolean NOT NULL,
  attempt_number integer DEFAULT 1,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- TABELA: CERTIFICADOS
-- ============================================
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  certificate_number varchar(255) UNIQUE NOT NULL,
  student_name varchar(255) NOT NULL,
  course_title varchar(500) NOT NULL,
  completion_date timestamptz NOT NULL,
  certificate_url text,
  verification_code varchar(255) UNIQUE NOT NULL,
  is_valid boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABELA: CLIENTES STRIPE
-- ============================================
CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  customer_id varchar(255) NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module ON course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user ON stripe_customers(user_id);

-- ============================================
-- INSERIR CATEGORIAS PADRÃO
-- ============================================
INSERT INTO categories (name, description, color, slug, sort_order) VALUES
  ('Programação', 'Cursos de desenvolvimento de software e programação', '#3B82F6', 'programacao', 1),
  ('Design', 'Cursos de design gráfico, UI/UX e criatividade', '#8B5CF6', 'design', 2),
  ('Marketing', 'Cursos de marketing digital e estratégias de vendas', '#EF4444', 'marketing', 3),
  ('Negócios', 'Cursos de empreendedorismo e gestão empresarial', '#10B981', 'negocios', 4),
  ('Idiomas', 'Cursos de idiomas e comunicação', '#F59E0B', 'idiomas', 5),
  ('Saúde', 'Cursos de saúde, bem-estar e qualidade de vida', '#06B6D4', 'saude', 6)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- INSERIR USUÁRIOS DE DEMONSTRAÇÃO
-- ============================================
-- Senha: 123456 (hash bcrypt)
INSERT INTO users (id, email, password_hash, name, role, email_verified, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@lms.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.O', 'Administrador', 'admin', true, 'active'),
  ('00000000-0000-0000-0000-000000000002', 'aluno@lms.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.O', 'Aluno Demonstração', 'student', true, 'active')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- INSERIR CURSOS DE EXEMPLO
-- ============================================
INSERT INTO courses (
  id, title, slug, description, short_description, price, duration_hours, 
  instructor_id, category_id, image_url, level, status, rating, students_count
) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'Curso Teste - Marketing',
    'curso-teste-marketing',
    'Aprenda as estratégias mais eficazes de marketing digital para impulsionar seu negócio. Este curso abrange desde conceitos básicos até técnicas avançadas de conversão e análise de dados.',
    'Domine o marketing digital com estratégias práticas e comprovadas',
    10.00,
    8,
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM categories WHERE slug = 'marketing' LIMIT 1),
    'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800',
    'beginner',
    'published',
    4.8,
    1247
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'React do Zero ao Avançado',
    'react-zero-avancado',
    'Curso completo de React.js com projetos práticos. Aprenda desde os conceitos básicos até técnicas avançadas como hooks, context API, Redux e muito mais.',
    'Domine React.js com projetos práticos e reais',
    199.90,
    40,
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM categories WHERE slug = 'programacao' LIMIT 1),
    'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800',
    'intermediate',
    'published',
    4.9,
    2156
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'UI/UX Design Completo',
    'ui-ux-design-completo',
    'Aprenda a criar interfaces incríveis e experiências de usuário memoráveis. Curso prático com ferramentas como Figma, Adobe XD e princípios de design.',
    'Crie interfaces incríveis e experiências memoráveis',
    149.90,
    25,
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM categories WHERE slug = 'design' LIMIT 1),
    'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800',
    'beginner',
    'published',
    4.7,
    987
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'Python para Data Science',
    'python-data-science',
    'Mergulhe no mundo da ciência de dados com Python. Aprenda pandas, numpy, matplotlib, machine learning e muito mais com projetos reais.',
    'Domine Python para análise de dados e machine learning',
    299.90,
    60,
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM categories WHERE slug = 'programacao' LIMIT 1),
    'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
    'advanced',
    'published',
    4.9,
    1543
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    'Inglês para Negócios',
    'ingles-negocios',
    'Desenvolva suas habilidades em inglês focado no ambiente corporativo. Aprenda vocabulário específico, apresentações e comunicação profissional.',
    'Inglês profissional para o ambiente corporativo',
    89.90,
    20,
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM categories WHERE slug = 'idiomas' LIMIT 1),
    'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800',
    'intermediate',
    'published',
    4.6,
    756
  ),
  (
    '10000000-0000-0000-0000-000000000006',
    'Empreendedorismo Digital',
    'empreendedorismo-digital',
    'Aprenda a criar e escalar seu negócio digital. Desde a validação da ideia até estratégias de crescimento e monetização online.',
    'Crie e escale seu negócio digital do zero',
    179.90,
    35,
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM categories WHERE slug = 'negocios' LIMIT 1),
    'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
    'beginner',
    'published',
    4.8,
    1098
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- INSERIR MÓDULOS DE EXEMPLO
-- ============================================
INSERT INTO course_modules (id, course_id, title, description, sort_order) VALUES
  -- Módulos do Curso de Marketing
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Introdução ao Marketing Digital', 'Conceitos fundamentais e panorama atual', 1),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Estratégias de Conteúdo', 'Como criar conteúdo que converte', 2),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Métricas e Analytics', 'Medindo o sucesso das suas campanhas', 3),
  
  -- Módulos do Curso de React
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Fundamentos do React', 'JSX, componentes e props', 1),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'Hooks e Estado', 'useState, useEffect e hooks customizados', 2),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'Projeto Prático', 'Construindo uma aplicação completa', 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INSERIR AULAS DE EXEMPLO
-- ============================================
INSERT INTO course_lessons (id, module_id, title, description, content_type, content_url, duration_minutes, sort_order) VALUES
  -- Aulas do módulo de Introdução ao Marketing
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'O que é Marketing Digital?', 'Definições e conceitos básicos', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 15, 1),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Panorama do Mercado', 'Situação atual e tendências', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 20, 2),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Quiz: Conceitos Básicos', 'Teste seus conhecimentos', 'quiz', '', 0, 3),
  
  -- Aulas do módulo de Estratégias de Conteúdo
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'Criando Personas', 'Como definir seu público-alvo', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 25, 1),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', 'Calendário Editorial', 'Planejando seu conteúdo', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 30, 2),
  
  -- Aulas do módulo de React Fundamentos
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000004', 'Introdução ao React', 'O que é React e por que usar', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 20, 1),
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000004', 'JSX e Componentes', 'Criando seus primeiros componentes', 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 35, 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INSERIR PERGUNTAS DE QUIZ
-- ============================================
INSERT INTO quiz_questions (id, lesson_id, question, question_type, options, correct_answer, explanation, points, sort_order) VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000003',
    'O que é Marketing Digital?',
    'multiple_choice',
    '["Apenas vendas online", "Estratégias de marketing usando canais digitais", "Somente redes sociais", "Publicidade tradicional"]',
    '1',
    'Marketing Digital engloba todas as estratégias de marketing que utilizam canais digitais para alcançar e engajar o público-alvo.',
    1,
    1
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000003',
    'Qual é a principal vantagem do marketing digital sobre o tradicional?',
    'multiple_choice',
    '["Menor custo", "Maior alcance", "Melhor segmentação e mensuração", "Mais criatividade"]',
    '2',
    'A principal vantagem é a capacidade de segmentar precisamente o público e medir resultados em tempo real.',
    1,
    2
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_modules_updated_at BEFORE UPDATE ON course_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON course_lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_customers_updated_at BEFORE UPDATE ON stripe_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNÇÃO PARA ATUALIZAR ESTATÍSTICAS DO CURSO
-- ============================================
CREATE OR REPLACE FUNCTION update_course_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE courses 
    SET 
      students_count = (
        SELECT COUNT(*) FROM enrollments 
        WHERE course_id = NEW.course_id AND status = 'active'
      ),
      updated_at = now()
    WHERE id = NEW.course_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE courses 
    SET 
      students_count = (
        SELECT COUNT(*) FROM enrollments 
        WHERE course_id = OLD.course_id AND status = 'active'
      ),
      updated_at = now()
    WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estatísticas do curso
DROP TRIGGER IF EXISTS trigger_update_course_stats ON enrollments;
CREATE TRIGGER trigger_update_course_stats
  AFTER INSERT OR UPDATE OR DELETE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_course_stats();

-- ============================================
-- VIEWS PARA RELATÓRIOS
-- ============================================

-- View para estatísticas de cursos
CREATE OR REPLACE VIEW course_stats AS
SELECT 
  c.id,
  c.title,
  c.price,
  c.students_count,
  c.rating,
  COUNT(e.id) as total_enrollments,
  COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed_enrollments,
  COALESCE(AVG(e.progress_percentage), 0) as avg_progress,
  COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
LEFT JOIN order_items oi ON oi.course_id = c.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.status = 'completed'
GROUP BY c.id, c.title, c.price, c.students_count, c.rating;

-- View para dashboard do aluno
CREATE OR REPLACE VIEW student_dashboard AS
SELECT 
  u.id as user_id,
  u.name as student_name,
  COUNT(e.id) as total_courses,
  COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed_courses,
  COUNT(cert.id) as certificates_earned,
  COALESCE(AVG(e.progress_percentage), 0) as avg_progress,
  COALESCE(SUM(oi.price * oi.quantity), 0) as total_spent
FROM users u
LEFT JOIN enrollments e ON e.user_id = u.id
LEFT JOIN certificates cert ON cert.user_id = u.id
LEFT JOIN order_items oi ON oi.course_id = e.course_id
LEFT JOIN orders o ON o.id = oi.order_id AND o.status = 'completed'
WHERE u.role = 'student'
GROUP BY u.id, u.name;

-- ============================================
-- COMENTÁRIOS FINAIS
-- ============================================

-- Schema criado com sucesso!
-- Próximos passos:
-- 1. Configure as variáveis de ambiente no arquivo .env
-- 2. Execute: npm run server:dev (para iniciar o backend)
-- 3. Execute: npm run dev (para iniciar o frontend)
-- 4. Acesse: http://localhost:5173
-- 5. Use as contas demo: admin@lms.com ou aluno@lms.com (senha: 123456)