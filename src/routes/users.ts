import { Hono } from 'hono'
import { authMiddleware, adminMiddleware, hashPassword } from '../middleware/auth'

type Bindings = { DB: D1Database }
const users = new Hono<{ Bindings: Bindings }>()

users.get('/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const profile = await c.env.DB.prepare(
      `SELECT id, name, email, role, branch, semester, points, level, streak, avatar, bio, last_active, created_at FROM users WHERE id = ?`
    ).bind(user.id).first()
    if (!profile) return c.json({ error: 'User not found' }, 404)
    const { results: badges } = await c.env.DB.prepare(
      `SELECT b.*, ub.earned_at FROM badges b JOIN user_badges ub ON b.id = ub.badge_id WHERE ub.user_id = ?`
    ).bind(user.id).all()
    const quizStats = await c.env.DB.prepare(
      `SELECT COUNT(*) as total_quizzes, ROUND(AVG(percentage),1) as avg_score, MAX(percentage) as best_score FROM quiz_attempts WHERE user_id = ? AND status = 'completed'`
    ).bind(user.id).first()
    const { results: recentActivity } = await c.env.DB.prepare(
      `SELECT qa.*, q.title as quiz_title FROM quiz_attempts qa JOIN quizzes q ON qa.quiz_id = q.id WHERE qa.user_id = ? ORDER BY qa.completed_at DESC LIMIT 5`
    ).bind(user.id).all()
    return c.json({ profile, badges, quizStats, recentActivity })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

