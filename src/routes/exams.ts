import { Hono } from 'hono'
import { adminMiddleware } from '../middleware/auth'

type Bindings = { DB: D1Database }
const exams = new Hono<{ Bindings: Bindings }>()

exams.get('/', async (c) => {
  try {
    const { branch } = c.req.query()
    let query = `SELECT *, CAST((julianday(exam_date) - julianday('now')) AS INTEGER) as days_left FROM exam_countdowns WHERE exam_date >= date('now') AND is_active = 1`
    const params: any[] = []
    if (branch) { query += ` AND (branch_code = ? OR branch_code IS NULL)`; params.push(branch) }
    query += ` ORDER BY exam_date ASC`
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ exams: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

exams.post('/', adminMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { title, branch_code, semester, exam_date, description } = await c.req.json()
    if (!title || !exam_date) return c.json({ error: 'Title and date required' }, 400)
    const result = await c.env.DB.prepare(
      `INSERT INTO exam_countdowns (title, branch_code, semester, exam_date, description, created_by) VALUES (?, ?, ?, ?, ?, ?) RETURNING *`
    ).bind(title, branch_code || null, semester || null, exam_date, description || '', user.id).first()
    return c.json({ success: true, exam: result }, 201)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

exams.delete('/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(`UPDATE exam_countdowns SET is_active = 0 WHERE id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default exams
