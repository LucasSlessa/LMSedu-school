-- Criar tabela para clientes Stripe
CREATE TABLE IF NOT EXISTS stripe_customers (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_customer_id ON stripe_customers(customer_id);

-- Verificar se a tabela orders tem as colunas necessárias
DO $$ 
BEGIN
    -- Adicionar coluna stripe_session_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'stripe_session_id') THEN
        ALTER TABLE orders ADD COLUMN stripe_session_id VARCHAR(255);
    END IF;
    
    -- Adicionar coluna payment_url se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'payment_url') THEN
        ALTER TABLE orders ADD COLUMN payment_url TEXT;
    END IF;
    
    -- Adicionar coluna expires_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'expires_at') THEN
        ALTER TABLE orders ADD COLUMN expires_at TIMESTAMP;
    END IF;
END $$;

-- Criar índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