users.put('/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { name, bio, branch, semester, avatar } = await c.req.json()
    await c.env.DB.prepare(
      `UPDATE users SET name = ?, bio = ?, branch = ?, semester = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(name, bio || '', branch, semester ? parseInt(semester) : 1, avatar || null, user.id).run()
    const updated = await c.env.DB.prepare(
      `SELECT id, name, email, role, branch, semester, points, level, streak, avatar, bio FROM users WHERE id = ?`
    ).bind(user.id).first()
    return c.json({ success: true, user: updated })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

users.put('/password', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { current_password, new_password } = await c.req.json()
    if (!current_password || !new_password) return c.json({ error: 'Both passwords required' }, 400)
    if (new_password.length < 6) return c.json({ error: 'New password must be at least 6 characters' }, 400)
    const dbUser = await c.env.DB.prepare(`SELECT password_hash FROM users WHERE id = ?`).bind(user.id).first<any>()
    const { comparePassword } = await import('../middleware/auth')
    const valid = await comparePassword(current_password, dbUser.password_hash)
    if (!valid) return c.json({ error: 'Current password is incorrect' }, 401)
    const newHash = await hashPassword(new_password)
    await c.env.DB.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).bind(newHash, user.id).run()
    return c.json({ success: true, message: 'Password updated successfully' })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

users.get('/dashboard', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const profile = await c.env.DB.prepare(
      `SELECT id, name, branch, semester, points, level, streak, avatar FROM users WHERE id = ?`
    ).bind(user.id).first<any>()
    const quizStats = await c.env.DB.prepare(
      `SELECT COUNT(*) as total, ROUND(AVG(percentage),1) as avg_score, SUM(CASE WHEN percentage >= 70 THEN 1 ELSE 0 END) as passed FROM quiz_attempts WHERE user_id = ? AND status = 'completed'`
    ).bind(user.id).first()
    const { results: progress } = await c.env.DB.prepare(
      `SELECT sp.*, s.name as subject_name, s.semester FROM study_progress sp JOIN subjects s ON sp.subject_id = s.id WHERE sp.user_id = ? ORDER BY sp.updated_at DESC LIMIT 5`
    ).bind(user.id).all()
    const { results: recentQuizzes } = await c.env.DB.prepare(
      `SELECT qa.*, q.title, q.difficulty FROM quiz_attempts qa JOIN quizzes q ON qa.quiz_id = q.id WHERE qa.user_id = ? ORDER BY qa.completed_at DESC LIMIT 5`
    ).bind(user.id).all()
    const { results: notifications } = await c.env.DB.prepare(
      `SELECT * FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0 ORDER BY created_at DESC LIMIT 5`
    ).bind(user.id).all()
    const { results: bookmarks } = await c.env.DB.prepare(
      `SELECT r.id, r.title, r.type, b.created_at as bookmarked_at FROM resources r JOIN bookmarks b ON r.id = b.resource_id WHERE b.user_id = ? ORDER BY b.created_at DESC LIMIT 5`
    ).bind(user.id).all()
    const todayChallenge = await c.env.DB.prepare(
      `SELECT dc.*, EXISTS(SELECT 1 FROM challenge_completions cc WHERE cc.challenge_id = dc.id AND cc.user_id = ?) as completed FROM daily_challenges dc WHERE dc.challenge_date = date('now') LIMIT 1`
    ).bind(user.id).first()
    const { results: exams } = await c.env.DB.prepare(
      `SELECT *, CAST((julianday(exam_date) - julianday('now')) AS INTEGER) as days_left FROM exam_countdowns WHERE exam_date >= date('now') AND (branch_code = ? OR branch_code IS NULL) AND is_active = 1 ORDER BY exam_date LIMIT 3`
    ).bind(profile?.branch || '').all()
    const { results: announcements } = await c.env.DB.prepare(
      `SELECT * FROM announcements WHERE is_active = 1 ORDER BY created_at DESC LIMIT 3`
    ).bind().all()
    return c.json({ profile, quizStats, progress, recentQuizzes, notifications, bookmarks, todayChallenge, exams, announcements })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

users.get('/progress', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { results } = await c.env.DB.prepare(
      `SELECT sp.*, s.name as subject_name, s.code, s.semester, s.credits FROM study_progress sp JOIN subjects s ON sp.subject_id = s.id WHERE sp.user_id = ? ORDER BY s.semester, s.name`
    ).bind(user.id).all()
    return c.json({ progress: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

users.post('/progress', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { subject_id, completion_percentage, topics_completed, time_spent_minutes } = await c.req.json()
    const existing = await c.env.DB.prepare(`SELECT id, total_time_minutes FROM study_progress WHERE user_id = ? AND subject_id = ?`).bind(user.id, subject_id).first<any>()
    if (existing) {
      await c.env.DB.prepare(
        `UPDATE study_progress SET completion_percentage = ?, topics_completed = ?, last_studied = CURRENT_TIMESTAMP, total_time_minutes = total_time_minutes + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(completion_percentage, topics_completed ? JSON.stringify(topics_completed) : '[]', time_spent_minutes || 0, existing.id).run()
    } else {
      await c.env.DB.prepare(
        `INSERT INTO study_progress (user_id, subject_id, completion_percentage, topics_completed, last_studied, total_time_minutes) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`
      ).bind(user.id, subject_id, completion_percentage, topics_completed ? JSON.stringify(topics_completed) : '[]', time_spent_minutes || 0).run()
    }
    await c.env.DB.prepare(`UPDATE users SET points = points + 10 WHERE id = ?`).bind(user.id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

// Admin: Get all users
users.get('/', adminMiddleware, async (c) => {
  try {
    const { role, branch, search, limit = '20', offset = '0' } = c.req.query()
    let query = `SELECT id, name, email, role, branch, semester, points, level, streak, is_active, created_at FROM users WHERE 1=1`
    const params: any[] = []
    if (role) { query += ` AND role = ?`; params.push(role) }
    if (branch) { query += ` AND branch = ?`; params.push(branch) }
    if (search) { query += ` AND (name LIKE ? OR email LIKE ?)`; params.push(`%${search}%`, `%${search}%`) }
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
    params.push(parseInt(limit), parseInt(offset))
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    const total = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`).first<any>()
    return c.json({ users: results, total: total?.count || 0 })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

users.patch('/:id/toggle', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const user = await c.env.DB.prepare(`SELECT id, is_active FROM users WHERE id = ?`).bind(id).first<any>()
    if (!user) return c.json({ error: 'User not found' }, 404)
    await c.env.DB.prepare(`UPDATE users SET is_active = ? WHERE id = ?`).bind(user.is_active ? 0 : 1, id).run()
    return c.json({ success: true, is_active: !user.is_active })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default users
