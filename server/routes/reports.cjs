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

    // Total de receita
    let totalRevenue = 0;
    try {
      const revenueResult = await executeQuery(`
        SELECT COALESCE(SUM(oi.price), 0) as total_revenue
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status = 'completed' 
        AND o.created_at >= $1
      `, [daysAgo]);
      totalRevenue = parseFloat(revenueResult.rows[0]?.total_revenue || 0);
    } catch (error) {
      // Se não há dados, receita é 0
      totalRevenue = 0;
    }

    // Total de alunos
    const studentsResult = await executeQuery(`
      SELECT COUNT(*) as total_students
      FROM users 
      WHERE role = 'student' AND status = 'active'
    `);

    // Total de cursos
    const coursesResult = await executeQuery(`
      SELECT COUNT(*) as total_courses
      FROM courses 
      WHERE status = 'active'
    `);

    // Cursos completados
    const completedCoursesResult = await executeQuery(`
      SELECT COUNT(*) as completed_courses
      FROM enrollments 
      WHERE status = 'completed'
    `);

    // Receita por mês (últimos 6 meses)
    const monthlyRevenueResult = await executeQuery(`
      SELECT 
        DATE_TRUNC('month', o.created_at) as month,
        COALESCE(SUM(oi.price), 0) as revenue
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status = 'completed'
      AND o.created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', o.created_at)
      ORDER BY month DESC
    `);

    // Cursos por categoria
    const coursesByCategoryResult = await executeQuery(`
      SELECT 
        c.name as category,
        COUNT(co.id) as count
      FROM categories c
      LEFT JOIN courses co ON c.id = co.category_id
      WHERE co.status = 'active' OR co.id IS NULL
      GROUP BY c.id, c.name
      ORDER BY count DESC
    `);

    // Top 5 cursos por receita
    const topCoursesResult = await executeQuery(`
      SELECT 
        co.title,
        co.id,
        COUNT(oi.id) as sales,
        COALESCE(SUM(oi.price), 0) as revenue,
        COALESCE(AVG(oi.price), 0) as avg_ticket
      FROM courses co
      LEFT JOIN order_items oi ON co.id = oi.course_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed' OR o.id IS NULL
      GROUP BY co.id, co.title
      ORDER BY revenue DESC
      LIMIT 5
    `);

    // Novos alunos por mês
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

    // Taxa de conclusão
    const completionRateResult = await executeQuery(`
      SELECT 
        COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed,
        COUNT(*) as total
      FROM enrollments e
    `);

    const completionRate = completionRateResult.rows[0].total > 0 
      ? Math.round((completionRateResult.rows[0].completed / completionRateResult.rows[0].total) * 100)
      : 0;

    res.json({
      metrics: {
        totalRevenue: totalRevenue,
        totalStudents: parseInt(studentsResult.rows[0].total_students || 0),
        totalCourses: parseInt(coursesResult.rows[0].total_courses || 0),
        completedCourses: parseInt(completedCoursesResult.rows[0].completed_courses || 0),
        completionRate
      },
      monthlyRevenue: monthlyRevenueResult.rows.map(row => ({
        month: row.month,
        revenue: parseFloat(row.revenue || 0)
      })),
      coursesByCategory: coursesByCategoryResult.rows.map(row => ({
        category: row.category,
        count: parseInt(row.count || 0)
      })),
      topCourses: topCoursesResult.rows.map(row => ({
        title: row.title,
        id: row.id,
        sales: parseInt(row.sales || 0),
        revenue: parseFloat(row.revenue || 0),
        avgTicket: parseFloat(row.avg_ticket || 0)
      })),
      newStudents: newStudentsResult.rows.map(row => ({
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
