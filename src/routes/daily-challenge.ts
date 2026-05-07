import { Hono } from 'hono'
import { verifyJWT } from '../middleware/auth'

type Bindings = { DB: D1Database }
const challenge = new Hono<{ Bindings: Bindings }>()

challenge.get('/today', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const ch = await c.env.DB.prepare(`SELECT * FROM daily_challenges WHERE challenge_date = ?`).bind(today).first<any>()
    if (!ch) return c.json({ challenge: null })
    let content = ch.content
    try { content = JSON.parse(ch.content) } catch(e) {}
    return c.json({ challenge: { ...ch, content } })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

challenge.post('/complete', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    const today = new Date().toISOString().split('T')[0]
    const ch = await c.env.DB.prepare(`SELECT * FROM daily_challenges WHERE challenge_date = ?`).bind(today).first<any>()
    if (!ch) return c.json({ error: 'No challenge today' }, 404)
    const existing = await c.env.DB.prepare(`SELECT id FROM challenge_completions WHERE user_id=? AND challenge_id=?`).bind(user.id, ch.id).first()
    if (existing) return c.json({ already_completed: true, message: 'Already completed today!' })
    await c.env.DB.prepare(`INSERT INTO challenge_completions (user_id, challenge_id, points_earned) VALUES (?,?,?)`).bind(user.id, ch.id, ch.points_reward).run()
    await c.env.DB.prepare(`UPDATE users SET points=points+?, streak=streak+1 WHERE id=?`).bind(ch.points_reward, user.id).run()
    return c.json({ success: true, points_earned: ch.points_reward })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default challenge
