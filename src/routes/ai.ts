import { Hono } from 'hono'
import { verifyJWT } from '../middleware/auth'

type Bindings = { DB: D1Database; OPENAI_API_KEY?: string }
const ai = new Hono<{ Bindings: Bindings }>()

// Simple rule-based AI fallback (no API key needed)
function generateLocalAnswer(message: string, subjectContext: string): string {
  const msg = message.toLowerCase()

  const responses: Record<string, string> = {
    'big o': `## Big O Notation

Big O notation describes the **time/space complexity** of algorithms.

| Notation | Name | Example |
|----------|------|---------|
| O(1) | Constant | Array access |
| O(log n) | Logarithmic | Binary search |
| O(n) | Linear | Linear search |
| O(n log n) | Log-linear | Merge sort |
| O(n²) | Quadratic | Bubble sort |
| O(2ⁿ) | Exponential | Fibonacci recursive |

**Key Rule:** Drop constants and lower-order terms. O(2n) → O(n)`,

    'deadlock': `## Deadlock in Operating Systems

A **deadlock** occurs when processes wait indefinitely for resources held by each other.

### Four Necessary Conditions (Coffman Conditions):
1. **Mutual Exclusion** – Resource held by one process at a time
2. **Hold and Wait** – Process holds one resource while waiting for others
3. **No Preemption** – Resources can't be forcibly taken
4. **Circular Wait** – P1 waits for P2, P2 waits for P1

### Prevention Methods:
- **Banker's Algorithm** – Check safe state before allocation
- **Resource Ordering** – Assign numbers to resources
- **Preemption** – Force-take resources when needed`,

    'quicksort': `## QuickSort Algorithm

QuickSort uses **divide and conquer** with a pivot element.

\`\`\`python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left  = [x for x in arr if x < pivot]
    mid   = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + mid + quicksort(right)
\`\`\`

### Complexity:
- **Best/Average:** O(n log n)
- **Worst:** O(n²) — when pivot is always min/max
- **Space:** O(log n)`,

    'linked list': `## Linked List

A **linked list** is a linear data structure where elements (nodes) are connected via pointers.

### Types:
1. **Singly Linked** – Each node points to next
2. **Doubly Linked** – Points to next AND previous
3. **Circular** – Last node points back to first

### Operations:
| Operation | Time Complexity |
|-----------|----------------|
| Access | O(n) |
| Search | O(n) |
| Insert (head) | O(1) |
| Delete (head) | O(1) |`,

    'normalization': `## Database Normalization

Normalization eliminates **data redundancy** and ensures **data integrity**.

### Normal Forms:
- **1NF** – Atomic values, no repeating groups
- **2NF** – 1NF + No partial dependencies on composite key
- **3NF** – 2NF + No transitive dependencies
- **BCNF** – Every determinant is a candidate key

### Example:
\`Student(ID, Name, CourseID, CourseName)\`
- CourseID → CourseName is transitive → **violates 3NF**
- **Fix:** Split into Student(ID, Name, CourseID) + Course(CourseID, CourseName)`,

    'tcp': `## TCP vs UDP

| Feature | TCP | UDP |
|---------|-----|-----|
| Connection | Connection-oriented | Connectionless |
| Reliability | Guaranteed delivery | No guarantee |
| Order | In-order delivery | No ordering |
| Speed | Slower | Faster |
| Use case | HTTP, FTP, Email | Video streaming, DNS, Gaming |

### TCP 3-Way Handshake:
1. **SYN** – Client sends synchronize
2. **SYN-ACK** – Server acknowledges
3. **ACK** – Client confirms`,

    'osi': `## OSI Model (7 Layers)

| Layer | Name | Protocol/Device |
|-------|------|-----------------|
| 7 | Application | HTTP, FTP, SMTP |
| 6 | Presentation | SSL, JPEG, MPEG |
| 5 | Session | NetBIOS, RPC |
| 4 | Transport | TCP, UDP |
| 3 | Network | IP, ICMP, Router |
| 2 | Data Link | MAC, Switch, Ethernet |
| 1 | Physical | Cables, Hub, Bits |

**Memory trick:** "**A**ll **P**eople **S**eem **T**o **N**eed **D**ata **P**rocessing"`,

    'machine learning': `## Machine Learning Overview

### Types:
1. **Supervised Learning** – Labeled data (Classification, Regression)
   - Examples: Linear Regression, SVM, Decision Trees, Neural Networks
2. **Unsupervised Learning** – No labels (Clustering, Dimensionality Reduction)
   - Examples: K-Means, PCA, Autoencoders
3. **Reinforcement Learning** – Agent learns via rewards/penalties

### Key Concepts:
- **Overfitting** – Model memorizes training data (high variance)
- **Underfitting** – Model too simple (high bias)
- **Cross-validation** – Technique to evaluate model performance
- **Gradient Descent** – Optimization algorithm to minimize loss`,

    'exam': `## VTU Exam Preparation Tips 🎓

### Strategy:
1. **Start with syllabus** – Know exactly what's in scope
2. **Previous year papers** – Solve last 5 years (most repeated questions)
3. **Module-wise study** – Complete one module at a time
4. **10-mark questions** – Practice writing detailed answers
5. **Diagrams** – Always include relevant diagrams

### VTU Pattern:
- **Internal Marks:** 50 (2 CIAs + Assignments)
- **External Marks:** 50 (Theory Exam)
- **Passing:** 40% in each (Internal + External separately)

### Time Management:
- 3-hour paper: Spend max **20 min per 10-mark question**
- Attempt all questions – partial marks are awarded`,

    'sql': `## SQL Quick Reference

\`\`\`sql
-- SELECT with conditions
SELECT * FROM students WHERE branch = 'CSE' ORDER BY name;

-- JOIN tables
SELECT s.name, c.title 
FROM students s JOIN courses c ON s.course_id = c.id;

-- GROUP BY with aggregate
SELECT branch, COUNT(*) as total, AVG(marks) as avg_marks
FROM students GROUP BY branch HAVING AVG(marks) > 60;

-- Subquery
SELECT name FROM students 
WHERE marks > (SELECT AVG(marks) FROM students);
\`\`\`

### Key Commands:
- **DDL:** CREATE, ALTER, DROP, TRUNCATE
- **DML:** SELECT, INSERT, UPDATE, DELETE
- **DCL:** GRANT, REVOKE`,
  }

  for (const [key, answer] of Object.entries(responses)) {
    if (msg.includes(key)) return answer
  }

  // Generic response
  return `## Answer to: "${message}"

${subjectContext ? `*Context: ${subjectContext}*\n\n` : ''}I'm the VTU AI Assistant! Here are some tips for this topic:

1. **Check your VTU syllabus** for this subject to understand what topics are in scope
2. **Refer to the resources** section for official notes and textbooks
3. **Practice previous year papers** available in the question papers section
4. **Use the quiz system** to test your understanding

### Common Study Resources:
- Module-wise notes in the Resources section
- VTU question papers (last 5 years)
- Lab manuals for practical subjects

**Tip:** Be more specific in your question for a detailed answer. For example:
- "Explain quicksort algorithm with example"
- "What is deadlock in OS and how to prevent it?"
- "Explain normalization with example"

Feel free to ask about: Data Structures, OS, DBMS, Networks, Machine Learning, Algorithms, or any VTU topic!`
}

