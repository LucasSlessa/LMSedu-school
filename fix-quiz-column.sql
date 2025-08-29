-- Verificar se a coluna quiz_questions existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'course_lessons' AND column_name = 'quiz_questions';

-- Se não existir, adicionar a coluna
-- ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS quiz_questions JSONB;

-- Verificar dados existentes
SELECT id, title, content_type, quiz_questions IS NOT NULL as has_quiz_data
FROM course_lessons 
WHERE content_type = 'quiz'
LIMIT 5;

-- Verificar estrutura completa da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'course_lessons'
ORDER BY ordinal_position;
