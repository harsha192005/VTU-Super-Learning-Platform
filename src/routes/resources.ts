import { Hono } from 'hono'
import { authMiddleware, adminMiddleware } from '../middleware/auth'

type Bindings = { DB: D1Database }
type Variables = { user: any }
const resources = new Hono<{ Bindings: Bindings; Variables: Variables }>()

resources.get('/', async (c) => {
  try {
    const { type, semester, subject_id, search, limit = '30', branch } = c.req.query()
    let query = `SELECT r.*, u.name as uploader_name FROM resources r LEFT JOIN users u ON r.uploaded_by = u.id WHERE r.is_active = 1`
    const params: any[] = []
    if (type) { query += ` AND r.type = ?`; params.push(type) }
    if (semester) { query += ` AND r.semester = ?`; params.push(parseInt(semester)) }
    if (subject_id) { query += ` AND r.subject_id = ?`; params.push(parseInt(subject_id)) }
    if (branch) { query += ` AND r.branch_code = ?`; params.push(branch) }
    if (search) { query += ` AND (r.title LIKE ? OR r.description LIKE ?)`; params.push(`%${search}%`, `%${search}%`) }
    query += ` ORDER BY r.created_at DESC LIMIT ?`; params.push(parseInt(limit as string))
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ resources: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

resources.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const resource = await c.env.DB.prepare(`SELECT r.*, u.name as uploader_name FROM resources r LEFT JOIN users u ON r.uploaded_by = u.id WHERE r.id = ? AND r.is_active = 1`).bind(id).first()
    if (!resource) return c.json({ error: 'Resource not found' }, 404)
    return c.json({ resource })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

resources.post('/', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { verifyJWT } = await import('../middleware/auth')
    const user = await verifyJWT(auth.slice(7))
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const body = await c.req.json()
    const { title, description, type, subject_id, branch_code, semester, file_url, file_name, tags, is_important } = body
    if (!title || !type || !file_url) return c.json({ error: 'Title, type and file_url required' }, 400)
    const result = await c.env.DB.prepare(
      `INSERT INTO resources (title, description, type, subject_id, branch_code, semester, file_url, file_name, tags, is_important, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
    ).bind(title, description || null, type, subject_id || null, branch_code || null, semester || null, file_url, file_name || null, JSON.stringify(tags || []), is_important ? 1 : 0, user.id).first()
    // Notify all students
    await c.env.DB.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (NULL, 'New Resource Added 📚', ?, 'resource')`).bind(`"${title}" has been uploaded.`).run()
    return c.json({ success: true, resource: result }, 201)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

resources.post('/:id/view', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(`UPDATE resources SET view_count = view_count + 1 WHERE id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

resources.post('/:id/download', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(`UPDATE resources SET download_count = download_count + 1 WHERE id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

resources.post('/:id/bookmark', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { verifyJWT } = await import('../middleware/auth')
    const user = await verifyJWT(auth.slice(7))
    const id = c.req.param('id')
    const existing = await c.env.DB.prepare(`SELECT id FROM bookmarks WHERE user_id = ? AND resource_id = ?`).bind(user.id, id).first()
    if (existing) {
      await c.env.DB.prepare(`DELETE FROM bookmarks WHERE user_id = ? AND resource_id = ?`).bind(user.id, id).run()
      return c.json({ bookmarked: false })
    }
    await c.env.DB.prepare(`INSERT INTO bookmarks (user_id, resource_id) VALUES (?, ?)`).bind(user.id, id).run()
    return c.json({ bookmarked: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

resources.delete('/:id', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { verifyJWT } = await import('../middleware/auth')
    const user = await verifyJWT(auth.slice(7))
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const id = c.req.param('id')
    await c.env.DB.prepare(`UPDATE resources SET is_active = 0 WHERE id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default resources