ai.post('/chat', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const user = await verifyJWT(auth.slice(7))
    const { message, subject_id, history } = await c.req.json()
    if (!message) return c.json({ error: 'Message required' }, 400)

    let subjectContext = ''
    if (subject_id) {
      const subject = await c.env.DB.prepare(`SELECT name, description FROM subjects WHERE id = ?`).bind(subject_id).first<any>()
      if (subject) subjectContext = `${subject.name}: ${subject.description || ''}`
    }

    // Try OpenAI if key available
    if (c.env.OPENAI_API_KEY) {
      try {
        const messages: any[] = [
          {
            role: 'system',
            content: `You are an expert VTU (Visvesvaraya Technological University) academic assistant. Help students with their engineering subjects. ${subjectContext ? `Current subject context: ${subjectContext}` : ''} Provide clear, structured answers with examples. Format responses with markdown headings and code blocks where appropriate.`
          },
          ...(history || []).slice(-6),
          { role: 'user', content: message }
        ]

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${c.env.OPENAI_API_KEY}` },
          body: JSON.stringify({ model: 'gpt-3.5-turbo', messages, max_tokens: 800, temperature: 0.7 })
        })

        if (response.ok) {
          const data: any = await response.json()
          const reply = data.choices?.[0]?.message?.content || ''
          if (reply) {
            // Award points for AI usage
            await c.env.DB.prepare(`UPDATE users SET points = points + 5 WHERE id = ?`).bind(user.id).run()
            return c.json({ reply, source: 'openai' })
          }
        }
      } catch(e) {}
    }

    // Fallback to local AI
    const reply = generateLocalAnswer(message, subjectContext)
    await c.env.DB.prepare(`UPDATE users SET points = points + 2 WHERE id = ?`).bind(user.id).run()
    return c.json({ reply, source: 'local' })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

ai.post('/summarize', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { text, subject } = await c.req.json()
    if (!text) return c.json({ error: 'Text required' }, 400)
    const summary = `## Summary

**Subject:** ${subject || 'General'}

### Key Points:
${text.split('.').filter((s: string) => s.trim().length > 20).slice(0, 5).map((s: string) => `- ${s.trim()}`).join('\n')}

### Important Terms:
Based on the content, focus on understanding the core concepts and their applications in VTU exams.`
    return c.json({ summary })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

export default ai
