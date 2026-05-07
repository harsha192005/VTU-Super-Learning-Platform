import { Hono } from 'hono'
import { verifyJWT } from '../middleware/auth'

type Bindings = { DB: D1Database }
const announcements = new Hono<{ Bindings: Bindings }>()

announcements.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT a.*, u.name as author FROM announcements a LEFT JOIN users u ON a.created_by = u.id WHERE a.is_active=1 ORDER BY a.created_at DESC`
    ).all()
    return c.json({ announcements: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

announcements.post('/', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const { title, content, type, branch_code } = await c.req.json()
    if (!title || !content) return c.json({ error: 'Title and content required' }, 400)
    const result = await c.env.DB.prepare(
      `INSERT INTO announcements (title, content, type, branch_code, created_by) VALUES (?,?,?,?,?) RETURNING *`
    ).bind(title, content, type || 'general', branch_code || null, user.id).first()
    await c.env.DB.prepare(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (NULL, ?, ?, 'info')`
    ).bind('📢 ' + title, content.substring(0, 100)).run()
    return c.json({ success: true, announcement: result }, 201)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

announcements.delete('/:id', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    await c.env.DB.prepare(`UPDATE announcements SET is_active=0 WHERE id=?`).bind(c.req.param('id')).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default announcements
