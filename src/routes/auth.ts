import { Hono } from 'hono'
import { signJWT, hashPassword, comparePassword } from '../middleware/auth'

type Bindings = { DB: D1Database }
const auth = new Hono<{ Bindings: Bindings }>()

auth.post('/register', async (c) => {
  try {
    const { name, email, password, branch, semester } = await c.req.json()
    if (!name || !email || !password) return c.json({ error: 'Name, email and password required' }, 400)
    if (password.length < 6) return c.json({ error: 'Password must be at least 6 characters' }, 400)
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
    if (existing) return c.json({ error: 'Email already registered' }, 409)
    const passwordHash = await hashPassword(password)
    const result = await c.env.DB.prepare(
      `INSERT INTO users (name, email, password_hash, role, branch, semester) VALUES (?, ?, ?, 'student', ?, ?) RETURNING id, name, email, role, branch, semester, points, level, streak, created_at`
    ).bind(name, email, passwordHash, branch || 'CSE', semester || 1).first<any>()
    const token = await signJWT({ id: result.id, email: result.email, role: result.role, name: result.name }, 'vtu-super-platform-secret-2024')
    // Add welcome notification
    await c.env.DB.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Welcome to VTU Platform! 🎓', 'Start your learning journey. Explore subjects, take quizzes, and use the AI assistant!', 'success')`).bind(result.id).run()
    return c.json({ success: true, token, user: result }, 201)
  } catch (e: any) {
    return c.json({ error: e.message || 'Registration failed' }, 500)
  }
})

auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    if (!email || !password) return c.json({ error: 'Email and password required' }, 400)
    const user = await c.env.DB.prepare(
      `SELECT id, name, email, password_hash, role, branch, semester, points, level, streak, avatar, is_active FROM users WHERE email = ?`
    ).bind(email).first<any>()
    if (!user) return c.json({ error: 'Invalid email or password' }, 401)
    if (!user.is_active) return c.json({ error: 'Account is deactivated' }, 403)
    const valid = await comparePassword(password, user.password_hash)
    if (!valid) return c.json({ error: 'Invalid email or password' }, 401)
    // Update last active & streak
    const today = new Date().toISOString().split('T')[0]
    await c.env.DB.prepare(`UPDATE users SET last_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(today, user.id).run()
    const token = await signJWT({ id: user.id, email: user.email, role: user.role, name: user.name }, 'vtu-super-platform-secret-2024')
    const { password_hash, ...safeUser } = user
    return c.json({ success: true, token, user: safeUser })
  } catch (e: any) {
    return c.json({ error: e.message || 'Login failed' }, 500)
  }
})

// Demo login for quick access
auth.post('/demo-login', async (c) => {
  try {
    const { role } = await c.req.json()
    const email = role === 'admin' ? 'admin@vtu.edu.in' : 'rahul@student.vtu.ac.in'
    const user = await c.env.DB.prepare(
      `SELECT id, name, email, role, branch, semester, points, level, streak, avatar FROM users WHERE email = ?`
    ).bind(email).first<any>()
    if (!user) return c.json({ error: 'Demo user not found. Please seed the database.' }, 404)
    const token = await signJWT({ id: user.id, email: user.email, role: user.role, name: user.name }, 'vtu-super-platform-secret-2024')
    return c.json({ success: true, token, user })
  } catch (e: any) {
    return c.json({ error: e.message || 'Demo login failed' }, 500)
  }
})

auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { verifyJWT } = await import('../middleware/auth')
    const payload = await verifyJWT(authHeader.slice(7))
    const user = await c.env.DB.prepare(
      `SELECT id, name, email, role, branch, semester, points, level, streak, avatar, bio, last_active, created_at FROM users WHERE id = ?`
    ).bind(payload.id).first<any>()
    if (!user) return c.json({ error: 'User not found' }, 404)
    return c.json({ user })
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

export default auth
