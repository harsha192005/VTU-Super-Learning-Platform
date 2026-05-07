import { Hono } from 'hono'
import { verifyJWT } from '../middleware/auth'

type Bindings = { DB: D1Database }
const gamification = new Hono<{ Bindings: Bindings }>()

gamification.get('/leaderboard', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT id, name, branch, level, points, streak FROM users WHERE role='student' AND is_active=1 ORDER BY points DESC LIMIT 20`
    ).all()
    return c.json({ leaderboard: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

gamification.get('/badges', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`SELECT * FROM badges ORDER BY id`).all()
    return c.json({ badges: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

gamification.get('/my-stats', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    const badges = await c.env.DB.prepare(
      `SELECT b.* FROM user_badges ub JOIN badges b ON ub.badge_id = b.id WHERE ub.user_id = ?`
    ).bind(user.id).all()
    const rank = await c.env.DB.prepare(
      `SELECT COUNT(*)+1 as rank FROM users WHERE points > (SELECT points FROM users WHERE id=?) AND role='student'`
    ).bind(user.id).first<any>()
    return c.json({ badges_count: badges.results.length, badges: badges.results, rank: rank?.rank || 1 })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default gamification
