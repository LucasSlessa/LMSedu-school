-- ============================================
-- SCRIPT DE LIMPEZA DO BANCO DE DADOS
-- Mantém apenas usuários e categorias
-- Remove cursos, pagamentos, matrículas, etc.
-- ============================================

-- Desabilitar verificações de chave estrangeira temporariamente
SET foreign_key_checks = 0;

-- ============================================
-- REMOVER DADOS DE PROGRESSO E CERTIFICADOS
-- ============================================
DELETE FROM lesson_progress;
DELETE FROM certificates;

-- ============================================
-- REMOVER DADOS DE QUIZ
-- ============================================
DELETE FROM quiz_answers;
DELETE FROM quiz_questions;

-- ============================================
-- REMOVER DADOS DE AULAS E MÓDULOS
-- ============================================
DELETE FROM course_lessons;
DELETE FROM course_modules;

-- ============================================
-- REMOVER DADOS DE MATRÍCULAS
-- ============================================
DELETE FROM enrollments;

-- ============================================
-- REMOVER DADOS DE PAGAMENTOS E PEDIDOS
-- ============================================
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM stripe_customers;

-- ============================================
-- REMOVER DADOS DE CURSOS
-- ============================================
DELETE FROM courses;

-- ============================================
-- RESETAR AUTO_INCREMENT (se aplicável)
-- ============================================
-- ALTER TABLE courses AUTO_INCREMENT = 1;
-- ALTER TABLE course_modules AUTO_INCREMENT = 1;
-- ALTER TABLE course_lessons AUTO_INCREMENT = 1;
-- ALTER TABLE orders AUTO_INCREMENT = 1;
-- ALTER TABLE enrollments AUTO_INCREMENT = 1;

-- Reabilitar verificações de chave estrangeira
SET foreign_key_checks = 1;

-- ============================================
-- VERIFICAR DADOS MANTIDOS
-- ============================================
SELECT 'Usuários mantidos:' as info, COUNT(*) as total FROM users;
SELECT 'Categorias mantidas:' as info, COUNT(*) as total FROM categories;
SELECT 'Cursos removidos:' as info, COUNT(*) as total FROM courses;
SELECT 'Pedidos removidos:' as info, COUNT(*) as total FROM orders;
SELECT 'Matrículas removidas:' as info, COUNT(*) as total FROM enrollments;

-- ============================================
-- MENSAGEM DE CONFIRMAÇÃO
-- ============================================
SELECT 'Limpeza do banco de dados concluída com sucesso!' as status;
SELECT 'Mantidos: usuários e categorias' as mantidos;
SELECT 'Removidos: cursos, pagamentos, matrículas, progresso' as removidos;
