import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'

type Bindings = { DB: D1Database }
const gamification = new Hono<{ Bindings: Bindings }>()

gamification.get('/leaderboard', async (c) => {
  try {
    const { branch, limit = '20' } = c.req.query()
    let query = `SELECT u.id, u.name, u.branch, u.avatar, u.points, u.level, u.streak,
        COUNT(DISTINCT qa.id) as total_quizzes,
        ROUND(AVG(qa.percentage),1) as avg_score,
        COUNT(DISTINCT b.id) as total_bookmarks
      FROM users u 
      LEFT JOIN quiz_attempts qa ON u.id = qa.user_id AND qa.status = 'completed'
      LEFT JOIN bookmarks b ON u.id = b.user_id
      WHERE u.role = 'student' AND u.is_active = 1`
    const params: any[] = []
    if (branch) { query += ` AND u.branch = ?`; params.push(branch) }
    query += ` GROUP BY u.id ORDER BY u.points DESC LIMIT ?`
    params.push(parseInt(limit))
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ leaderboard: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

gamification.get('/badges', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`SELECT * FROM badges ORDER BY condition_value`).all()
    return c.json({ badges: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

gamification.get('/my-badges', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { results: earned } = await c.env.DB.prepare(
      `SELECT b.*, ub.earned_at FROM badges b JOIN user_badges ub ON b.id = ub.badge_id WHERE ub.user_id = ? ORDER BY ub.earned_at DESC`
    ).bind(user.id).all()
    const { results: all } = await c.env.DB.prepare(`SELECT * FROM badges ORDER BY condition_value`).all()
    const earnedIds = new Set(earned.map((b: any) => b.id))
    const locked = all.filter((b: any) => !earnedIds.has(b.id))
    return c.json({ earned, locked, total: all.length, earned_count: earned.length })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

gamification.post('/check-badges', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const profile = await c.env.DB.prepare(
      `SELECT points, streak FROM users WHERE id = ?`
    ).bind(user.id).first<any>()
    const quizStats = await c.env.DB.prepare(
      `SELECT COUNT(*) as total, MAX(percentage) as best FROM quiz_attempts WHERE user_id = ? AND status='completed'`
    ).bind(user.id).first<any>()
    const downloads = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM resource_analytics WHERE user_id = ? AND action = 'download'`
    ).bind(user.id).first<any>()
    const { results: allBadges } = await c.env.DB.prepare(`SELECT * FROM badges`).all<any>()
    const newlyEarned: any[] = []
    for (const badge of allBadges) {
      const alreadyEarned = await c.env.DB.prepare(
        `SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?`
      ).bind(user.id, badge.id).first()
      if (alreadyEarned) continue
      let earned = false
      if (badge.condition_type === 'points' && profile.points >= badge.condition_value) earned = true
      if (badge.condition_type === 'streak' && profile.streak >= badge.condition_value) earned = true
      if (badge.condition_type === 'downloads' && downloads.count >= badge.condition_value) earned = true
      if (badge.condition_type === 'quiz_score') {
        if (badge.condition_value === 100 && quizStats.best >= 100) earned = true
        else if (badge.condition_value === 90 && quizStats.best >= 90) earned = true
        else if (badge.condition_value === 1 && quizStats.total >= 1) earned = true
      }
      if (earned) {
        await c.env.DB.prepare(`INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)`).bind(user.id, badge.id).run()
        newlyEarned.push(badge)
      }
    }
    return c.json({ newly_earned: newlyEarned })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

gamification.get('/stats', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const profile = await c.env.DB.prepare(
      `SELECT points, level, streak FROM users WHERE id = ?`
    ).bind(user.id).first<any>()
    const nextLevelPoints = (profile.level) * 500
    const currentLevelPoints = (profile.level - 1) * 500
    const progress = Math.min(100, Math.round(((profile.points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100))
    const rank = await c.env.DB.prepare(
      `SELECT COUNT(*) + 1 as rank FROM users WHERE points > ? AND role = 'student'`
    ).bind(profile.points).first<any>()
    return c.json({
      points: profile.points,
      level: profile.level,
      streak: profile.streak,
      level_progress: progress,
      next_level_points: nextLevelPoints,
      rank: rank.rank
    })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default gamification
