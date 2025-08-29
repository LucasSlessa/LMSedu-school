const { pool, executeQuery } = require('./server/config/database.cjs');

async function debugModuleLoading() {
  try {
    console.log('🔍 Debugando carregamento de módulos...\n');
    
    // 1. Buscar curso mais recente
    const recentCourse = await executeQuery(`
      SELECT id, title, created_at 
      FROM courses 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (recentCourse.rows.length === 0) {
      console.log('❌ Nenhum curso encontrado');
      return;
    }
    
    const courseId = recentCourse.rows[0].id;
    const courseTitle = recentCourse.rows[0].title;
    
    console.log(`📚 Curso mais recente: ${courseTitle} (${courseId})`);
    
    // 2. Verificar módulos deste curso
    console.log('\n🔍 Verificando módulos:');
    const modules = await executeQuery(`
      SELECT id, title, description, sort_order, created_at
      FROM course_modules 
      WHERE course_id = $1
      ORDER BY sort_order ASC, created_at ASC
    `, [courseId]);
    
    console.log(`📋 Encontrados ${modules.rows.length} módulos:`);
    modules.rows.forEach((module, index) => {
      console.log(`  ${index + 1}. ${module.title} (ID: ${module.id})`);
    });
    
    // 3. Para cada módulo, verificar aulas
    for (const module of modules.rows) {
      console.log(`\n📂 Aulas do módulo "${module.title}":`);
      
      const lessons = await executeQuery(`
        SELECT id, title, content_type, quiz_questions, created_at
        FROM course_lessons 
        WHERE module_id = $1
        ORDER BY sort_order ASC, created_at ASC
      `, [module.id]);
      
      if (lessons.rows.length === 0) {
        console.log('  📭 Nenhuma aula encontrada');
      } else {
        lessons.rows.forEach((lesson, index) => {
          const hasQuiz = lesson.content_type === 'quiz' && lesson.quiz_questions;
          console.log(`    ${index + 1}. ${lesson.title} (${lesson.content_type})${hasQuiz ? ' 🎯' : ''}`);
        });
      }
    }
    
    // 4. Simular chamada da API
    console.log('\n🌐 Simulando chamada da API GET /modules:');
    const apiResult = await executeQuery(`
      SELECT 
        cm.*,
        COUNT(cl.id) as lessons_count
      FROM course_modules cm
      LEFT JOIN course_lessons cl ON cm.id = cl.module_id
      WHERE cm.course_id = $1
      GROUP BY cm.id
      ORDER BY cm.sort_order ASC, cm.created_at ASC
    `, [courseId]);
    
    const apiModules = apiResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      sortOrder: row.sort_order,
      lessonsCount: parseInt(row.lessons_count),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    console.log('📡 Resposta da API simulada:', JSON.stringify(apiModules, null, 2));
    
    // 5. Verificar se há problemas de encoding ou dados
    console.log('\n🔍 Verificando integridade dos dados:');
    for (const module of modules.rows) {
      console.log(`\n📋 Módulo: ${module.title}`);
      console.log(`  - ID: ${module.id}`);
      console.log(`  - Título válido: ${!!module.title && module.title.length > 0}`);
      console.log(`  - Descrição: ${module.description || 'Vazia'}`);
      console.log(`  - Sort Order: ${module.sort_order}`);
      console.log(`  - Created At: ${module.created_at}`);
    }

  } catch (error) {
    console.error('❌ Erro no debug:', error);
  } finally {
    process.exit(0);
  }
}

debugModuleLoading();
