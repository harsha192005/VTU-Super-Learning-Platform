import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'

type Bindings = { DB: D1Database }
const quiz = new Hono<{ Bindings: Bindings }>()

quiz.get('/', async (c) => {
  try {
    const { branch, semester, subject_id, difficulty } = c.req.query()
    let query = `SELECT q.*, s.name as subject_name, COUNT(qq.id) as question_count FROM quizzes q LEFT JOIN subjects s ON q.subject_id = s.id LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id WHERE q.is_active = 1`
    const params: any[] = []
    if (branch) { query += ` AND q.branch_code = ?`; params.push(branch) }
    if (semester) { query += ` AND q.semester = ?`; params.push(parseInt(semester)) }
    if (subject_id) { query += ` AND q.subject_id = ?`; params.push(parseInt(subject_id)) }
    if (difficulty) { query += ` AND q.difficulty = ?`; params.push(difficulty) }
    query += ` GROUP BY q.id ORDER BY q.created_at DESC`
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ quizzes: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

quiz.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const quizData = await c.env.DB.prepare(`SELECT q.*, s.name as subject_name FROM quizzes q LEFT JOIN subjects s ON q.subject_id = s.id WHERE q.id = ? AND q.is_active = 1`).bind(id).first()
    if (!quizData) return c.json({ error: 'Quiz not found' }, 404)
    const { results: questions } = await c.env.DB.prepare(`SELECT id, question, option_a, option_b, option_c, option_d, marks FROM quiz_questions WHERE quiz_id = ? ORDER BY id`).bind(id).all()
    return c.json({ quiz: quizData, questions })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

quiz.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    if (user?.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const { title, description, subject_id, branch_code, semester, duration_minutes, passing_score, difficulty, questions } = await c.req.json()
    if (!title || !questions?.length) return c.json({ error: 'Title and questions required' }, 400)
    const quizResult = await c.env.DB.prepare(
      `INSERT INTO quizzes (title, description, subject_id, branch_code, semester, duration_minutes, total_questions, passing_score, difficulty, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
    ).bind(title, description || '', subject_id || null, branch_code || null, semester || null, duration_minutes || 30, questions.length, passing_score || 60, difficulty || 'medium', user.id).first<any>()
    for (const q of questions) {
      await c.env.DB.prepare(
        `INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(quizResult.id, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation || '', q.marks || 1).run()
    }
    return c.json({ success: true, quiz: quizResult }, 201)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

quiz.post('/:id/submit', authMiddleware, async (c) => {
  try {
    const quizId = c.req.param('id')
    const user = c.get('user')
    const { answers, time_taken } = await c.req.json()
    const { results: questions } = await c.env.DB.prepare(
      `SELECT id, correct_answer, marks FROM quiz_questions WHERE quiz_id = ?`
    ).bind(quizId).all<any>()
    let score = 0
    let totalMarks = 0
    const detailedAnswers: any[] = []
    for (const q of questions) {
      totalMarks += q.marks
      const userAnswer = answers[q.id]
      const isCorrect = userAnswer?.toLowerCase() === q.correct_answer.toLowerCase()
      if (isCorrect) score += q.marks
      detailedAnswers.push({ question_id: q.id, user_answer: userAnswer, correct_answer: q.correct_answer, is_correct: isCorrect })
    }
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0
    const attempt = await c.env.DB.prepare(
      `INSERT INTO quiz_attempts (user_id, quiz_id, score, total_marks, percentage, time_taken, answers, status, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP) RETURNING *`
    ).bind(user.id, quizId, score, totalMarks, percentage, time_taken || 0, JSON.stringify(detailedAnswers)).first<any>()
    // Award points based on performance
    const points = percentage >= 90 ? 100 : percentage >= 70 ? 60 : percentage >= 50 ? 30 : 10
    await c.env.DB.prepare(`UPDATE users SET points = points + ? WHERE id = ?`).bind(points, user.id).run()
    // Check level up
    const updatedUser = await c.env.DB.prepare(`SELECT points FROM users WHERE id = ?`).bind(user.id).first<any>()
    const newLevel = Math.floor(updatedUser.points / 500) + 1
    await c.env.DB.prepare(`UPDATE users SET level = ? WHERE id = ?`).bind(Math.min(newLevel, 10), user.id).run()
    // Get correct answers for review
    const { results: fullQuestions } = await c.env.DB.prepare(
      `SELECT id, question, option_a, option_b, option_c, option_d, correct_answer, explanation FROM quiz_questions WHERE quiz_id = ?`
    ).bind(quizId).all()
    return c.json({ success: true, attempt, score, totalMarks, percentage, points_earned: points, answers: detailedAnswers, questions: fullQuestions })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

quiz.get('/attempts/my', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { results } = await c.env.DB.prepare(
      `SELECT qa.*, q.title as quiz_title, q.difficulty, s.name as subject_name FROM quiz_attempts qa JOIN quizzes q ON qa.quiz_id = q.id LEFT JOIN subjects s ON q.subject_id = s.id WHERE qa.user_id = ? ORDER BY qa.completed_at DESC LIMIT 20`
    ).bind(user.id).all()
    return c.json({ attempts: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

quiz.get('/leaderboard/global', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT u.id, u.name, u.branch, u.avatar, u.points, u.level, u.streak,
        COUNT(qa.id) as total_quizzes, ROUND(AVG(qa.percentage), 1) as avg_score
       FROM users u LEFT JOIN quiz_attempts qa ON u.id = qa.user_id AND qa.status = 'completed'
       WHERE u.role = 'student' AND u.is_active = 1
       GROUP BY u.id ORDER BY u.points DESC LIMIT 20`
    ).all()
    return c.json({ leaderboard: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

quiz.delete('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    if (user?.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const id = c.req.param('id')
    await c.env.DB.prepare(`UPDATE quizzes SET is_active = 0 WHERE id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default quiz
