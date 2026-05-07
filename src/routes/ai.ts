import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'

type Bindings = { DB: D1Database; OPENAI_API_KEY?: string }
const ai = new Hono<{ Bindings: Bindings }>()

// VTU Knowledge base for AI responses
const VTU_KNOWLEDGE: Record<string, string> = {
  'data structures': 'Data Structures in VTU CSE Sem 3 covers: Arrays, Linked Lists (Singly, Doubly, Circular), Stacks, Queues, Trees (Binary, BST, AVL, B-Trees), Graphs (BFS, DFS), Sorting (Quick, Merge, Heap), Hashing.',
  'operating systems': 'OS in VTU CSE Sem 4 covers: Process Management, CPU Scheduling (FCFS, SJF, RR, Priority), Memory Management (Paging, Segmentation, Virtual Memory), Deadlocks (Detection, Prevention, Avoidance), File Systems, I/O Management.',
  'dbms': 'DBMS in VTU CSE Sem 3 covers: ER Model, Relational Model, SQL (DDL, DML, DCL), Normalization (1NF-BCNF), Transactions (ACID), Concurrency Control, Recovery, Indexing (B+ Trees, Hashing).',
  'computer networks': 'CN in VTU CSE Sem 4 covers: OSI Model (7 layers), TCP/IP Suite, Data Link (Ethernet, CSMA/CD), Network Layer (IP, Routing - RIP, OSPF, BGP), Transport Layer (TCP, UDP), Application Layer (HTTP, FTP, DNS, SMTP).',
  'machine learning': 'ML in VTU CSE Sem 6 covers: Supervised Learning (Linear Regression, Logistic Regression, Decision Trees, SVM, KNN), Unsupervised Learning (K-Means, Hierarchical Clustering), Neural Networks, Evaluation Metrics (Precision, Recall, F1, ROC).',
  'algorithms': 'ADA in VTU CSE Sem 4 covers: Algorithm Analysis (Time/Space Complexity, Big-O), Divide & Conquer (Merge Sort, Quick Sort, Binary Search), Greedy (Huffman, Kruskal, Prim), Dynamic Programming (LCS, 0/1 Knapsack, Matrix Chain), Backtracking, Graph Algorithms.',
  'compiler design': 'Compiler Design in VTU CSE Sem 6 covers: Phases of Compilation, Lexical Analysis (Regular Expressions, Automata), Syntax Analysis (CFG, Parsing - LL, LR), Semantic Analysis, Intermediate Code Generation, Code Optimization, Code Generation.',
  'vtu': 'VTU (Visvesvaraya Technological University) is one of the largest technical universities in India, established in 1998, headquartered in Belagavi, Karnataka. It offers B.E., B.Tech, M.Tech, MBA, MCA, and Ph.D. programs across 200+ affiliated colleges.',
  'cgpa': 'VTU CGPA Calculation: CGPA = Sum(Credit × Grade Points) / Sum(Credits). Grade Points: O=10, A+=9, A=8, B+=7, B=6, C=5, P=4, F=0. Minimum CGPA 5.0 required to pass semester.',
  'placement': 'VTU Placement Tips: Master DSA fundamentals, practice on LeetCode/HackerRank, learn one full-stack technology, work on projects, prepare aptitude (arithmetic, logical, verbal), practice mock interviews. Top recruiters: TCS, Infosys, Wipro, Accenture, Cognizant, Amazon, Microsoft, Google.',
}

function getRelevantContext(message: string): string {
  const lower = message.toLowerCase()
  const relevant: string[] = []
  for (const [key, value] of Object.entries(VTU_KNOWLEDGE)) {
    if (lower.includes(key) || key.split(' ').some(word => lower.includes(word))) {
      relevant.push(value)
    }
  }
  return relevant.join('\n\n')
}

