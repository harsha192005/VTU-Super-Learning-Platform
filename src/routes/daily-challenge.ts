import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'

type Bindings = { DB: D1Database }
const challenge = new Hono<{ Bindings: Bindings }>()

challenge.get('/today', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const today = new Date().toISOString().split('T')[0]
    const challengeData = await c.env.DB.prepare(
      `SELECT dc.*, EXISTS(SELECT 1 FROM challenge_completions cc WHERE cc.challenge_id = dc.id AND cc.user_id = ?) as completed
       FROM daily_challenges dc WHERE dc.challenge_date = ? LIMIT 1`
    ).bind(user.id, today).first<any>()
    if (!challengeData) {
      // Auto-generate today's challenge
      const generated = await c.env.DB.prepare(
        `INSERT INTO daily_challenges (challenge_date, title, type, content, points_reward) VALUES (?, ?, 'mcq', ?, 75) RETURNING *`
      ).bind(today, "Today's VTU Challenge", JSON.stringify({
        question: "Which data structure follows FIFO (First In First Out) principle?",
        options: ["Stack", "Queue", "Tree", "Graph"],
        correct: 1,
        explanation: "Queue follows FIFO - the first element added is the first one to be removed, like a real-world queue."
      })).first()
      return c.json({ challenge: { ...generated, completed: false } })
    }
    challengeData.content = JSON.parse(challengeData.content || '{}')
    return c.json({ challenge: { ...challengeData, completed: !!challengeData.completed } })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

challenge.post('/complete', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { challenge_id, answer } = await c.req.json()
    const challengeData = await c.env.DB.prepare(`SELECT * FROM daily_challenges WHERE id = ?`).bind(challenge_id).first<any>()
    if (!challengeData) return c.json({ error: 'Challenge not found' }, 404)
    const alreadyCompleted = await c.env.DB.prepare(
      `SELECT id FROM challenge_completions WHERE user_id = ? AND challenge_id = ?`
    ).bind(user.id, challenge_id).first()
    if (alreadyCompleted) return c.json({ error: 'Already completed today\'s challenge', already_done: true }, 400)
    const content = JSON.parse(challengeData.content)
    const isCorrect = answer === content.correct
    const pointsEarned = isCorrect ? challengeData.points_reward : Math.floor(challengeData.points_reward / 4)
    await c.env.DB.prepare(
      `INSERT INTO challenge_completions (user_id, challenge_id, points_earned) VALUES (?, ?, ?)`
    ).bind(user.id, challenge_id, pointsEarned).run()
    await c.env.DB.prepare(`UPDATE users SET points = points + ?, streak = streak + 1 WHERE id = ?`).bind(pointsEarned, user.id).run()
    return c.json({ success: true, is_correct: isCorrect, points_earned: pointsEarned, explanation: content.explanation })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

challenge.get('/history', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { results } = await c.env.DB.prepare(
      `SELECT cc.*, dc.title, dc.type, dc.points_reward FROM challenge_completions cc JOIN daily_challenges dc ON cc.challenge_id = dc.id WHERE cc.user_id = ? ORDER BY cc.completed_at DESC LIMIT 30`
    ).bind(user.id).all()
    return c.json({ history: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default challenge
