const express = require('express');
const { pool, executeQuery } = require('../config/database.cjs');
const { authenticateToken, requireRole } = require('../middleware/auth.cjs');

const router = express.Router();

// Listar cursos públicos
router.get('/', async (req, res) => {
  try {
    const { category, level, search, sort = 'created_at', order = 'DESC' } = req.query;
    
    let query = `
      SELECT 
        c.*,
        cat.name as category_name,
        cat.color as category_color,
        u.name as instructor_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.status = 'published'
    `;
    
    const params = [];
    let paramCount = 0;

    if (category && category !== 'Todas') {
      paramCount++;
      query += ` AND cat.name = $${paramCount}`;
      params.push(category);
    }

    if (level) {
      paramCount++;
      query += ` AND c.level = $${paramCount}`;
      params.push(level);
    }

    if (search) {
      paramCount++;
      query += ` AND (c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Validar ordenação
    const validSorts = ['created_at', 'title', 'price', 'rating', 'students_count'];
    const validOrders = ['ASC', 'DESC'];
    
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';
    
    query += ` ORDER BY c.${sortField} ${sortOrder}`;

    const result = await executeQuery(query, params);
    
    const courses = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      shortDescription: row.short_description,
      price: parseFloat(row.price),
      duration: row.duration_hours,
      instructor: row.instructor_name,
      category: row.category_name,
      categoryColor: row.category_color,
      image: row.image_url,
      level: row.level,
      rating: parseFloat(row.rating),
      studentsCount: row.students_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json(courses);
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter curso por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await executeQuery(`
      SELECT
        c.*,
        cat.name as category_name,
        cat.color as category_color,
        u.name as instructor_name,
        u.email as instructor_email,
        COALESCE(
          json_agg(
            json_build_object(
              'id', m.id,
              'title', m.title,
              'description', m.description,
              'sortOrder', m.sort_order,
              'lessons', COALESCE(m.lessons, '[]'::json)
            ) ORDER BY m.sort_order
          ) FILTER (WHERE m.id IS NOT NULL), '[]'::json
        ) AS modules
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN (
        SELECT
          cm.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', cl.id,
                'title', cl.title,
                'description', cl.description,
                'contentType', cl.content_type,
                'contentUrl', cl.content_url,
                'durationMinutes', cl.duration_minutes,
                'sortOrder', cl.sort_order,
                'isFree', cl.is_free
              ) ORDER BY cl.sort_order
            ) FILTER (WHERE cl.id IS NOT NULL), '[]'::json
          ) AS lessons
        FROM course_modules cm
        LEFT JOIN course_lessons cl ON cl.module_id = cm.id
        GROUP BY cm.id
      ) m ON m.course_id = c.id
      WHERE c.id = $1 AND c.status = 'published'
      GROUP BY c.id, cat.name, cat.color, u.name, u.email
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    const row = result.rows[0];
    const course = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      shortDescription: row.short_description,
      price: parseFloat(row.price),
      duration: row.duration_hours,
      instructor: row.instructor_name,
      instructorEmail: row.instructor_email,
      category: row.category_name,
      categoryColor: row.category_color,
      image: row.image_url,
      level: row.level,
      rating: parseFloat(row.rating),
      studentsCount: row.students_count,
      requirements: row.requirements,
      whatYouLearn: row.what_you_learn,
      targetAudience: row.target_audience,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      modules: row.modules || []
    };

    res.json(course);
  } catch (error) {
    console.error('Erro ao buscar curso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar curso (apenas admin/instructor)
router.post('/', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const {
      title,
      description,
      shortDescription,
      price,
      durationHours,
      categoryId,
      imageUrl,
      level,
      requirements,
      whatYouLearn,
      targetAudience
    } = req.body;

    // Gerar slug
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const result = await executeQuery(`
      INSERT INTO courses (
        title, slug, description, short_description, price, duration_hours,
        instructor_id, category_id, image_url, level, requirements,
        what_you_learn, target_audience, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      title, slug, description, shortDescription, price, durationHours,
      req.user.id, categoryId, imageUrl, level, requirements,
      whatYouLearn, targetAudience, 'draft'
    ]);

    res.status(201).json({
      message: 'Curso criado com sucesso',
      course: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar curso:', error);
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Já existe um curso com este título' });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

// Atualizar curso
router.put('/:id', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      shortDescription,
      price,
      durationHours,
      categoryId,
      imageUrl,
      level,
      status,
      requirements,
      whatYouLearn,
      targetAudience
    } = req.body;

    // Verificar se o usuário pode editar este curso
    const courseCheck = await executeQuery(
      'SELECT instructor_id FROM courses WHERE id = $1',
      [id]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    if (req.user.role !== 'admin' && courseCheck.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar este curso' });
    }

    const result = await executeQuery(`
      UPDATE courses SET
        title = $1, description = $2, short_description = $3, price = $4,
        duration_hours = $5, category_id = $6, image_url = $7, level = $8,
        status = $9, requirements = $10, what_you_learn = $11,
        target_audience = $12, updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `, [
      title, description, shortDescription, price, durationHours,
      categoryId, imageUrl, level, status, requirements,
      whatYouLearn, targetAudience, id
    ]);

    res.json({
      message: 'Curso atualizado com sucesso',
      course: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar curso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar curso
router.delete('/:id', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o usuário pode deletar este curso
    const courseCheck = await executeQuery(
      'SELECT instructor_id FROM courses WHERE id = $1',
      [id]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    if (req.user.role !== 'admin' && courseCheck.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para deletar este curso' });
    }

    await executeQuery('DELETE FROM courses WHERE id = $1', [id]);

    res.json({ message: 'Curso deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar curso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar módulo
router.post('/:id/modules', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, sortOrder } = req.body;

    const courseCheck = await executeQuery(
      'SELECT instructor_id FROM courses WHERE id = $1',
      [id]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    if (req.user.role !== 'admin' && courseCheck.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para adicionar módulos neste curso' });
    }

    const result = await executeQuery(
      `INSERT INTO course_modules (course_id, title, description, sort_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, title, description, sortOrder || 0]
    );

    res.status(201).json({ message: 'Módulo criado com sucesso', module: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar módulo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar módulo
router.put('/modules/:id', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, sortOrder } = req.body;

    const moduleCheck = await executeQuery(
      `SELECT c.instructor_id FROM course_modules m
       JOIN courses c ON m.course_id = c.id
       WHERE m.id = $1`,
      [id]
    );

    if (moduleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Módulo não encontrado' });
    }

    if (req.user.role !== 'admin' && moduleCheck.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar este módulo' });
    }

    const result = await executeQuery(
      `UPDATE course_modules SET title = $1, description = $2, sort_order = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [title, description, sortOrder, id]
    );

    res.json({ message: 'Módulo atualizado com sucesso', module: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar módulo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar módulo
router.delete('/modules/:id', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const { id } = req.params;

    const moduleCheck = await executeQuery(
      `SELECT c.instructor_id FROM course_modules m
       JOIN courses c ON m.course_id = c.id
       WHERE m.id = $1`,
      [id]
    );

    if (moduleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Módulo não encontrado' });
    }

    if (req.user.role !== 'admin' && moduleCheck.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para deletar este módulo' });
    }

    await executeQuery('DELETE FROM course_modules WHERE id = $1', [id]);

    res.json({ message: 'Módulo deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar módulo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar aula
router.post('/modules/:moduleId/lessons', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { title, description, contentType, contentUrl, durationMinutes, sortOrder, isFree } = req.body;

    const moduleCheck = await executeQuery(
      `SELECT c.instructor_id FROM course_modules m
       JOIN courses c ON m.course_id = c.id
       WHERE m.id = $1`,
      [moduleId]
    );

    if (moduleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Módulo não encontrado' });
    }

    if (req.user.role !== 'admin' && moduleCheck.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para adicionar aulas neste módulo' });
    }

    const result = await executeQuery(
      `INSERT INTO course_lessons (module_id, title, description, content_type, content_url, duration_minutes, sort_order, is_free)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [moduleId, title, description, contentType, contentUrl, durationMinutes || 0, sortOrder || 0, isFree || false]
    );

    res.status(201).json({ message: 'Aula criada com sucesso', lesson: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar aula:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar aula
router.put('/lessons/:id', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, contentType, contentUrl, durationMinutes, sortOrder, isFree } = req.body;

    const lessonCheck = await executeQuery(
      `SELECT c.instructor_id FROM course_lessons l
       JOIN course_modules m ON l.module_id = m.id
       JOIN courses c ON m.course_id = c.id
       WHERE l.id = $1`,
      [id]
    );

    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Aula não encontrada' });
    }

    if (req.user.role !== 'admin' && lessonCheck.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar esta aula' });
    }

    const result = await executeQuery(
      `UPDATE course_lessons SET
         title = $1, description = $2, content_type = $3, content_url = $4,
         duration_minutes = $5, sort_order = $6, is_free = $7, updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [title, description, contentType, contentUrl, durationMinutes, sortOrder, isFree, id]
    );

    res.json({ message: 'Aula atualizada com sucesso', lesson: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar aula:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar aula
router.delete('/lessons/:id', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const { id } = req.params;

    const lessonCheck = await executeQuery(
      `SELECT c.instructor_id FROM course_lessons l
       JOIN course_modules m ON l.module_id = m.id
       JOIN courses c ON m.course_id = c.id
       WHERE l.id = $1`,
      [id]
    );

    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Aula não encontrada' });
    }

    if (req.user.role !== 'admin' && lessonCheck.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para deletar esta aula' });
    }

    await executeQuery('DELETE FROM course_lessons WHERE id = $1', [id]);

    res.json({ message: 'Aula deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar aula:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;