function generateSmartResponse(message: string, subjectName?: string): string {
  const lower = message.toLowerCase()
  const context = getRelevantContext(message)
  
  // Greeting
  if (/^(hi|hello|hey|greetings)/i.test(message.trim())) {
    return `Hello! 👋 I'm your VTU AI Study Assistant. I can help you with:\n\n📚 **Subject Explanations** - Ask about any VTU topic\n🧪 **Concept Clarification** - Get detailed explanations\n📝 **Exam Preparation** - Important questions & tips\n💼 **Placement Guidance** - Interview prep & resources\n\nWhat would you like to learn today?`
  }
  
  // Study tips
  if (lower.includes('study tip') || lower.includes('how to study') || lower.includes('preparation tip')) {
    return `## 📚 VTU Study Tips\n\n**1. Understand the Syllabus**\nStart by reading the complete VTU syllabus for each subject.\n\n**2. Module-wise Approach**\nVTU divides each subject into 5 modules. Study one module completely before moving to the next.\n\n**3. Use Previous Year Papers**\nSolve last 10 years of VTU question papers. Questions repeat with ~60% probability!\n\n**4. Important Questions**\nFocus on questions that appear in multiple years - these are HIGH priority.\n\n**5. Lab Preparation**\nPractice all lab programs until you can write them without reference.\n\n**6. Internal Assessment**\nIA marks = 40% of total. Don't neglect internals!\n\n**7. Active Recall**\nDon't just read - write key formulas and concepts from memory.\n\n${subjectName ? `\n**Specifically for ${subjectName}:** Focus on numerical problems and derivations for theory exams.` : ''}`
  }
  
  // Explain concept
  if (lower.includes('explain') || lower.includes('what is') || lower.includes('define')) {
    if (context) {
      return `## 📖 Explanation\n\n${context}\n\n---\n💡 **Tip:** For deeper understanding, check the uploaded notes and textbooks in the Resources section. Want me to elaborate on any specific aspect?`
    }
  }
  
  // Important questions
  if (lower.includes('important question') || lower.includes('exam question') || lower.includes('viva question')) {
    const subject = subjectName || 'your subject'
    return `## 📝 Important Questions for ${subject}\n\n**Module 1 (High Priority):**\n• Define and explain the fundamental concepts with examples\n• Compare and contrast the key techniques\n• Explain the algorithm/process with a diagram\n\n**Module 2-3 (Medium Priority):**\n• Numerical/problem-solving questions\n• Short notes on key topics\n• Differences between concepts\n\n**Module 4-5 (High Priority):**\n• Application-based questions\n• Case studies\n• Recent developments\n\n📌 **VTU Pattern:** 5 questions, answer any 5 from 8. Each module gets 2 questions.\n\n*Check the Question Papers section for actual VTU exam papers!*`
  }
  
  // Placement questions
  if (lower.includes('placement') || lower.includes('interview') || lower.includes('job')) {
    return `## 💼 Placement Preparation Guide\n\n**Technical Round:**\n✅ DSA - Arrays, Strings, Linked Lists, Trees, Graphs, DP\n✅ CS Fundamentals - OS, DBMS, CN, OOP\n✅ Coding Practice - LeetCode (Easy/Medium), HackerRank\n\n**Aptitude Round:**\n✅ Quantitative - Percentages, Time-Distance, Profit-Loss\n✅ Logical Reasoning - Patterns, Syllogisms, Blood Relations\n✅ Verbal Ability - Reading Comprehension, Vocabulary\n\n**HR Round:**\n✅ Tell me about yourself (2-minute pitch)\n✅ Why this company? (Research company values)\n✅ Strengths and weaknesses (be honest & positive)\n✅ Projects and internships\n\n**Top Companies visiting VTU campuses:**\nTCS, Infosys, Wipro, Accenture, Cognizant, Capgemini, HCL, Amazon, Microsoft (for Tier-1 colleges)\n\n*Visit the Placement Module for company-wise preparation guides!*`
  }
  
  // Default with context
  if (context) {
    return `## 📚 ${subjectName ? subjectName + ' - ' : ''}Study Notes\n\n${context}\n\n---\n*This information is based on the VTU curriculum. For detailed notes and previous year papers, check the Resources section.*\n\nDo you have any specific questions about this topic?`
  }
  
  // General fallback
  return `I'm your VTU Study Assistant! 🤖\n\nI can help you with:\n\n📖 **Explaining concepts** - "Explain binary trees"\n📝 **Study tips** - "How to study for VTU exams"\n💡 **Important questions** - "Important questions for DBMS"\n💼 **Placement prep** - "How to prepare for TCS placement"\n🔬 **Subject-specific doubts** - Ask about any VTU subject\n\n**Currently I have knowledge about:**\n${Object.keys(VTU_KNOWLEDGE).map(k => `• ${k.charAt(0).toUpperCase() + k.slice(1)}`).join('\n')}\n\nWhat would you like to know?`
}

