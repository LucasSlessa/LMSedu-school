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
