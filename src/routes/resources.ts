import { Hono } from 'hono'
import { verifyJWT } from '../middleware/auth'

type Bindings = { DB: D1Database }
const resources = new Hono<{ Bindings: Bindings }>()

// GET /resources — list with filters
resources.get('/', async (c) => {
  try {
    const { type, semester, scheme, subject_id, search, limit = '30', branch, important } = c.req.query()
    let query = `SELECT r.*, u.name as uploader_name FROM resources r LEFT JOIN users u ON r.uploaded_by = u.id WHERE r.is_active = 1`
    const params: any[] = []
    if (type) { query += ` AND r.type = ?`; params.push(type) }
    if (semester) { query += ` AND r.semester = ?`; params.push(parseInt(semester)) }
    if (scheme) { query += ` AND r.scheme = ?`; params.push(scheme) }
    if (subject_id) { query += ` AND r.subject_id = ?`; params.push(parseInt(subject_id)) }
    if (branch) { query += ` AND r.branch_code = ?`; params.push(branch) }
    if (important === '1') { query += ` AND r.is_important = 1` }
    if (search) { query += ` AND (r.title LIKE ? OR r.description LIKE ? OR r.tags LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`) }
    query += ` ORDER BY r.is_important DESC, r.created_at DESC LIMIT ?`; params.push(parseInt(limit as string))
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ resources: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

// GET /resources/:id
resources.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const resource = await c.env.DB.prepare(
      `SELECT r.*, u.name as uploader_name FROM resources r LEFT JOIN users u ON r.uploaded_by = u.id WHERE r.id = ? AND r.is_active = 1`
    ).bind(id).first()
    if (!resource) return c.json({ error: 'Resource not found' }, 404)
    return c.json({ resource })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

// POST /resources — admin upload
resources.post('/', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const body = await c.req.json()
    const { title, description, type, subject_id, branch_code, semester, scheme, file_url, file_name, file_size, tags, is_important } = body
    if (!title || !type || !file_url) return c.json({ error: 'Title, type and file_url required' }, 400)
    const result = await c.env.DB.prepare(
      `INSERT INTO resources (title, description, type, subject_id, branch_code, semester, scheme, file_url, file_size, file_name, tags, is_important, uploaded_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *`
    ).bind(title, description || null, type, subject_id || null, branch_code || null, semester || null, scheme || '2021', file_url, file_size || null, file_name || title, JSON.stringify(tags || []), is_important ? 1 : 0, user.id).first()
    await c.env.DB.prepare(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (NULL, 'New Resource Added 📚', ?, 'resource')`
    ).bind(`"${title}" has been uploaded. Check it out in the Resources section!`).run()
    return c.json({ success: true, resource: result }, 201)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

// PUT /resources/:id — admin edit
resources.put('/:id', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const id = c.req.param('id')
    const body = await c.req.json()
    const { title, description, type, semester, scheme, file_url, tags, is_important } = body
    await c.env.DB.prepare(
      `UPDATE resources SET title=?, description=?, type=?, semester=?, scheme=?, file_url=?, tags=?, is_important=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
    ).bind(title, description || null, type, semester || null, scheme || '2021', file_url, JSON.stringify(tags || []), is_important ? 1 : 0, id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

// POST /resources/:id/view
resources.post('/:id/view', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(`UPDATE resources SET view_count = view_count + 1 WHERE id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

// POST /resources/:id/download
resources.post('/:id/download', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare(`UPDATE resources SET download_count = download_count + 1 WHERE id = ?`).bind(id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

// POST /resources/:id/bookmark — toggle
resources.post('/:id/bookmark', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    const id = c.req.param('id')
    const existing = await c.env.DB.prepare(`SELECT id FROM bookmarks WHERE user_id = ? AND resource_id = ?`).bind(user.id, id).first()
    if (existing) {
      await c.env.DB.prepare(`DELETE FROM bookmarks WHERE user_id = ? AND resource_id = ?`).bind(user.id, id).run()
      return c.json({ bookmarked: false, message: 'Bookmark removed' })
    }
    await c.env.DB.prepare(`INSERT INTO bookmarks (user_id, resource_id) VALUES (?,?)`).bind(user.id, id).run()
    return c.json({ bookmarked: true, message: 'Bookmarked!' })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

// GET /resources/bookmarks/me — get user bookmarks
resources.get('/bookmarks/me', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    const { results } = await c.env.DB.prepare(
      `SELECT r.*, b.created_at as bookmarked_at FROM bookmarks b JOIN resources r ON b.resource_id = r.id WHERE b.user_id = ? AND r.is_active = 1 ORDER BY b.created_at DESC`
    ).bind(user.id).all()
    return c.json({ resources: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

// DELETE /resources/:id — soft delete
resources.delete('/:id', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    if (user.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    await c.env.DB.prepare(`UPDATE resources SET is_active = 0 WHERE id = ?`).bind(c.req.param('id')).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default resources
