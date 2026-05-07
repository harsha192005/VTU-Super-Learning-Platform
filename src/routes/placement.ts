import { Hono } from 'hono'
import { verifyJWT } from '../middleware/auth'

type Bindings = { DB: D1Database }
const placement = new Hono<{ Bindings: Bindings }>()

placement.get('/', async (c) => {
  try {
    const { category, difficulty, company, limit = '30' } = c.req.query()
    let query = `SELECT * FROM placement_questions WHERE 1=1`
    const params: any[] = []
    if (category) { query += ` AND category = ?`; params.push(category) }
    if (difficulty) { query += ` AND difficulty = ?`; params.push(difficulty) }
    if (company) { query += ` AND company = ?`; params.push(company) }
    query += ` ORDER BY RANDOM() LIMIT ?`; params.push(parseInt(limit))
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ questions: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

placement.post('/', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const { question, answer, category, company, difficulty, tags } = await c.req.json()
    if (!question || !category) return c.json({ error: 'Question and category required' }, 400)
    const result = await c.env.DB.prepare(
      `INSERT INTO placement_questions (question, answer, category, company, difficulty, tags) VALUES (?,?,?,?,?,?) RETURNING *`
    ).bind(question, answer || null, category, company || null, difficulty || 'medium', JSON.stringify(tags || [])).first()
    return c.json({ success: true, question: result }, 201)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default placement