ai.post('/chat', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { message, session_id, subject_id } = await c.req.json()
    if (!message?.trim()) return c.json({ error: 'Message cannot be empty' }, 400)
    
    let subjectName = ''
    if (subject_id) {
      const subject = await c.env.DB.prepare(`SELECT name FROM subjects WHERE id = ?`).bind(subject_id).first<any>()
      subjectName = subject?.name || ''
    }
    
    // Try OpenAI if key is available
    let aiResponse = ''
    if (c.env.OPENAI_API_KEY) {
      try {
        const context = getRelevantContext(message)
        const systemPrompt = `You are a specialized VTU (Visvesvaraya Technological University) Study Assistant AI. You help engineering students with their studies, exam preparation, and placement guidance. 
        
Current student: ${user.name}, Branch: ${user.branch || 'Engineering'}, Subject context: ${subjectName || 'General'}.

VTU Context: ${context || 'General VTU engineering curriculum'}

Be concise, structured, and use markdown formatting. Focus on practical exam-oriented explanations.`
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${c.env.OPENAI_API_KEY}` },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            max_tokens: 800,
            temperature: 0.7
          })
        })
        if (response.ok) {
          const data = await response.json() as any
          aiResponse = data.choices[0].message.content
        }
      } catch {}
    }
    
    // Fallback to smart local response
    if (!aiResponse) {
      aiResponse = generateSmartResponse(message, subjectName)
    }
    
    // Save or update session
    let sessionId = session_id
    if (sessionId) {
      const session = await c.env.DB.prepare(`SELECT id, messages FROM ai_sessions WHERE id = ? AND user_id = ?`).bind(sessionId, user.id).first<any>()
      if (session) {
        const messages = JSON.parse(session.messages || '[]')
        messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() })
        messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() })
        await c.env.DB.prepare(`UPDATE ai_sessions SET messages = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(JSON.stringify(messages), sessionId).run()
      }
    } else {
      const title = message.slice(0, 50) + (message.length > 50 ? '...' : '')
      const messages = [
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
      ]
      const newSession = await c.env.DB.prepare(
        `INSERT INTO ai_sessions (user_id, title, subject_id, messages) VALUES (?, ?, ?, ?) RETURNING id`
      ).bind(user.id, title, subject_id || null, JSON.stringify(messages)).first<any>()
      sessionId = newSession?.id
    }
    
    // Award points for using AI
    await c.env.DB.prepare(`UPDATE users SET points = points + 3 WHERE id = ?`).bind(user.id).run()
    
    return c.json({ success: true, response: aiResponse, session_id: sessionId })
  } catch (e: any) { return c.json({ error: e.message || 'AI request failed' }, 500) }
})

ai.get('/sessions', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const { results } = await c.env.DB.prepare(
      `SELECT id, title, subject_id, created_at, updated_at FROM ai_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20`
    ).bind(user.id).all()
    return c.json({ sessions: results })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

ai.get('/sessions/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const id = c.req.param('id')
    const session = await c.env.DB.prepare(`SELECT * FROM ai_sessions WHERE id = ? AND user_id = ?`).bind(id, user.id).first<any>()
    if (!session) return c.json({ error: 'Session not found' }, 404)
    session.messages = JSON.parse(session.messages || '[]')
    return c.json({ session })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

ai.delete('/sessions/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const id = c.req.param('id')
    await c.env.DB.prepare(`DELETE FROM ai_sessions WHERE id = ? AND user_id = ?`).bind(id, user.id).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

ai.post('/summarize', authMiddleware, async (c) => {
  try {
    const { text, subject } = await c.req.json()
    if (!text) return c.json({ error: 'Text is required' }, 400)
    const wordCount = text.split(' ').length
    const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 20)
    const keyPoints = sentences.slice(0, Math.min(5, Math.ceil(sentences.length * 0.3)))
    const summary = {
      overview: `This content covers approximately ${wordCount} words about ${subject || 'the subject'}.`,
      key_points: keyPoints.map((s: string) => s.trim()),
      important_terms: text.match(/\b[A-Z][a-z]+ [A-Z][a-z]+|\b[A-Z]{2,}/g)?.slice(0, 10) || [],
      study_tip: 'Focus on understanding the key concepts rather than memorizing. Practice with examples.'
    }
    return c.json({ summary })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

ai.post('/generate-questions', authMiddleware, async (c) => {
  try {
    const { subject, topic, difficulty = 'medium', count = 5 } = await c.req.json()
    const questionTemplates = [
      `Define ${topic} and explain its significance in ${subject}.`,
      `Explain the working of ${topic} with a suitable example.`,
      `Compare and contrast the key aspects of ${topic}.`,
      `What are the advantages and disadvantages of ${topic}?`,
      `With a neat diagram, explain the architecture/structure of ${topic}.`,
      `Derive the time complexity of ${topic} algorithm.`,
      `List and explain the applications of ${topic} in real-world scenarios.`,
      `Write an algorithm for ${topic} and trace it with an example.`,
    ]
    const selected = questionTemplates.slice(0, Math.min(count, questionTemplates.length))
    return c.json({ questions: selected, subject, topic, difficulty })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default ai
