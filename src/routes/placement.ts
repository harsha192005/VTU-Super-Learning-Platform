import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'

type Bindings = { DB: D1Database }
const placement = new Hono<{ Bindings: Bindings }>()

placement.get('/questions', async (c) => {
  try {
    const { category, company, difficulty, search, limit = '20', offset = '0' } = c.req.query()
    let query = `SELECT * FROM placement_questions WHERE 1=1`
    const params: any[] = []
    if (category) { query += ` AND category = ?`; params.push(category) }
    if (company) { query += ` AND company LIKE ?`; params.push(`%${company}%`) }
    if (difficulty) { query += ` AND difficulty = ?`; params.push(difficulty) }
    if (search) { query += ` AND (question LIKE ? OR tags LIKE ?)`; params.push(`%${search}%`, `%${search}%`) }
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
    params.push(parseInt(limit), parseInt(offset))
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ questions: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

placement.get('/companies', async (c) => {
  const companies = [
    { name: 'TCS', type: 'Service', difficulty: 'Easy', package: '3.5-7 LPA', process: ['Online Test', 'TR', 'MR', 'HR'], focus: ['DSA Basics', 'Aptitude', 'Communication'] },
    { name: 'Infosys', type: 'Service', difficulty: 'Easy', package: '3.6-8 LPA', process: ['Hackathon/Test', 'TR', 'HR'], focus: ['Problem Solving', 'Coding', 'Verbal'] },
    { name: 'Wipro', type: 'Service', difficulty: 'Easy', package: '3.5-6.5 LPA', process: ['Online Test', 'Essay', 'TR', 'HR'], focus: ['Quantitative', 'Verbal', 'Coding'] },
    { name: 'Accenture', type: 'Service', difficulty: 'Easy-Medium', package: '4-8 LPA', process: ['Cognitive Test', 'Coding', 'TR', 'HR'], focus: ['Problem Solving', 'Communication', 'Tech Fundamentals'] },
    { name: 'Cognizant', type: 'Service', difficulty: 'Easy', package: '4-7 LPA', process: ['Aptitude', 'TR', 'HR'], focus: ['Logical Reasoning', 'Tech Basics', 'Communication'] },
    { name: 'Amazon', type: 'Product', difficulty: 'Hard', package: '15-45 LPA', process: ['OA', 'Phone Screen', '4-5 Loops'], focus: ['DSA', 'System Design', 'Leadership Principles', 'Behavioural'] },
    { name: 'Microsoft', type: 'Product', difficulty: 'Hard', package: '20-50 LPA', process: ['OA', '4-5 Rounds'], focus: ['DSA', 'System Design', 'OOP', 'Problem Solving'] },
    { name: 'Google', type: 'Product', difficulty: 'Very Hard', package: '30-80 LPA', process: ['Phone Screen', '5-6 Rounds'], focus: ['Algorithms', 'System Design', 'Coding', 'Behavioural'] },
    { name: 'Capgemini', type: 'Service', difficulty: 'Easy', package: '3.8-7 LPA', process: ['Game-Based Assessment', 'TR', 'HR'], focus: ['Cognitive Ability', 'Technical', 'Soft Skills'] },
    { name: 'HCL', type: 'Service', difficulty: 'Easy', package: '3.5-6 LPA', process: ['Online Test', 'TR', 'HR'], focus: ['Tech Fundamentals', 'Aptitude', 'English'] },
  ]
  return c.json({ companies })
})

placement.get('/roadmap', async (c) => {
  const { branch = 'CSE' } = c.req.query()
  const roadmaps: Record<string, any> = {
    CSE: {
      title: 'CSE Placement Roadmap',
      phases: [
        { phase: 1, title: 'Foundation (Sem 1-3)', duration: '6 months', topics: ['C Programming', 'Data Structures Basics', 'Discrete Math', 'DBMS Fundamentals'], resources: ['CLRS Algorithms', 'GeeksforGeeks', 'LeetCode Easy'] },
        { phase: 2, title: 'Core CS (Sem 4-5)', duration: '6 months', topics: ['Advanced DSA', 'Operating Systems', 'Computer Networks', 'OOP with Java/C++'], resources: ['Striver DSA Sheet', 'LeetCode 150', 'Abdul Bari Algorithms YouTube'] },
        { phase: 3, title: 'Specialization (Sem 6)', duration: '4 months', topics: ['System Design Basics', 'Database Optimization', 'Web Dev / ML', 'Open Source Projects'], resources: ['Grokking System Design', 'CS50', 'Project-based learning'] },
        { phase: 4, title: 'Placement Prep (Sem 7-8)', duration: '4 months', topics: ['Mock Interviews', 'Company-specific prep', 'Resume building', 'Soft skills'], resources: ['Pramp', 'InterviewBit', 'LeetCode Company Tags', 'LinkedIn networking'] }
      ]
    },
    ECE: {
      title: 'ECE Placement Roadmap',
      phases: [
        { phase: 1, title: 'Core Electronics (Sem 1-3)', duration: '6 months', topics: ['Circuit Analysis', 'Electronic Devices', 'Digital Electronics', 'C Programming'], resources: ['Sedra Smith', 'Morris Mano', 'GeeksforGeeks'] },
        { phase: 2, title: 'Advanced Topics (Sem 4-5)', duration: '6 months', topics: ['VLSI Design', 'DSP', 'Embedded Systems', 'Communication Systems'], resources: ['Razavi VLSI', 'Proakis DSP', 'ARM Programming'] },
        { phase: 3, title: 'Specialization (Sem 6)', duration: '4 months', topics: ['IoT & Embedded', 'FPGA Programming', 'Python for DSP', 'Internship Projects'], resources: ['Coursera IoT', 'Xilinx tutorials', 'Industry projects'] },
        { phase: 4, title: 'Placement Prep (Sem 7-8)', duration: '4 months', topics: ['Core ECE interviews', 'Software track prep', 'GATE preparation', 'Resume & projects'], resources: ['ECE Interview guides', 'GATE material', 'Company prep'] }
      ]
    }
  }
  return c.json({ roadmap: roadmaps[branch] || roadmaps['CSE'] })
})

placement.post('/questions', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    if (user?.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
    const { question, answer, category, company, difficulty, tags } = await c.req.json()
    const result = await c.env.DB.prepare(
      `INSERT INTO placement_questions (question, answer, category, company, difficulty, tags) VALUES (?, ?, ?, ?, ?, ?) RETURNING *`
    ).bind(question, answer || '', category, company || null, difficulty || 'medium', tags ? JSON.stringify(tags) : '[]').first()
    return c.json({ success: true, question: result }, 201)
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default placement
