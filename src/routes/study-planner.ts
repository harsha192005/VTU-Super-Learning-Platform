import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'

type Bindings = { DB: D1Database }
const planner = new Hono<{ Bindings: Bindings }>()

planner.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { date, status } = c.req.query()
    let query = `SELECT sp.*, s.name as subject_name FROM study_plans sp LEFT JOIN subjects s ON sp.subject_id = s.id WHERE sp.user_id = ?`
    const params: any[] = [user.id]
    if (date) { query += ` AND sp.scheduled_date = ?`; params.push(date) }
    if (status) { query += ` AND sp.status = ?`; params.push(status) }
    query += ` ORDER BY sp.scheduled_date ASC, sp.priority DESC`
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ plans: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

planner.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { title, subject_id, description, scheduled_date, duration_minutes, priority } = await c.req.json()
    if (!title || !scheduled_date) return c.json({ error: 'Title and date required' }, 400)
    const result = await c.env.DB.prepare(
      `INSERT INTO study_plans (user_id, title, subject_id, description, scheduled_date, duration_minutes, priority) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`
    ).bind(user.id, title, subject_id || null, description || '', scheduled_date, duration_minutes || 60, priority || 'medium').first()
    return c.json({ success: true, plan: result }, 201)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

planner.put('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const id = c.req.param('id')
    const { title, description, scheduled_date, duration_minutes, status, priority } = await c.req.json()
    await c.env.DB.prepare(
      `UPDATE study_plans SET title = ?, description = ?, scheduled_date = ?, duration_minutes = ?, status = ?, priority = ? WHERE id = ? AND user_id = ?`
    ).bind(title, description || '', scheduled_date, duration_minutes || 60, status || 'pending', priority || 'medium', id, user.id).run()
    if (status === 'completed') {
      await c.env.DB.prepare(`UPDATE users SET points = points + 20 WHERE id = ?`).bind(user.id).run()
    }
    const updated = await c.env.DB.prepare(`SELECT * FROM study_plans WHERE id = ?`).bind(id).first()
    return c.json({ success: true, plan: updated })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

planner.delete('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const id = c.req.param('id')
    await c.env.DB.prepare(`DELETE FROM study_plans WHERE id = ? AND user_id = ?`).bind(id, user.id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

planner.get('/summary', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const summary = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' AND scheduled_date < date('now') THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN scheduled_date = date('now') THEN 1 ELSE 0 END) as today,
        SUM(duration_minutes) as total_minutes_planned
      FROM study_plans WHERE user_id = ?
    `).bind(user.id).first()
    return c.json({ summary })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default planner
