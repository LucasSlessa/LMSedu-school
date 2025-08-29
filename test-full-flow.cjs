const { pool, executeQuery } = require('./server/config/database.cjs');

async function testFullFlow() {
  try {
    console.log('🧪 Testando fluxo completo: criar curso → adicionar módulos → editar curso\n');
    
    // 1. Criar um curso de teste
    console.log('📚 PASSO 1: Criando curso de teste...');
    const courseResult = await executeQuery(`
      INSERT INTO courses (title, description, price, instructor_id, category_id, level, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      'Curso de Teste - Fluxo Completo',
      'Curso criado para testar o fluxo completo de módulos e aulas',
      99.99,
      1, // Assumindo que existe um usuário admin com ID 1
      1, // Assumindo que existe uma categoria com ID 1
      'intermediate',
      'https://example.com/thumbnail.jpg'
    ]);
    
    const courseId = courseResult.rows[0].id;
    console.log(`✅ Curso criado com ID: ${courseId}`);
    
    // 2. Adicionar módulos ao curso
    console.log('\n📂 PASSO 2: Adicionando módulos...');
    const modules = [];
    
    for (let i = 1; i <= 3; i++) {
      const moduleResult = await executeQuery(`
        INSERT INTO course_modules (course_id, title, description, sort_order)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [
        courseId,
        `Módulo ${i} - Teste`,
        `Descrição do módulo ${i} para teste`,
        i
      ]);
      
      modules.push(moduleResult.rows[0]);
      console.log(`  ✅ Módulo ${i} criado: ${moduleResult.rows[0].title} (ID: ${moduleResult.rows[0].id})`);
    }
    
    // 3. Adicionar aulas aos módulos
    console.log('\n📖 PASSO 3: Adicionando aulas...');
    
    for (const module of modules) {
      console.log(`\n  📂 Adicionando aulas ao módulo: ${module.title}`);
      
      // Adicionar 2 aulas por módulo
      for (let i = 1; i <= 2; i++) {
        const contentType = i === 2 ? 'quiz' : 'video';
        const quizQuestions = contentType === 'quiz' ? JSON.stringify([
          {
            id: 1,
            question: `Pergunta ${i} do ${module.title}`,
            options: ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
            correctAnswer: 0
          }
        ]) : null;
        
        const lessonResult = await executeQuery(`
          INSERT INTO course_lessons (module_id, title, description, content_type, content_url, duration_minutes, sort_order, quiz_questions)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [
          module.id,
          `Aula ${i} - ${module.title}`,
          `Descrição da aula ${i}`,
          contentType,
          contentType === 'video' ? 'https://example.com/video.mp4' : null,
          15,
          i,
          quizQuestions
        ]);
        
        console.log(`    ✅ Aula ${i} criada: ${lessonResult.rows[0].title} (${contentType})`);
      }
    }
    
    // 4. Verificar se os dados foram salvos corretamente
    console.log('\n🔍 PASSO 4: Verificando dados salvos...');
    
    const savedModules = await executeQuery(`
      SELECT 
        cm.*,
        COUNT(cl.id) as lessons_count
      FROM course_modules cm
      LEFT JOIN course_lessons cl ON cm.id = cl.module_id
      WHERE cm.course_id = $1
      GROUP BY cm.id
      ORDER BY cm.sort_order ASC
    `, [courseId]);
    
    console.log(`📊 Módulos salvos: ${savedModules.rows.length}`);
    
    for (const module of savedModules.rows) {
      console.log(`  📂 ${module.title}: ${module.lessons_count} aulas`);
      
      const lessons = await executeQuery(`
        SELECT id, title, content_type, quiz_questions
        FROM course_lessons 
        WHERE module_id = $1
        ORDER BY sort_order ASC
      `, [module.id]);
      
      lessons.rows.forEach((lesson, index) => {
        const hasQuiz = lesson.content_type === 'quiz' && lesson.quiz_questions;
        console.log(`    ${index + 1}. ${lesson.title} (${lesson.content_type})${hasQuiz ? ' 🎯' : ''}`);
      });
    }
    
    // 5. Simular chamada da API para buscar módulos
    console.log('\n🌐 PASSO 5: Simulando chamada da API...');
    
    const apiModules = await executeQuery(`
      SELECT 
        cm.*,
        COUNT(cl.id) as lessons_count
      FROM course_modules cm
      LEFT JOIN course_lessons cl ON cm.id = cl.module_id
      WHERE cm.course_id = $1
      GROUP BY cm.id
      ORDER BY cm.sort_order ASC, cm.created_at ASC
    `, [courseId]);
    
    const formattedModules = apiModules.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      sortOrder: row.sort_order,
      lessonsCount: parseInt(row.lessons_count),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    console.log('📡 Resposta da API (módulos):');
    console.log(JSON.stringify(formattedModules, null, 2));
    
    // 6. Simular chamada da API para buscar aulas do primeiro módulo
    if (formattedModules.length > 0) {
      const firstModuleId = formattedModules[0].id;
      console.log(`\n📖 Buscando aulas do primeiro módulo (${firstModuleId}):`);
      
      const apiLessons = await executeQuery(`
        SELECT *
        FROM course_lessons 
        WHERE module_id = $1
        ORDER BY sort_order ASC, created_at ASC
      `, [firstModuleId]);
      
      console.log('📡 Resposta da API (aulas):');
      console.log(JSON.stringify(apiLessons.rows, null, 2));
    }
    
    console.log('\n✅ TESTE COMPLETO FINALIZADO!');
    console.log(`📋 Curso criado: ID ${courseId}`);
    console.log(`📂 Módulos: ${savedModules.rows.length}`);
    console.log(`📖 Total de aulas: ${savedModules.rows.reduce((sum, m) => sum + parseInt(m.lessons_count), 0)}`);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    process.exit(0);
  }
}

testFullFlow();
