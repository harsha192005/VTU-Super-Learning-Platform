import { Hono } from 'hono'
import { verifyJWT } from '../middleware/auth'

type Bindings = { DB: D1Database }
const exams = new Hono<{ Bindings: Bindings }>()

exams.get('/', async (c) => {
  try {
    const { limit = '10' } = c.req.query()
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM exam_countdowns WHERE is_active=1 AND exam_date >= date('now') ORDER BY exam_date ASC LIMIT ?`
    ).bind(parseInt(limit)).all()
    return c.json({ exams: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

exams.post('/', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const { title, branch_code, semester, exam_date, description } = await c.req.json()
    if (!title || !exam_date) return c.json({ error: 'Title and date required' }, 400)
    const result = await c.env.DB.prepare(
      `INSERT INTO exam_countdowns (title, branch_code, semester, exam_date, description, created_by) VALUES (?,?,?,?,?,?) RETURNING *`
    ).bind(title, branch_code || null, semester || null, exam_date, description || null, user.id).first()
    return c.json({ success: true, exam: result }, 201)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

exams.delete('/:id', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    await c.env.DB.prepare(`UPDATE exam_countdowns SET is_active=0 WHERE id=?`).bind(c.req.param('id')).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default exams
