import { Hono } from 'hono'
import { authMiddleware, adminMiddleware } from '../middleware/auth'

type Bindings = { DB: D1Database }
const resources = new Hono<{ Bindings: Bindings }>()

resources.get('/', async (c) => {
  try {
    const { branch, semester, subject_id, type, search, limit = '20', offset = '0' } = c.req.query()
    let query = `SELECT r.*, s.name as subject_name, u.name as uploader_name FROM resources r 
      LEFT JOIN subjects s ON r.subject_id = s.id 
      LEFT JOIN users u ON r.uploaded_by = u.id 
      WHERE r.is_active = 1`
    const params: any[] = []
    if (branch) { query += ` AND r.branch_code = ?`; params.push(branch) }
    if (semester) { query += ` AND r.semester = ?`; params.push(parseInt(semester)) }
    if (subject_id) { query += ` AND r.subject_id = ?`; params.push(parseInt(subject_id)) }
    if (type) { query += ` AND r.type = ?`; params.push(type) }
    if (search) { query += ` AND (r.title LIKE ? OR r.description LIKE ? OR r.tags LIKE ?)`; params.push(`%${search}%`, `%${search}%`, `%${search}%`) }
    query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`
    params.push(parseInt(limit), parseInt(offset))
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) as total FROM').split('ORDER BY')[0]
    const countParams = params.slice(0, -2)
    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first<any>()
    return c.json({ resources: results, total: countResult?.total || 0 })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

resources.get('/featured', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT r.*, s.name as subject_name FROM resources r LEFT JOIN subjects s ON r.subject_id = s.id WHERE r.is_active = 1 AND r.is_important = 1 ORDER BY r.download_count DESC LIMIT 10`
    ).all()
    return c.json({ resources: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

resources.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const resource = await c.env.DB.prepare(
      `SELECT r.*, s.name as subject_name, s.code as subject_code, u.name as uploader_name FROM resources r LEFT JOIN subjects s ON r.subject_id = s.id LEFT JOIN users u ON r.uploaded_by = u.id WHERE r.id = ? AND r.is_active = 1`
    ).bind(id).first()
    if (!resource) return c.json({ error: 'Resource not found' }, 404)
    await c.env.DB.prepare(`UPDATE resources SET view_count = view_count + 1 WHERE id = ?`).bind(id).run()
    return c.json({ resource })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

resources.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    if (user?.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const body = await c.req.json()
    const { title, description, type, subject_id, branch_code, semester, file_url, file_name, file_size, tags, is_important } = body
    if (!title || !type || !file_url) return c.json({ error: 'Title, type, and file URL required' }, 400)
    const result = await c.env.DB.prepare(
      `INSERT INTO resources (title, description, type, subject_id, branch_code, semester, file_url, file_name, file_size, tags, is_important, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
    ).bind(title, description || '', type, subject_id || null, branch_code || null, semester ? parseInt(semester) : null, file_url, file_name || title, file_size || 0, tags ? JSON.stringify(tags) : '[]', is_important ? 1 : 0, user.id).first()
    // Notify students
    if (branch_code) {
      await c.env.DB.prepare(`INSERT INTO notifications (title, message, type, link) VALUES (?, ?, 'resource', '/resources/${(result as any).id}')`).bind(`New Resource: ${title}`, `A new ${type} has been uploaded for ${branch_code} Semester ${semester || ''}.`, ).run()
    }
    return c.json({ success: true, resource: result }, 201)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

resources.put('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    if (user?.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const id = c.req.param('id')
    const { title, description, type, tags, is_important, file_url, file_name } = await c.req.json()
    await c.env.DB.prepare(
      `UPDATE resources SET title = ?, description = ?, type = ?, tags = ?, is_important = ?, file_url = ?, file_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(title, description, type, tags ? JSON.stringify(tags) : '[]', is_important ? 1 : 0, file_url, file_name, id).run()
    const updated = await c.env.DB.prepare(`SELECT * FROM resources WHERE id = ?`).bind(id).first()
    return c.json({ success: true, resource: updated })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

resources.delete('/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    if (user?.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const id = c.req.param('id')
    await c.env.DB.prepare(`UPDATE resources SET is_active = 0 WHERE id = ?`).bind(id).run()
    return c.json({ success: true, message: 'Resource deleted' })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

resources.post('/:id/download', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const user = c.get('user')
    await c.env.DB.prepare(`UPDATE resources SET download_count = download_count + 1 WHERE id = ?`).bind(id).run()
    await c.env.DB.prepare(`INSERT INTO resource_analytics (resource_id, user_id, action) VALUES (?, ?, 'download')`).bind(id, user?.id || null).run()
    // Award points for download activity
    if (user?.id) {
      await c.env.DB.prepare(`UPDATE users SET points = points + 5 WHERE id = ?`).bind(user.id).run()
    }
    const resource = await c.env.DB.prepare(`SELECT file_url, file_name FROM resources WHERE id = ?`).bind(id).first<any>()
    return c.json({ success: true, file_url: resource?.file_url, file_name: resource?.file_name })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

resources.post('/:id/bookmark', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const user = c.get('user')
    const existing = await c.env.DB.prepare(`SELECT id FROM bookmarks WHERE user_id = ? AND resource_id = ?`).bind(user.id, id).first()
    if (existing) {
      await c.env.DB.prepare(`DELETE FROM bookmarks WHERE user_id = ? AND resource_id = ?`).bind(user.id, id).run()
      return c.json({ success: true, bookmarked: false, message: 'Bookmark removed' })
    } else {
      await c.env.DB.prepare(`INSERT INTO bookmarks (user_id, resource_id) VALUES (?, ?)`).bind(user.id, id).run()
      await c.env.DB.prepare(`UPDATE users SET points = points + 2 WHERE id = ?`).bind(user.id).run()
      return c.json({ success: true, bookmarked: true, message: 'Bookmarked!' })
    }
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

resources.get('/bookmarks/my', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { results } = await c.env.DB.prepare(
      `SELECT r.*, s.name as subject_name, b.user_id, b.created_at as bookmarked_at FROM resources r JOIN bookmarks b ON r.id = b.resource_id LEFT JOIN subjects s ON r.subject_id = s.id WHERE b.user_id = ? AND r.is_active = 1 ORDER BY b.created_at DESC`
    ).bind(user.id).all()
    return c.json({ bookmarks: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default resources
