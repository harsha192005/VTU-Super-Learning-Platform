import { Hono } from 'hono'
import { verifyJWT } from '../middleware/auth'

type Bindings = { DB: D1Database }
const planner = new Hono<{ Bindings: Bindings }>()

planner.get('/', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    const { results } = await c.env.DB.prepare(
      `SELECT sp.*, s.name as subject_name FROM study_plans sp LEFT JOIN subjects s ON sp.subject_id = s.id WHERE sp.user_id = ? ORDER BY sp.scheduled_date ASC`
    ).bind(user.id).all()
    return c.json({ plans: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

planner.post('/', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    const { title, description, subject_id, scheduled_date, duration_minutes, priority } = await c.req.json()
    if (!title || !scheduled_date) return c.json({ error: 'Title and date required' }, 400)
    const result = await c.env.DB.prepare(
      `INSERT INTO study_plans (user_id, title, description, subject_id, scheduled_date, duration_minutes, priority) VALUES (?,?,?,?,?,?,?) RETURNING *`
    ).bind(user.id, title, description || null, subject_id || null, scheduled_date, duration_minutes || 60, priority || 'medium').first()
    return c.json({ success: true, plan: result }, 201)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

planner.patch('/:id', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    const id = c.req.param('id')
    const { status } = await c.req.json()
    await c.env.DB.prepare(`UPDATE study_plans SET status=? WHERE id=? AND user_id=?`).bind(status, id, user.id).run()
    if (status === 'completed') {
      await c.env.DB.prepare(`UPDATE users SET points = points + 25 WHERE id=?`).bind(user.id).run()
    }
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

planner.delete('/:id', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    const id = c.req.param('id')
    await c.env.DB.prepare(`DELETE FROM study_plans WHERE id=? AND user_id=?`).bind(id, user.id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default planner
