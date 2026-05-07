import { Hono } from 'hono'
import { adminMiddleware } from '../middleware/auth'

type Bindings = { DB: D1Database }
const announcements = new Hono<{ Bindings: Bindings }>()

announcements.get('/', async (c) => {
  try {
    const { type, branch } = c.req.query()
    let query = `SELECT a.*, u.name as author_name FROM announcements a LEFT JOIN users u ON a.created_by = u.id WHERE a.is_active = 1`
    const params: any[] = []
    if (type) { query += ` AND a.type = ?`; params.push(type) }
    if (branch) { query += ` AND (a.branch_code = ? OR a.branch_code IS NULL)`; params.push(branch) }
    query += ` ORDER BY a.created_at DESC LIMIT 20`
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ announcements: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

announcements.post('/', adminMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { title, content, type, branch_code } = await c.req.json()
    if (!title || !content) return c.json({ error: 'Title and content required' }, 400)
    const result = await c.env.DB.prepare(
      `INSERT INTO announcements (title, content, type, branch_code, created_by) VALUES (?, ?, ?, ?, ?) RETURNING *`
    ).bind(title, content, type || 'general', branch_code || null, user.id).first()
    return c.json({ success: true, announcement: result }, 201)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

announcements.delete('/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(`UPDATE announcements SET is_active = 0 WHERE id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default announcements
