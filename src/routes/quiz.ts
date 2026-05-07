import { Hono } from 'hono'
import { verifyJWT } from '../middleware/auth'

type Bindings = { DB: D1Database }
const quiz = new Hono<{ Bindings: Bindings }>()

quiz.get('/', async (c) => {
  try {
    const { branch, semester, limit = '20' } = c.req.query()
    let q = `SELECT q.*, s.name as subject_name FROM quizzes q LEFT JOIN subjects s ON q.subject_id = s.id WHERE q.is_active = 1`
    const params: any[] = []
    if (branch) { q += ` AND q.branch_code = ?`; params.push(branch) }
    if (semester) { q += ` AND q.semester = ?`; params.push(parseInt(semester)) }
    q += ` ORDER BY q.created_at DESC LIMIT ?`; params.push(parseInt(limit))
    const { results } = await c.env.DB.prepare(q).bind(...params).all()
    return c.json({ quizzes: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

quiz.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const quizData = await c.env.DB.prepare(`SELECT * FROM quizzes WHERE id = ? AND is_active = 1`).bind(id).first<any>()
    if (!quizData) return c.json({ error: 'Quiz not found' }, 404)
    const { results: questions } = await c.env.DB.prepare(`SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY id`).bind(id).all()
    return c.json({ quiz: quizData, questions })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

quiz.post('/', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const body = await c.req.json()
    const { title, description, branch_code, semester, duration_minutes, passing_score, difficulty, subject_id } = body
    if (!title) return c.json({ error: 'Title required' }, 400)
    const result = await c.env.DB.prepare(
      `INSERT INTO quizzes (title, description, branch_code, semester, duration_minutes, passing_score, difficulty, subject_id, created_by) VALUES (?,?,?,?,?,?,?,?,?) RETURNING *`
    ).bind(title, description || null, branch_code || 'CSE', semester || 1, duration_minutes || 20, passing_score || 60, difficulty || 'medium', subject_id || null, user.id).first()
    return c.json({ success: true, quiz: result }, 201)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

quiz.post('/:id/submit', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    const id = c.req.param('id')
    const { answers, time_taken } = await c.req.json()

    const quizData = await c.env.DB.prepare(`SELECT * FROM quizzes WHERE id = ?`).bind(id).first<any>()
    if (!quizData) return c.json({ error: 'Quiz not found' }, 404)

    const { results: questions } = await c.env.DB.prepare(`SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY id`).bind(id).all<any>()

    let score = 0
    const totalMarks = questions.length
    const detailedQ = questions.map((q: any, i: number) => {
      const userAns = (answers[i] || '').toLowerCase()
      const correct = q.correct_answer.toLowerCase()
      if (userAns === correct) score++
      return { ...q, user_answer: userAns }
    })

    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0
    const pointsEarned = percentage >= 90 ? 100 : percentage >= 75 ? 75 : percentage >= 60 ? 50 : 20

    const attempt = await c.env.DB.prepare(
      `INSERT INTO quiz_attempts (user_id, quiz_id, score, total_marks, percentage, time_taken, status, completed_at, answers) VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?) RETURNING *`
    ).bind(user.id, id, score, totalMarks, percentage, time_taken || 0, 'completed', JSON.stringify(answers)).first()

    // Award points
    await c.env.DB.prepare(`UPDATE users SET points = points + ? WHERE id = ?`).bind(pointsEarned, user.id).run()

    // Notification
    await c.env.DB.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Quiz Result 🎯', ?, 'quiz')`)
      .bind(user.id, `${quizData.title}: You scored ${percentage.toFixed(1)}% (${score}/${totalMarks})`).run()

    return c.json({ success: true, attempt: { ...attempt, points_earned: pointsEarned }, questions: detailedQ })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

quiz.get('/history/me', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    const { results } = await c.env.DB.prepare(
      `SELECT qa.*, q.title as quiz_title FROM quiz_attempts qa JOIN quizzes q ON qa.quiz_id = q.id WHERE qa.user_id = ? ORDER BY qa.completed_at DESC LIMIT 20`
    ).bind(user.id).all()
    return c.json({ history: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default quiz
