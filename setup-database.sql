-- ========================================
-- 🚀 LMS Platform - Setup do Banco de Dados
-- ========================================

-- Tabela para tokens de reset de senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_created_at ON password_reset_tokens(created_at);

-- Comentários
COMMENT ON TABLE password_reset_tokens IS 'Tabela para armazenar tokens de reset de senha';
COMMENT ON COLUMN password_reset_tokens.user_id IS 'ID do usuário que solicitou o reset';
COMMENT ON COLUMN password_reset_tokens.token_hash IS 'Hash do token de reset (não armazenar o token em texto plano)';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Data e hora de expiração do token (24 horas após criação)';
COMMENT ON COLUMN password_reset_tokens.created_at IS 'Data e hora de criação do token';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Data e hora em que o token foi usado (NULL se não usado)';

-- Verificar se a tabela users tem a coluna status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'status'
    ) THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        COMMENT ON COLUMN users.status IS 'Status do usuário: active, inactive, suspended';
    END IF;
END $$;

-- Verificar se a tabela users tem a coluna last_login
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login'
    ) THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
        COMMENT ON COLUMN users.last_login IS 'Data e hora do último login do usuário';
    END IF;
END $$;

-- Verificar se a tabela users tem a coluna updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        COMMENT ON COLUMN users.updated_at IS 'Data e hora da última atualização do usuário';
    END IF;
END $$;

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger na tabela users se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at'
    ) THEN
        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Verificar se a tabela enrollments tem a coluna progress_percentage
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' AND column_name = 'progress_percentage'
    ) THEN
        ALTER TABLE enrollments ADD COLUMN progress_percentage INTEGER DEFAULT 0;
        COMMENT ON COLUMN enrollments.progress_percentage IS 'Percentual de progresso do usuário no curso (0-100)';
    END IF;
END $$;

-- Verificar se a tabela enrollments tem a coluna completed_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE enrollments ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
        COMMENT ON COLUMN enrollments.completed_at IS 'Data e hora de conclusão do curso';
    END IF;
END $$;

-- Criar índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_progress ON enrollments(progress_percentage);

-- Verificar se a tabela orders tem as colunas necessárias
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'stripe_session_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN stripe_session_id VARCHAR(255);
        COMMENT ON COLUMN orders.stripe_session_id IS 'ID da sessão do Stripe';
    END IF;
END $$;

-- Criar índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ========================================
-- ✅ VERIFICAÇÃO FINAL
-- ========================================

-- Verificar se todas as tabelas foram criadas
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'users' THEN '✅ Usuários'
        WHEN table_name = 'courses' THEN '✅ Cursos'
        WHEN table_name = 'enrollments' THEN '✅ Matrículas'
        WHEN table_name = 'orders' THEN '✅ Pedidos'
        WHEN table_name = 'order_items' THEN '✅ Itens dos Pedidos'
        WHEN table_name = 'categories' THEN '✅ Categorias'
        WHEN table_name = 'password_reset_tokens' THEN '✅ Tokens de Reset'
        ELSE '❓ ' || table_name
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'courses', 'enrollments', 'orders', 'order_items', 'categories', 'password_reset_tokens')
ORDER BY table_name;

-- Verificar colunas importantes da tabela users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('id', 'email', 'password_hash', 'name', 'role', 'status', 'last_login', 'updated_at')
ORDER BY column_name;

-- ========================================
-- 🎯 MENSAGEM FINAL
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '🚀 Banco de dados configurado com sucesso!';
    RAISE NOTICE '✅ Todas as tabelas e colunas necessárias foram criadas';
    RAISE NOTICE '✅ Índices de performance foram configurados';
    RAISE NOTICE '✅ Triggers automáticos foram configurados';
    RAISE NOTICE '🎯 Sistema pronto para uso!';
END $$;

