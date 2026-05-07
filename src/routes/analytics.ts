import { Hono } from 'hono'
import { verifyJWT } from '../middleware/auth'

type Bindings = { DB: D1Database }
const analytics = new Hono<{ Bindings: Bindings }>()

analytics.get('/student', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    const [quizStats, resourceStats, badgeStats, progress, history] = await Promise.all([
      c.env.DB.prepare(`SELECT COUNT(*) as quizzes_taken, AVG(percentage) as avg_score FROM quiz_attempts WHERE user_id = ? AND status = 'completed'`).bind(user.id).first<any>(),
      c.env.DB.prepare(`SELECT COUNT(*) as total_resources FROM resource_analytics WHERE user_id = ?`).bind(user.id).first<any>(),
      c.env.DB.prepare(`SELECT COUNT(*) as badges_earned FROM user_badges WHERE user_id = ?`).bind(user.id).first<any>(),
      c.env.DB.prepare(`SELECT sp.completion_percentage as completion, s.name FROM study_progress sp JOIN subjects s ON sp.subject_id = s.id WHERE sp.user_id = ? LIMIT 5`).bind(user.id).all<any>(),
      c.env.DB.prepare(`SELECT qa.*, q.title as quiz_title FROM quiz_attempts qa JOIN quizzes q ON qa.quiz_id = q.id WHERE qa.user_id = ? ORDER BY qa.completed_at DESC LIMIT 10`).bind(user.id).all<any>(),
    ])
    return c.json({
      quizzes_taken: quizStats?.quizzes_taken || 0,
      avg_score: quizStats?.avg_score || 0,
      total_resources: resourceStats?.total_resources || 0,
      badges_earned: badgeStats?.badges_earned || 0,
      subject_progress: (progress.results || []).map((p: any) => ({ name: p.name, completion: p.completion || 0 })),
      quiz_history: history.results || [],
    })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

analytics.get('/admin', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const [users, resources, quizzes, attempts, downloads, branches] = await Promise.all([
      c.env.DB.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN role='student' THEN 1 ELSE 0 END) as students FROM users WHERE is_active=1`).first<any>(),
      c.env.DB.prepare(`SELECT COUNT(*) as total FROM resources WHERE is_active=1`).first<any>(),
      c.env.DB.prepare(`SELECT COUNT(*) as total FROM quizzes WHERE is_active=1`).first<any>(),
      c.env.DB.prepare(`SELECT COUNT(*) as total, AVG(percentage) as avg_score FROM quiz_attempts`).first<any>(),
      c.env.DB.prepare(`SELECT SUM(download_count) as total FROM resources`).first<any>(),
      c.env.DB.prepare(`SELECT COUNT(*) as total FROM branches WHERE is_active=1`).first<any>(),
    ])
    return c.json({
      total_users: users?.total || 0,
      total_students: users?.students || 0,
      total_resources: resources?.total || 0,
      total_quizzes: quizzes?.total || 0,
      total_quiz_attempts: attempts?.total || 0,
      avg_quiz_score: attempts?.avg_score || 0,
      total_downloads: downloads?.total || 0,
      total_branches: branches?.total || 0,
    })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default analytics
