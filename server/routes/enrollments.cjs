const express = require('express');
const { pool, executeQuery } = require('../config/database.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

const router = express.Router();

// Listar matrículas do usuário
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Buscando matrículas para usuário:', req.user.id);
    
    const result = await executeQuery(`
      SELECT 
        e.*,
        c.title,
        c.description,
        c.short_description,
        c.duration_hours,
        c.image_url,
        c.level,
        cat.name as category_name,
        u.name as instructor_name
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE e.user_id = $1
      ORDER BY e.created_at DESC
    `, [req.user.id]);

    console.log('📚 Matrículas encontradas:', result.rows.length);
    console.log('📋 Dados das matrículas:', result.rows.map(row => ({
      id: row.id,
      courseId: row.course_id,
      courseTitle: row.title,
      status: row.status
    })));

    const enrollments = result.rows.map(row => ({
      id: row.id,
      status: row.status,
      progressPercentage: row.progress_percentage,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      certificateUrl: row.certificate_url,
      createdAt: row.created_at,
      course: {
        id: row.course_id,
        title: row.title,
        description: row.description,
        shortDescription: row.short_description,
        duration: row.duration_hours,
        image: row.image_url,
        level: row.level,
        category: row.category_name,
        instructor: row.instructor_name
      }
    }));

    res.json(enrollments);
  } catch (error) {
    console.error('❌ Erro ao buscar matrículas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter progresso de um curso específico
router.get('/:courseId/progress', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await executeQuery(
      'SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [req.user.id, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matrícula não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar progresso
router.put('/:courseId/progress', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    let { progressPercentage } = req.body;

    // Coagir para número
    progressPercentage = Number(progressPercentage);

    // Validar progresso
    if (Number.isNaN(progressPercentage) || progressPercentage < 0 || progressPercentage > 100) {
      return res.status(400).json({ error: 'Progresso deve estar entre 0 e 100' });
    }

    // Montar SET dinâmico
    const setParts = ['progress_percentage = $3'];
    const values = [req.user.id, courseId, progressPercentage];

    if (progressPercentage >= 100) {
      setParts.push(`status = $${values.length + 1}`);
      values.push('completed');
      // completed_at com NOW() diretamente (não como parâmetro)
      setParts.push('completed_at = NOW()');
    }

    const setClause = setParts.join(', ');

    const result = await executeQuery(`
      UPDATE enrollments SET ${setClause}, updated_at = NOW()
      WHERE user_id = $1 AND course_id = $2
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matrícula não encontrada' });
    }

    res.json({
      message: 'Progresso atualizado com sucesso',
      enrollment: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;