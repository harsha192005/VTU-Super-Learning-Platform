import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'

type Bindings = { DB: D1Database }
const subjects = new Hono<{ Bindings: Bindings }>()

subjects.get('/', async (c) => {
  try {
    const { branch, semester, search } = c.req.query()
    let query = `SELECT s.*, b.name as branch_name FROM subjects s JOIN branches b ON s.branch_code = b.code WHERE s.is_active = 1`
    const params: any[] = []
    if (branch) { query += ` AND s.branch_code = ?`; params.push(branch) }
    if (semester) { query += ` AND s.semester = ?`; params.push(parseInt(semester)) }
    if (search) { query += ` AND (s.name LIKE ? OR s.code LIKE ?)`; params.push(`%${search}%`, `%${search}%`) }
    query += ` ORDER BY s.semester, s.name`
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ subjects: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

subjects.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const subject = await c.env.DB.prepare(
      `SELECT s.*, b.name as branch_name, b.icon as branch_icon FROM subjects s JOIN branches b ON s.branch_code = b.code WHERE s.id = ?`
    ).bind(id).first()
    if (!subject) return c.json({ error: 'Subject not found' }, 404)
    const { results: resources } = await c.env.DB.prepare(
      `SELECT * FROM resources WHERE subject_id = ? AND is_active = 1 ORDER BY type, created_at DESC`
    ).bind(id).all()
    const { results: quizzes } = await c.env.DB.prepare(
      `SELECT q.*, COUNT(qq.id) as question_count FROM quizzes q LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id WHERE q.subject_id = ? AND q.is_active = 1 GROUP BY q.id`
    ).bind(id).all()
    return c.json({ subject, resources, quizzes })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

subjects.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    if (user?.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const { code, name, branch_code, semester, credits, description } = await c.req.json()
    if (!code || !name || !branch_code || !semester) return c.json({ error: 'Required fields missing' }, 400)
    const result = await c.env.DB.prepare(
      `INSERT INTO subjects (code, name, branch_code, semester, credits, description) VALUES (?, ?, ?, ?, ?, ?) RETURNING *`
    ).bind(code, name, branch_code, parseInt(semester), credits || 4, description || '').first()
    return c.json({ success: true, subject: result }, 201)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

subjects.put('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    if (user?.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const id = c.req.param('id')
    const { name, credits, description } = await c.req.json()
    await c.env.DB.prepare(`UPDATE subjects SET name = ?, credits = ?, description = ? WHERE id = ?`).bind(name, credits, description, id).run()
    const updated = await c.env.DB.prepare(`SELECT * FROM subjects WHERE id = ?`).bind(id).first()
    return c.json({ success: true, subject: updated })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default subjects
