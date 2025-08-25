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
        u.email as instructor_email
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.id = $1 AND c.status = 'published'
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
      updatedAt: row.updated_at
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

    // Gerar slug base
    let baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // Verificar se o slug já existe e gerar um único
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existingSlug = await executeQuery(
        'SELECT id FROM courses WHERE slug = $1',
        [slug]
      );
      
      if (existingSlug.rows.length === 0) {
        break; // Slug é único
      }
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

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

module.exports = router;