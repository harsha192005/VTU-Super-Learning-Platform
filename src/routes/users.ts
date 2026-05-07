import { Hono } from 'hono'
import { verifyJWT } from '../middleware/auth'

type Bindings = { DB: D1Database }
const users = new Hono<{ Bindings: Bindings }>()

users.get('/', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const { limit = '50' } = c.req.query()
    const { results } = await c.env.DB.prepare(
      `SELECT id, name, email, role, branch, semester, points, level, streak, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ?`
    ).bind(parseInt(limit)).all()
    return c.json({ users: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

users.put('/profile', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    const { name, bio, branch, semester } = await c.req.json()
    await c.env.DB.prepare(
      `UPDATE users SET name=?, bio=?, branch=?, semester=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
    ).bind(name || user.name, bio || null, branch || user.branch, semester || user.semester, user.id).run()
    const updated = await c.env.DB.prepare(`SELECT id,name,email,role,branch,semester,bio,points,level,streak FROM users WHERE id=?`).bind(user.id).first()
    return c.json({ success: true, user: updated })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

users.patch('/:id/toggle', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const admin = await verifyJWT(auth.slice(7))
    if (admin.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const id = c.req.param('id')
    const { is_active } = await c.req.json()
    await c.env.DB.prepare(`UPDATE users SET is_active=? WHERE id=?`).bind(is_active, id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

users.get('/bookmarks', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    const { results } = await c.env.DB.prepare(
      `SELECT r.* FROM bookmarks b JOIN resources r ON b.resource_id = r.id WHERE b.user_id = ? ORDER BY b.created_at DESC`
    ).bind(user.id).all()
    return c.json({ bookmarks: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default users
