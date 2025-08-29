const express = require('express');
const { pool, executeQuery } = require('../config/database.cjs');
const { authenticateToken, requireRole } = require('../middleware/auth.cjs');

const router = express.Router();

// Listar cursos (públicos ou admin)
router.get('/', async (req, res) => {
  try {
    const { category, level, search, sort = 'created_at', order = 'DESC', admin } = req.query;
    
    let query = `
      SELECT 
        c.*,
        cat.name as category_name,
        cat.color as category_color,
        u.name as instructor_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
    `;
    
    // Se não for admin, filtrar apenas cursos publicados
    if (!admin) {
      query += ` WHERE c.status = 'published'`;
    } else {
      query += ` WHERE 1=1`;
    }
    
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
      whatYouLearn, targetAudience, 'published'
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
      duration,
      instructor,
      category,
      level,
      image
    } = req.body;

    console.log('Dados recebidos para atualização:', req.body);

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

    // Buscar o ID da categoria pelo nome
    let categoryId = null;
    if (category) {
      const categoryResult = await executeQuery(
        'SELECT id FROM categories WHERE name = $1',
        [category]
      );
      if (categoryResult.rows.length > 0) {
        categoryId = categoryResult.rows[0].id;
      }
    }

    // Buscar o ID do instrutor pelo nome
    let instructorId = req.user.id; // Por padrão, usar o usuário atual
    if (instructor) {
      const instructorResult = await executeQuery(
        'SELECT id FROM users WHERE name = $1 AND role IN ($2, $3)',
        [instructor, 'admin', 'instructor']
      );
      if (instructorResult.rows.length > 0) {
        instructorId = instructorResult.rows[0].id;
      }
    }

    const result = await executeQuery(`
      UPDATE courses SET
        title = $1, 
        description = $2, 
        short_description = $3, 
        price = $4,
        duration_hours = $5, 
        instructor_id = $6, 
        category_id = $7, 
        image_url = $8, 
        level = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `, [
      title, 
      description, 
      shortDescription, 
      price, 
      duration,
      instructorId, 
      categoryId, 
      image, 
      level, 
      id
    ]);

    console.log('Curso atualizado:', result.rows[0]);

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
      'SELECT instructor_id, title FROM courses WHERE id = $1',
      [id]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    if (req.user.role !== 'admin' && courseCheck.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para deletar este curso' });
    }

    // Verificar se há matrículas ativas para este curso
    const enrollmentsCheck = await executeQuery(
      'SELECT COUNT(*) as count FROM enrollments WHERE course_id = $1',
      [id]
    );

    if (enrollmentsCheck.rows[0].count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar este curso pois existem alunos matriculados. Considere desativar o curso em vez de deletá-lo.' 
      });
    }

    // Verificar se há módulos ou aulas associadas ao curso
    const modulesCheck = await executeQuery(
      'SELECT COUNT(*) as count FROM course_modules WHERE course_id = $1',
      [id]
    );

    if (modulesCheck.rows[0].count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar este curso pois ele possui módulos cadastrados. Exclua primeiro todos os módulos e suas aulas antes de excluir o curso.' 
      });
    }

    // Deletar o curso
    await executeQuery('DELETE FROM courses WHERE id = $1', [id]);

    console.log(`Curso "${courseCheck.rows[0].title}" deletado com sucesso`);

    res.json({ message: 'Curso deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar curso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================
// ROTAS PARA MÓDULOS DO CURSO
// ============================================

// Listar módulos de um curso
router.get('/:courseId/modules', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    console.log('🔍 Buscando módulos para o curso:', courseId);
    
    const result = await executeQuery(`
      SELECT 
        cm.*,
        COUNT(cl.id) as lessons_count
      FROM course_modules cm
      LEFT JOIN course_lessons cl ON cm.id = cl.module_id
      WHERE cm.course_id = $1
      GROUP BY cm.id
      ORDER BY cm.sort_order ASC, cm.created_at ASC
    `, [courseId]);
    
    console.log(`📚 Encontrados ${result.rows.length} módulos`);
    
    const modules = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      sortOrder: row.sort_order,
      lessonsCount: parseInt(row.lessons_count),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    console.log('✅ Módulos processados:', modules.map(m => ({ id: m.id, title: m.title, lessonsCount: m.lessonsCount })));
    res.json(modules);
  } catch (error) {
    console.error('❌ Erro ao buscar módulos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar módulo para um curso
router.post('/:courseId/modules', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, sortOrder = 0 } = req.body;
    
    console.log('📝 Criando módulo:', { courseId, title, description, sortOrder });
    
    // Verificar se o usuário pode editar este curso
    const courseCheck = await executeQuery(
      'SELECT instructor_id FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    if (req.user.role !== 'admin' && courseCheck.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar este curso' });
    }

    const result = await executeQuery(`
      INSERT INTO course_modules (course_id, title, description, sort_order)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [courseId, title, description, sortOrder]);

    const newModule = {
      id: result.rows[0].id,
      title: result.rows[0].title,
      description: result.rows[0].description,
      sortOrder: result.rows[0].sort_order,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    console.log('✅ Módulo criado com sucesso:', newModule);
    res.status(201).json(newModule);
  } catch (error) {
    console.error('❌ Erro ao criar módulo:', {
      courseId: req.params.courseId,
      requestBody: req.body,
      userId: req.user?.id,
      userRole: req.user?.role,
      errorMessage: error.message,
      errorCode: error.code,
      errorDetail: error.detail,
      errorStack: error.stack
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Atualizar módulo
router.put('/:courseId/modules/:moduleId', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const { title, description, sortOrder } = req.body;
    
    // Verificar se o usuário pode editar este curso
    const courseCheck = await executeQuery(
      'SELECT instructor_id FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    if (req.user.role !== 'admin' && courseCheck.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar este curso' });
    }

    const result = await executeQuery(`
      UPDATE course_modules 
      SET title = $1, description = $2, sort_order = $3, updated_at = NOW()
      WHERE id = $4 AND course_id = $5
      RETURNING *
    `, [title, description, sortOrder, moduleId, courseId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Módulo não encontrado' });
    }

    const updatedModule = {
      id: result.rows[0].id,
      title: result.rows[0].title,
      description: result.rows[0].description,
      sortOrder: result.rows[0].sort_order,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    res.json(updatedModule);
  } catch (error) {
    console.error('Erro ao atualizar módulo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar módulo
router.delete('/:courseId/modules/:moduleId', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    
    // Verificar se o usuário pode editar este curso
    const courseCheck = await executeQuery(
      'SELECT instructor_id FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    if (req.user.role !== 'admin' && courseCheck.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar este curso' });
    }

    // Verificar se há aulas no módulo
    const lessonsCheck = await executeQuery(
      'SELECT COUNT(*) as count FROM course_lessons WHERE module_id = $1',
      [moduleId]
    );

    if (lessonsCheck.rows[0].count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar este módulo pois existem aulas associadas. Delete as aulas primeiro.' 
      });
    }

    await executeQuery('DELETE FROM course_modules WHERE id = $1 AND course_id = $2', [moduleId, courseId]);

    res.json({ message: 'Módulo deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar módulo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================
// ROTAS PARA AULAS DO CURSO
// ============================================

// Listar aulas de um módulo
router.get('/:courseId/modules/:moduleId/lessons', async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    console.log('🔍 Buscando aulas para módulo:', moduleId);
    
    // Primeiro verificar se a coluna quiz_questions existe
    try {
      await executeQuery(`
        ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS quiz_questions JSONB
      `);
    } catch (error) {
      console.log('ℹ️ Coluna quiz_questions já existe ou erro ao adicionar:', error.message);
    }

    const result = await executeQuery(`
      SELECT 
        cl.*
      FROM course_lessons cl
      WHERE cl.module_id = $1
      ORDER BY cl.sort_order ASC, cl.created_at ASC
    `, [moduleId]);
    
    console.log(`📚 Encontradas ${result.rows.length} aulas`);
    
    const lessons = result.rows.map((row, index) => {
      let quizQuestions = null;
      
      // Parse quiz_questions com tratamento de erro e logs detalhados
      console.log(`🔍 Processando aula ${index + 1}: "${row.title}" (ID: ${row.id})`);
      console.log(`   Content Type: ${row.content_type}`);
      console.log(`   Quiz Questions existe: ${!!row.quiz_questions}`);
      console.log(`   Quiz Questions tipo: ${typeof row.quiz_questions}`);
      
      if (row.quiz_questions) {
        console.log(`   Quiz Questions valor completo:`, row.quiz_questions);
        
        try {
          if (typeof row.quiz_questions === 'string') {
            quizQuestions = JSON.parse(row.quiz_questions);
          } else {
            quizQuestions = row.quiz_questions; // Já é objeto
          }
          
          console.log(`   ✅ Quiz parsed: ${Array.isArray(quizQuestions) ? quizQuestions.length + ' perguntas' : 'não é array'}`);
          console.log(`   📊 Conteúdo parsed:`, quizQuestions);
          
          if (Array.isArray(quizQuestions) && quizQuestions.length > 0) {
            console.log(`   📋 Perguntas encontradas:`);
            quizQuestions.forEach((q, qIndex) => {
              console.log(`      ${qIndex + 1}. "${q.question || 'SEM PERGUNTA'}"`);
            });
          } else if (Array.isArray(quizQuestions) && quizQuestions.length === 0 && row.content_type === 'quiz') {
            console.log(`   ⚠️ Quiz vazio detectado para aula de quiz. Criando pergunta padrão...`);
            
            const defaultQuestions = [
              {
                id: 'default-1',
                question: 'Esta é uma pergunta de teste. Selecione a opção correta:',
                options: ['Opção A', 'Opção B (Correta)', 'Opção C', 'Opção D'],
                correctAnswer: 1,
                type: 'multiple-choice',
                explanation: 'Esta é uma pergunta de exemplo criada automaticamente.',
                required: true,
                points: 1
              }
            ];
            
            quizQuestions = defaultQuestions;
            console.log(`   ✅ Perguntas padrão criadas temporariamente`);
          }
          
        } catch (parseError) {
          console.error(`❌ Erro ao fazer parse de quiz_questions na aula ${index + 1}:`, parseError.message);
          console.error('📄 Dados problemáticos:', row.quiz_questions);
          quizQuestions = null;
        }
      } else {
        console.log(`   ⚠️ Quiz Questions é null/undefined para aula de quiz`);
        if (row.content_type === 'quiz') {
          console.log(`   🔧 Criando perguntas padrão para quiz sem dados...`);
          quizQuestions = [
            {
              id: 'default-1',
              question: 'Esta é uma pergunta de teste. Selecione a opção correta:',
              options: ['Opção A', 'Opção B (Correta)', 'Opção C', 'Opção D'],
              correctAnswer: 1,
              type: 'multiple-choice',
              explanation: 'Esta é uma pergunta de exemplo criada automaticamente.',
              required: true,
              points: 1
            }
          ];
        }
      }
      
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        contentType: row.content_type,
        contentUrl: row.content_url,
        quiz_questions: quizQuestions, // Frontend expects snake_case
        durationMinutes: row.duration_minutes,
        sortOrder: row.sort_order,
        isFree: row.is_free,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    console.log('✅ Retornando aulas processadas');
    res.json(lessons);
  } catch (error) {
    console.error('❌ Erro ao buscar aulas:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Criar aula para um módulo
router.post('/:courseId/modules/:moduleId/lessons', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const { title, description, contentType, contentUrl, durationMinutes, sortOrder = 0, isFree = false, quizQuestions } = req.body;
    
    console.log('📝 Dados recebidos para criar aula:', { 
      title, 
      contentType, 
      contentUrl, 
      hasQuizQuestions: !!quizQuestions,
      quizQuestionsCount: Array.isArray(quizQuestions) ? quizQuestions.length : 0,
      quizQuestions 
    });
    
    // Verificar se o usuário pode editar este curso
    const courseCheck = await executeQuery(
      'SELECT instructor_id FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    if (req.user.role !== 'admin' && courseCheck.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar este curso' });
    }

    // Preparar quiz_questions como JSON se existir
    const quizQuestionsJson = quizQuestions ? JSON.stringify(quizQuestions) : null;

    const result = await executeQuery(`
      INSERT INTO course_lessons (module_id, title, description, content_type, content_url, quiz_questions, duration_minutes, sort_order, is_free)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [moduleId, title, description, contentType, contentUrl, quizQuestionsJson, durationMinutes, sortOrder, isFree]);

    let parsedQuizQuestions = null;
    if (result.rows[0].quiz_questions) {
      try {
        parsedQuizQuestions = JSON.parse(result.rows[0].quiz_questions);
      } catch (parseError) {
        console.error('Erro ao fazer parse de quiz_questions na criação:', parseError);
        parsedQuizQuestions = null;
      }
    }

    const newLesson = {
      id: result.rows[0].id,
      title: result.rows[0].title,
      description: result.rows[0].description,
      contentType: result.rows[0].content_type,
      contentUrl: result.rows[0].content_url,
      quizQuestions: parsedQuizQuestions,
      durationMinutes: result.rows[0].duration_minutes,
      sortOrder: result.rows[0].sort_order,
      isFree: result.rows[0].is_free,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    res.status(201).json(newLesson);
  } catch (error) {
    console.error('Erro ao criar aula:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar aula
router.put('/:courseId/modules/:moduleId/lessons/:lessonId', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    const { title, description, contentType, contentUrl, durationMinutes, sortOrder, isFree, quizQuestions } = req.body;
    
    console.log('🔄 Dados recebidos para atualizar aula:', { title, contentType, contentUrl, quizQuestions });
    
    // Verificar se o usuário pode editar este curso
    const courseCheck = await executeQuery(
      'SELECT instructor_id FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    if (req.user.role !== 'admin' && courseCheck.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar este curso' });
    }

    // Preparar quiz_questions como JSON se existir
    const quizQuestionsJson = quizQuestions ? JSON.stringify(quizQuestions) : null;

    const result = await executeQuery(`
      UPDATE course_lessons 
      SET title = $1, description = $2, content_type = $3, content_url = $4, 
          quiz_questions = $5, duration_minutes = $6, sort_order = $7, is_free = $8, updated_at = NOW()
      WHERE id = $9 AND module_id = $10
      RETURNING *
    `, [title, description, contentType, contentUrl, quizQuestionsJson, durationMinutes, sortOrder, isFree, lessonId, moduleId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aula não encontrada' });
    }

    let updatedQuizQuestions = null;
    if (result.rows[0].quiz_questions) {
      try {
        if (typeof result.rows[0].quiz_questions === 'string') {
          updatedQuizQuestions = JSON.parse(result.rows[0].quiz_questions);
        } else {
          updatedQuizQuestions = result.rows[0].quiz_questions; // Já é objeto
        }
      } catch (parseError) {
        console.error('Erro ao fazer parse de quiz_questions na atualização:', parseError);
        console.error('Tipo dos dados:', typeof result.rows[0].quiz_questions);
        console.error('Dados recebidos:', result.rows[0].quiz_questions);
        updatedQuizQuestions = null;
      }
    }

    const updatedLesson = {
      id: result.rows[0].id,
      title: result.rows[0].title,
      description: result.rows[0].description,
      contentType: result.rows[0].content_type,
      contentUrl: result.rows[0].content_url,
      quizQuestions: updatedQuizQuestions,
      durationMinutes: result.rows[0].duration_minutes,
      sortOrder: result.rows[0].sort_order,
      isFree: result.rows[0].is_free,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    res.json(updatedLesson);
  } catch (error) {
    console.error('Erro ao atualizar aula:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar aula
router.delete('/:courseId/modules/:moduleId/lessons/:lessonId', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const { courseId, moduleId, lessonId } = req.params;
    
    // Verificar se o usuário pode editar este curso
    const courseCheck = await executeQuery(
      'SELECT instructor_id FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado' });
    }

    if (req.user.role !== 'admin' && courseCheck.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar este curso' });
    }

    await executeQuery('DELETE FROM course_lessons WHERE id = $1 AND module_id = $2', [lessonId, moduleId]);

    res.json({ message: 'Aula deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar aula:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;