const express = require('express');
const { pool, executeQuery } = require('../config/database.cjs');
const { authenticateToken, requireRole } = require('../middleware/auth.cjs');

const router = express.Router();

// Listar categorias ativas
router.get('/', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT id, name, description, color, slug
      FROM categories 
      WHERE is_active = true 
      ORDER BY sort_order ASC, name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar categoria (apenas admin)
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, description, color, sortOrder } = req.body;

    // Gerar slug base
    let baseSlug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // Verificar se o slug já existe e gerar um único
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existingSlug = await executeQuery(
        'SELECT id FROM categories WHERE slug = $1',
        [slug]
      );
      
      if (existingSlug.rows.length === 0) {
        break; // Slug é único
      }
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const result = await executeQuery(`
      INSERT INTO categories (name, description, color, slug, sort_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, description, color, slug, sortOrder || 0]);

    res.status(201).json({
      message: 'Categoria criada com sucesso',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Já existe uma categoria com este nome' });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

// Atualizar categoria (apenas admin)
router.put('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, sortOrder, isActive } = req.body;

    const result = await executeQuery(`
      UPDATE categories SET
        name = $1, description = $2, color = $3, sort_order = $4,
        is_active = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [name, description, color, sortOrder || 0, isActive !== undefined ? isActive : true, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    res.json({
      message: 'Categoria atualizada com sucesso',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar categoria (apenas admin)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se há cursos usando esta categoria
    const coursesCheck = await executeQuery(
      'SELECT COUNT(*) as count FROM courses WHERE category_id = $1',
      [id]
    );

    if (parseInt(coursesCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar categoria que possui cursos associados' 
      });
    }

    const result = await executeQuery(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    res.json({ message: 'Categoria deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;