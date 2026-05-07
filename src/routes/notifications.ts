import { Hono } from 'hono'
import { verifyJWT } from '../middleware/auth'

type Bindings = { DB: D1Database }
const notifications = new Hono<{ Bindings: Bindings }>()

notifications.get('/', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM notifications WHERE (user_id = ? OR user_id IS NULL) ORDER BY created_at DESC LIMIT 30`
    ).bind(user.id).all()
    return c.json({ notifications: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

notifications.post('/read-all', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    await c.env.DB.prepare(`UPDATE notifications SET is_read=1 WHERE user_id=? OR user_id IS NULL`).bind(user.id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

notifications.post('/', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const { title, message, type, user_id } = await c.req.json()
    await c.env.DB.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)`)
      .bind(user_id || null, title, message, type || 'info').run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default notifications
