const fetch = require('node-fetch');

async function testAPIDirect() {
  try {
    console.log('🔍 Testando API diretamente...\n');
    
    // Primeiro, buscar cursos
    const coursesResponse = await fetch('http://localhost:3001/api/courses');
    const courses = await coursesResponse.json();
    
    console.log(`📚 ${courses.length} cursos encontrados`);
    
    for (const course of courses.slice(0, 2)) { // Testar apenas os primeiros 2
      console.log(`\n🎓 Curso: ${course.title} (ID: ${course.id})`);
      
      // Buscar módulos
      const modulesResponse = await fetch(`http://localhost:3001/api/courses/${course.id}/modules`);
      const modules = await modulesResponse.json();
      
      console.log(`   📋 ${modules.length} módulos`);
      
      for (const module of modules) {
        console.log(`\n   📂 Módulo: ${module.title} (ID: ${module.id})`);
        
        // Buscar aulas
        const lessonsResponse = await fetch(`http://localhost:3001/api/courses/${course.id}/modules/${module.id}/lessons`);
        const lessons = await lessonsResponse.json();
        
        console.log(`      📝 ${lessons.length} aulas`);
        
        // Verificar aulas de quiz
        const quizLessons = lessons.filter(lesson => lesson.contentType === 'quiz');
        
        if (quizLessons.length > 0) {
          console.log(`      🎯 ${quizLessons.length} quiz(s) encontrado(s):`);
          
          quizLessons.forEach(lesson => {
            console.log(`\n         📋 "${lesson.title}" (ID: ${lesson.id})`);
            console.log(`            contentType: ${lesson.contentType}`);
            console.log(`            quizQuestions existe: ${!!lesson.quizQuestions}`);
            console.log(`            quizQuestions tipo: ${typeof lesson.quizQuestions}`);
            
            if (lesson.quizQuestions) {
              if (Array.isArray(lesson.quizQuestions)) {
                console.log(`            ✅ ${lesson.quizQuestions.length} perguntas`);
                lesson.quizQuestions.forEach((q, i) => {
                  console.log(`               ${i+1}. "${q.question || 'SEM PERGUNTA'}"`);
                });
              } else {
                console.log(`            ❌ Não é array: ${JSON.stringify(lesson.quizQuestions).substring(0, 100)}...`);
              }
            } else {
              console.log(`            ❌ quizQuestions é null/undefined`);
            }
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testAPIDirect();
