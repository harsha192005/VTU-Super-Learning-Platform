import { Hono } from 'hono'
import { verifyJWT } from '../middleware/auth'

type Bindings = { DB: D1Database }
const subjects = new Hono<{ Bindings: Bindings }>()

subjects.get('/', async (c) => {
  try {
    const { branch, semester, limit = '100' } = c.req.query()
    let query = `SELECT * FROM subjects WHERE is_active=1`
    const params: any[] = []
    if (branch) { query += ` AND branch_code=?`; params.push(branch) }
    if (semester) { query += ` AND semester=?`; params.push(parseInt(semester)) }
    query += ` ORDER BY semester, name LIMIT ?`; params.push(parseInt(limit))
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ subjects: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

subjects.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const subject = await c.env.DB.prepare(`SELECT * FROM subjects WHERE id=? AND is_active=1`).bind(id).first()
    if (!subject) return c.json({ error: 'Subject not found' }, 404)
    const { results: resources } = await c.env.DB.prepare(
      `SELECT * FROM resources WHERE subject_id=? AND is_active=1 ORDER BY type, title`
    ).bind(id).all()
    return c.json({ subject, resources })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

subjects.post('/', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const { code, name, branch_code, semester, credits, description } = await c.req.json()
    if (!code || !name || !branch_code || !semester) return c.json({ error: 'Code, name, branch and semester required' }, 400)
    const result = await c.env.DB.prepare(
      `INSERT INTO subjects (code, name, branch_code, semester, credits, description) VALUES (?,?,?,?,?,?) RETURNING *`
    ).bind(code, name, branch_code, semester, credits || 4, description || null).first()
    return c.json({ success: true, subject: result }, 201)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default subjects
