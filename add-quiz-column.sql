-- Adicionar coluna quiz_questions na tabela course_lessons
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS quiz_questions jsonb;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'course_lessons' 
AND column_name = 'quiz_questions';

-- Mostrar estrutura atual da tabela
\d course_lessons;
