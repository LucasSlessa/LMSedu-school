// Teste para verificar se a API está retornando dados corretos do quiz
async function testQuizAPI() {
  try {
    console.log('🔍 Testando API de quiz...\n');
    
    // Primeiro, vamos buscar um curso que tem quiz
    const coursesResponse = await fetch('http://localhost:3001/api/courses');
    const courses = await coursesResponse.json();
    
    console.log(`📚 Encontrados ${courses.length} cursos`);
    
    for (const course of courses) {
      console.log(`\n🎓 Testando curso: ${course.title} (ID: ${course.id})`);
      
      // Buscar módulos do curso
      const modulesResponse = await fetch(`http://localhost:3001/api/courses/${course.id}/modules`);
      const modules = await modulesResponse.json();
      
      console.log(`   📋 ${modules.length} módulos encontrados`);
      
      for (const module of modules) {
        console.log(`\n   📂 Módulo: ${module.title} (ID: ${module.id})`);
        
        // Buscar aulas do módulo
        const lessonsResponse = await fetch(`http://localhost:3001/api/courses/${course.id}/modules/${module.id}/lessons`);
        const lessons = await lessonsResponse.json();
        
        console.log(`      📝 ${lessons.length} aulas encontradas`);
        
        // Verificar aulas de quiz
        const quizLessons = lessons.filter(lesson => lesson.contentType === 'quiz');
        
        if (quizLessons.length > 0) {
          console.log(`      🎯 ${quizLessons.length} aulas de quiz encontradas:`);
          
          quizLessons.forEach((lesson, index) => {
            console.log(`\n         ${index + 1}. "${lesson.title}" (ID: ${lesson.id})`);
            console.log(`            Content Type: ${lesson.contentType}`);
            console.log(`            Has quizQuestions: ${!!lesson.quizQuestions}`);
            console.log(`            quizQuestions type: ${typeof lesson.quizQuestions}`);
            
            if (lesson.quizQuestions) {
              if (Array.isArray(lesson.quizQuestions)) {
                console.log(`            ✅ ${lesson.quizQuestions.length} perguntas encontradas`);
                lesson.quizQuestions.forEach((q, qIndex) => {
                  console.log(`               ${qIndex + 1}. "${q.question || 'SEM PERGUNTA'}"`);
                  console.log(`                  Opções: ${q.options?.length || 0}`);
                  console.log(`                  Resposta: ${q.correctAnswer}`);
                });
              } else {
                console.log(`            ❌ quizQuestions não é array: ${JSON.stringify(lesson.quizQuestions).substring(0, 100)}...`);
              }
            } else {
              console.log(`            ❌ quizQuestions é null/undefined`);
            }
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
}

testQuizAPI();
