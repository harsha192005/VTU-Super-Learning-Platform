import { Hono } from 'hono'
import { adminMiddleware, authMiddleware } from '../middleware/auth'

type Bindings = { DB: D1Database }
const analytics = new Hono<{ Bindings: Bindings }>()

analytics.get('/admin', adminMiddleware, async (c) => {
  try {
    const stats = await c.env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role='student' AND is_active=1) as total_students,
        (SELECT COUNT(*) FROM users WHERE role='admin') as total_admins,
        (SELECT COUNT(*) FROM resources WHERE is_active=1) as total_resources,
        (SELECT COUNT(*) FROM quizzes WHERE is_active=1) as total_quizzes,
        (SELECT COUNT(*) FROM quiz_attempts WHERE status='completed') as total_attempts,
        (SELECT ROUND(AVG(percentage),1) FROM quiz_attempts WHERE status='completed') as avg_quiz_score,
        (SELECT COUNT(*) FROM subjects WHERE is_active=1) as total_subjects,
        (SELECT COUNT(*) FROM branches WHERE is_active=1) as total_branches,
        (SELECT SUM(download_count) FROM resources) as total_downloads,
        (SELECT COUNT(*) FROM ai_sessions) as total_ai_sessions,
        (SELECT COUNT(*) FROM users WHERE date(created_at) = date('now')) as new_students_today,
        (SELECT COUNT(*) FROM quiz_attempts WHERE date(completed_at) = date('now')) as quizzes_today
    `).first()
    const { results: topResources } = await c.env.DB.prepare(
      `SELECT r.id, r.title, r.type, r.download_count, r.view_count, s.name as subject_name FROM resources r LEFT JOIN subjects s ON r.subject_id = s.id WHERE r.is_active=1 ORDER BY r.download_count DESC LIMIT 10`
    ).all()
    const { results: topStudents } = await c.env.DB.prepare(
      `SELECT id, name, email, branch, points, level, streak FROM users WHERE role='student' ORDER BY points DESC LIMIT 10`
    ).all()
    const { results: branchStats } = await c.env.DB.prepare(
      `SELECT branch, COUNT(*) as count FROM users WHERE role='student' AND branch IS NOT NULL GROUP BY branch ORDER BY count DESC`
    ).all()
    const { results: recentActivity } = await c.env.DB.prepare(
      `SELECT u.name, q.title as quiz_title, qa.percentage, qa.completed_at FROM quiz_attempts qa JOIN users u ON qa.user_id=u.id JOIN quizzes q ON qa.quiz_id=q.id ORDER BY qa.completed_at DESC LIMIT 10`
    ).all()
    return c.json({ stats, topResources, topStudents, branchStats, recentActivity })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

analytics.get('/student', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const weeklyProgress = await c.env.DB.prepare(`
      SELECT 
        COUNT(CASE WHEN date(completed_at) = date('now') THEN 1 END) as today_quizzes,
        COUNT(CASE WHEN completed_at >= date('now','-7 days') THEN 1 END) as week_quizzes,
        ROUND(AVG(CASE WHEN completed_at >= date('now','-30 days') THEN percentage END),1) as month_avg
      FROM quiz_attempts WHERE user_id = ? AND status='completed'
    `).bind(user.id).first()
    const { results: subjectPerformance } = await c.env.DB.prepare(`
      SELECT q.subject_id, s.name as subject_name, COUNT(*) as attempts, ROUND(AVG(qa.percentage),1) as avg_score
      FROM quiz_attempts qa JOIN quizzes q ON qa.quiz_id=q.id LEFT JOIN subjects s ON q.subject_id=s.id
      WHERE qa.user_id=? AND qa.status='completed' AND q.subject_id IS NOT NULL
      GROUP BY q.subject_id ORDER BY avg_score ASC
    `).bind(user.id).all()
    const { results: studyHistory } = await c.env.DB.prepare(`
      SELECT sp.completion_percentage, sp.last_studied, sp.total_time_minutes, s.name as subject_name
      FROM study_progress sp JOIN subjects s ON sp.subject_id=s.id WHERE sp.user_id=? ORDER BY sp.last_studied DESC
    `).bind(user.id).all()
    return c.json({ weeklyProgress, subjectPerformance, studyHistory })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default analytics
