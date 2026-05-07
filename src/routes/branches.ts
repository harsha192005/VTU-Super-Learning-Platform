import { Hono } from 'hono'

type Bindings = { DB: D1Database }
const branches = new Hono<{ Bindings: Bindings }>()

branches.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`SELECT * FROM branches WHERE is_active = 1 ORDER BY category, name`).all()
    // Group by category
    const grouped: Record<string, any[]> = {}
    for (const b of results) {
      const cat = (b as any).category
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(b)
    }
    return c.json({ branches: results, grouped })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

branches.get('/:code', async (c) => {
  try {
    const code = c.req.param('code')
    const branch = await c.env.DB.prepare(`SELECT * FROM branches WHERE code = ?`).bind(code).first()
    if (!branch) return c.json({ error: 'Branch not found' }, 404)
    const { results: subjects } = await c.env.DB.prepare(
      `SELECT * FROM subjects WHERE branch_code = ? AND is_active = 1 ORDER BY semester, name`
    ).bind(code).all()
    // Group by semester
    const bySemester: Record<number, any[]> = {}
    for (const s of subjects) {
      const sem = (s as any).semester
      if (!bySemester[sem]) bySemester[sem] = []
      bySemester[sem].push(s)
    }
    return c.json({ branch, subjects, bySemester })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

branches.get('/:code/stats', async (c) => {
  try {
    const code = c.req.param('code')
    const stats = await c.env.DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM subjects WHERE branch_code = ? AND is_active = 1) as total_subjects,
        (SELECT COUNT(*) FROM resources WHERE branch_code = ? AND is_active = 1) as total_resources,
        (SELECT COUNT(*) FROM users WHERE branch = ? AND role = 'student') as total_students,
        (SELECT COUNT(*) FROM quizzes WHERE branch_code = ? AND is_active = 1) as total_quizzes
    `).bind(code, code, code, code).first()
    return c.json({ stats })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

export default branches
