const { pool, executeQuery } = require('./server/config/database.cjs');

async function testSimpleFlow() {
  try {
    console.log('🧪 Testando fluxo simples com dados existentes...\n');
    
    // 1. Buscar usuário admin existente
    console.log('👤 PASSO 1: Buscando usuário admin...');
    const adminResult = await executeQuery(`
      SELECT id, name, email FROM users WHERE role = 'admin' LIMIT 1
    `);
    
    if (adminResult.rows.length === 0) {
      console.log('❌ Nenhum usuário admin encontrado');
      return;
    }
    
    const adminId = adminResult.rows[0].id;
    console.log(`✅ Admin encontrado: ${adminResult.rows[0].name} (${adminId})`);
    
    // 2. Buscar categoria existente
    console.log('\n📂 PASSO 2: Buscando categoria...');
    const categoryResult = await executeQuery(`
      SELECT id, name FROM categories LIMIT 1
    `);
    
    if (categoryResult.rows.length === 0) {
      console.log('❌ Nenhuma categoria encontrada, criando uma...');
      const newCategoryResult = await executeQuery(`
        INSERT INTO categories (name, description) 
        VALUES ('Tecnologia', 'Cursos de tecnologia e programação')
        RETURNING id, name
      `);
      var categoryId = newCategoryResult.rows[0].id;
      console.log(`✅ Categoria criada: ${newCategoryResult.rows[0].name} (${categoryId})`);
    } else {
      var categoryId = categoryResult.rows[0].id;
      console.log(`✅ Categoria encontrada: ${categoryResult.rows[0].name} (${categoryId})`);
    }
    
    // 3. Criar curso de teste
    console.log('\n📚 PASSO 3: Criando curso de teste...');
    const courseResult = await executeQuery(`
      INSERT INTO courses (title, description, price, instructor_id, category_id, level, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      'Curso de Teste - Módulos',
      'Curso para testar módulos e aulas',
      49.99,
      adminId,
      categoryId,
      'beginner',
      'https://example.com/image.jpg'
    ]);
    
    const courseId = courseResult.rows[0].id;
    console.log(`✅ Curso criado: ${courseResult.rows[0].title} (${courseId})`);
    
    // 4. Adicionar módulos
    console.log('\n📂 PASSO 4: Adicionando módulos...');
    const moduleIds = [];
    
    for (let i = 1; i <= 2; i++) {
      const moduleResult = await executeQuery(`
        INSERT INTO course_modules (course_id, title, description, sort_order)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [
        courseId,
        `Módulo ${i}`,
        `Descrição do módulo ${i}`,
        i
      ]);
      
      moduleIds.push(moduleResult.rows[0].id);
      console.log(`  ✅ ${moduleResult.rows[0].title} criado (${moduleResult.rows[0].id})`);
    }
    
    // 5. Adicionar aulas
    console.log('\n📖 PASSO 5: Adicionando aulas...');
    
    for (let moduleIndex = 0; moduleIndex < moduleIds.length; moduleIndex++) {
      const moduleId = moduleIds[moduleIndex];
      console.log(`\n  📂 Módulo ${moduleIndex + 1}:`);
      
      for (let i = 1; i <= 2; i++) {
        const lessonResult = await executeQuery(`
          INSERT INTO course_lessons (module_id, title, description, content_type, sort_order)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [
          moduleId,
          `Aula ${i} - Módulo ${moduleIndex + 1}`,
          `Descrição da aula ${i}`,
          'video',
          i
        ]);
        
        console.log(`    ✅ ${lessonResult.rows[0].title} criada`);
      }
    }
    
    // 6. Testar API de módulos
    console.log('\n🌐 PASSO 6: Testando API de módulos...');
    const modulesAPI = await executeQuery(`
      SELECT 
        cm.*,
        COUNT(cl.id) as lessons_count
      FROM course_modules cm
      LEFT JOIN course_lessons cl ON cm.id = cl.module_id
      WHERE cm.course_id = $1
      GROUP BY cm.id
      ORDER BY cm.sort_order ASC
    `, [courseId]);
    
    console.log(`📊 API retornou ${modulesAPI.rows.length} módulos:`);
    modulesAPI.rows.forEach(module => {
      console.log(`  📂 ${module.title}: ${module.lessons_count} aulas`);
    });
    
    // 7. Testar API de aulas do primeiro módulo
    if (modulesAPI.rows.length > 0) {
      const firstModuleId = modulesAPI.rows[0].id;
      console.log(`\n📖 PASSO 7: Testando API de aulas (módulo ${firstModuleId})...`);
      
      const lessonsAPI = await executeQuery(`
        SELECT * FROM course_lessons 
        WHERE module_id = $1
        ORDER BY sort_order ASC
      `, [firstModuleId]);
      
      console.log(`📊 API retornou ${lessonsAPI.rows.length} aulas:`);
      lessonsAPI.rows.forEach(lesson => {
        console.log(`  📖 ${lesson.title} (${lesson.content_type})`);
      });
    }
    
    console.log('\n✅ TESTE SIMPLES CONCLUÍDO COM SUCESSO!');
    console.log(`🎯 Curso ID para teste: ${courseId}`);
    console.log('📝 Agora você pode testar no frontend usando este curso.');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    process.exit(0);
  }
}

testSimpleFlow();
