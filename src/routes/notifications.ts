import { Hono } from 'hono'
import { authMiddleware, adminMiddleware } from '../middleware/auth'

type Bindings = { DB: D1Database }
const notifications = new Hono<{ Bindings: Bindings }>()

notifications.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM notifications WHERE (user_id = ? OR user_id IS NULL) ORDER BY created_at DESC LIMIT 30`
    ).bind(user.id).all()
    const unread = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`
    ).bind(user.id).first<any>()
    return c.json({ notifications: results, unread_count: unread?.count || 0 })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

notifications.post('/:id/read', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const id = c.req.param('id')
    await c.env.DB.prepare(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND (user_id = ? OR user_id IS NULL)`
    ).bind(id, user.id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

notifications.post('/read-all', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    await c.env.DB.prepare(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ? OR user_id IS NULL`
    ).bind(user.id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

notifications.post('/', adminMiddleware, async (c) => {
  try {
    const { title, message, type, user_id, link } = await c.req.json()
    await c.env.DB.prepare(
      `INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`
    ).bind(user_id || null, title, message, type || 'info', link || null).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default notifications
