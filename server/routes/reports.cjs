const express = require('express');
const { pool, executeQuery } = require('../config/database.cjs');
const { authenticateToken, requireRole } = require('../middleware/auth.cjs');

const router = express.Router();

// Middleware para verificar se é admin
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Relatório geral de métricas
router.get('/overview', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Total de receita baseado em orders (compras de cursos)
    let totalRevenue = 0;
    try {
      const revenueResult = await executeQuery(`
        SELECT COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'completed' AND o.created_at >= $1
      `, [daysAgo]);
      totalRevenue = parseFloat(revenueResult.rows[0]?.total_revenue || 0);
    } catch (error) {
      console.error('Erro ao calcular receita:', error);
      totalRevenue = 0;
    }

    // Total de alunos (removendo filtro de status que pode não existir)
    const studentsResult = await executeQuery(`
      SELECT COUNT(*) as total_students
      FROM users 
      WHERE role = 'student'
    `);

    // Total de cursos (removendo filtro de status que pode não existir)
    const coursesResult = await executeQuery(`
      SELECT COUNT(*) as total_courses
      FROM courses
    `);

    // Cursos completados (baseado em enrollments) - usando try/catch
    let completedCourses = 0;
    try {
      const completedCoursesResult = await executeQuery(`
        SELECT COUNT(*) as completed_courses
        FROM enrollments e
        WHERE e.status = 'completed'
      `);
      completedCourses = parseInt(completedCoursesResult.rows[0]?.completed_courses || 0);
    } catch (error) {
      console.error('Erro ao buscar cursos completados:', error);
      completedCourses = 0;
    }

    // Receita por mês (últimos 6 meses) baseado em orders - usando try/catch
    let monthlyRevenue = [];
    try {
      const monthlyRevenueResult = await executeQuery(`
        SELECT 
          DATE_TRUNC('month', o.created_at) as month,
          COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'completed' AND o.created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', o.created_at)
        ORDER BY month DESC
      `);
      monthlyRevenue = monthlyRevenueResult.rows;
    } catch (error) {
      console.error('Erro ao buscar receita mensal:', error);
      monthlyRevenue = [];
    }

    // Cursos por categoria - usando try/catch
    let coursesByCategory = [];
    try {
      const coursesByCategoryResult = await executeQuery(`
        SELECT 
          c.name as category,
          COUNT(co.id) as count
        FROM categories c
        LEFT JOIN courses co ON c.id = co.category_id
        GROUP BY c.id, c.name
        ORDER BY count DESC
      `);
      coursesByCategory = coursesByCategoryResult.rows;
    } catch (error) {
      console.error('Erro ao buscar cursos por categoria:', error);
      coursesByCategory = [];
    }

    // Top 5 cursos por receita baseado em order_items - usando try/catch
    let topCourses = [];
    try {
      const topCoursesResult = await executeQuery(`
        SELECT 
          c.title,
          c.id,
          COUNT(oi.id) as sales,
          COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
          COALESCE(AVG(oi.price), 0) as avg_ticket
        FROM courses c
        LEFT JOIN order_items oi ON c.id = oi.course_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
        GROUP BY c.id, c.title
        ORDER BY revenue DESC
        LIMIT 5
      `);
      topCourses = topCoursesResult.rows;
    } catch (error) {
      console.error('Erro ao buscar top cursos:', error);
      topCourses = [];
    }

    // Novos alunos por mês - usando try/catch
    let newStudents = [];
    try {
      const newStudentsResult = await executeQuery(`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as new_students
        FROM users 
        WHERE role = 'student' 
        AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
      `);
      newStudents = newStudentsResult.rows;
    } catch (error) {
      console.error('Erro ao buscar novos alunos:', error);
      newStudents = [];
    }

    // Taxa de conclusão baseado em enrollments - usando try/catch
    let completionRate = 0;
    try {
      const completionRateResult = await executeQuery(`
        SELECT 
          COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed,
          COUNT(*) as total
        FROM enrollments e
      `);
      
      completionRate = completionRateResult.rows[0].total > 0 
        ? Math.round((completionRateResult.rows[0].completed / completionRateResult.rows[0].total) * 100)
        : 0;
    } catch (error) {
      console.error('Erro ao calcular taxa de conclusão:', error);
      completionRate = 0;
    }


    res.json({
      metrics: {
        totalRevenue: totalRevenue,
        totalStudents: parseInt(studentsResult.rows[0].total_students || 0),
        totalCourses: parseInt(coursesResult.rows[0].total_courses || 0),
        completedCourses: completedCourses,
        completionRate
      },
      monthlyRevenue: monthlyRevenue.map(row => ({
        month: row.month,
        revenue: parseFloat(row.revenue || 0)
      })),
      coursesByCategory: coursesByCategory.map(row => ({
        category: row.category,
        count: parseInt(row.count || 0)
      })),
      topCourses: topCourses.map(row => ({
        title: row.title,
        id: row.id,
        sales: parseInt(row.sales || 0),
        revenue: parseFloat(row.revenue || 0),
        avgTicket: parseFloat(row.avg_ticket || 0)
      })),
      newStudents: newStudents.map(row => ({
        month: row.month,
        newStudents: parseInt(row.new_students || 0)
      }))
    });

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
