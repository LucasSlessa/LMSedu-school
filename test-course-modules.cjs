const { pool, executeQuery } = require('./server/config/database.cjs');

async function testCourseModules() {
  try {
    console.log('🧪 Testando sistema completo de módulos e aulas...\n');
    
    // 1. Listar todos os cursos
    console.log('📚 CURSOS EXISTENTES:');
    const coursesResult = await executeQuery(`
      SELECT id, title, created_at 
      FROM courses 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    if (coursesResult.rows.length === 0) {
      console.log('❌ Nenhum curso encontrado!');
      return;
    }
    
    coursesResult.rows.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title} (ID: ${course.id})`);
    });
    
    // 2. Para cada curso, verificar módulos
    for (const course of coursesResult.rows) {
      console.log(`\n🔍 Verificando módulos do curso: ${course.title}`);
      
      const modulesResult = await executeQuery(`
        SELECT id, title, description, sort_order, created_at
        FROM course_modules 
        WHERE course_id = $1
        ORDER BY sort_order ASC, created_at ASC
      `, [course.id]);
      
      if (modulesResult.rows.length === 0) {
        console.log('  📭 Nenhum módulo encontrado');
        continue;
      }
      
      console.log(`  📋 ${modulesResult.rows.length} módulos encontrados:`);
      
      // 3. Para cada módulo, verificar aulas
      for (const module of modulesResult.rows) {
        console.log(`    📂 ${module.title} (ID: ${module.id})`);
        
        const lessonsResult = await executeQuery(`
          SELECT id, title, content_type, quiz_questions, created_at
          FROM course_lessons 
          WHERE module_id = $1
          ORDER BY sort_order ASC, created_at ASC
        `, [module.id]);
        
        if (lessonsResult.rows.length === 0) {
          console.log('      📭 Nenhuma aula encontrada');
        } else {
          console.log(`      📖 ${lessonsResult.rows.length} aulas:`);
          lessonsResult.rows.forEach((lesson, index) => {
            const hasQuiz = lesson.content_type === 'quiz' && lesson.quiz_questions;
            console.log(`        ${index + 1}. ${lesson.title} (${lesson.content_type})${hasQuiz ? ' 🎯' : ''}`);
          });
        }
      }
    }
    
    // 4. Verificar integridade dos dados
    console.log('\n🔍 VERIFICAÇÃO DE INTEGRIDADE:');
    
    const integrityCheck = await executeQuery(`
      SELECT 
        c.title as course_title,
        COUNT(DISTINCT cm.id) as modules_count,
        COUNT(cl.id) as lessons_count
      FROM courses c
      LEFT JOIN course_modules cm ON c.id = cm.course_id
      LEFT JOIN course_lessons cl ON cm.id = cl.module_id
      GROUP BY c.id, c.title
      ORDER BY c.created_at DESC
    `);
    
    integrityCheck.rows.forEach(row => {
      console.log(`📊 ${row.course_title}: ${row.modules_count} módulos, ${row.lessons_count} aulas`);
    });
    
    // 5. Verificar dados órfãos
    console.log('\n🔍 VERIFICANDO DADOS ÓRFÃOS:');
    
    const orphanModules = await executeQuery(`
      SELECT cm.id, cm.title 
      FROM course_modules cm
      LEFT JOIN courses c ON cm.course_id = c.id
      WHERE c.id IS NULL
    `);
    
    if (orphanModules.rows.length > 0) {
      console.log('⚠️ Módulos órfãos encontrados:', orphanModules.rows);
    } else {
      console.log('✅ Nenhum módulo órfão');
    }
    
    const orphanLessons = await executeQuery(`
      SELECT cl.id, cl.title 
      FROM course_lessons cl
      LEFT JOIN course_modules cm ON cl.module_id = cm.id
      WHERE cm.id IS NULL
    `);
    
    if (orphanLessons.rows.length > 0) {
      console.log('⚠️ Aulas órfãs encontradas:', orphanLessons.rows);
    } else {
      console.log('✅ Nenhuma aula órfã');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    process.exit(0);
  }
}

testCourseModules();
