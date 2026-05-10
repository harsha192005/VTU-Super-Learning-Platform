import { Hono } from 'hono'
import { verifyJWT } from '../middleware/auth'

type Bindings = { DB: D1Database; OPENAI_API_KEY?: string }
const ai = new Hono<{ Bindings: Bindings }>()

// ─── Comprehensive VTU Knowledge Base ────────────────────────────────────────
const KB: Record<string, string> = {
  // ── Data Structures ───────────────────────────────────────────────────────
  'big o': `## Big O Notation — Algorithm Complexity

Big O describes how runtime/space **scales with input size**.

| Notation | Name | Example Algorithm |
|----------|------|------------------|
| O(1) | Constant | Array indexing, Hash lookup |
| O(log n) | Logarithmic | Binary Search |
| O(n) | Linear | Linear Search |
| O(n log n) | Log-linear | Merge Sort, Heap Sort |
| O(n²) | Quadratic | Bubble/Selection/Insertion Sort |
| O(2ⁿ) | Exponential | Recursive Fibonacci |
| O(n!) | Factorial | Brute-force TSP |

**Rules:**
- Drop constants: O(2n) → **O(n)**
- Drop lower-order terms: O(n² + n) → **O(n²)**
- Best case (Ω), Average (Θ), Worst case (O)

**Space Complexity** = extra memory used (don't count input).`,

  'binary tree': `## Binary Tree

A tree where each node has **at most 2 children** (left & right).

### Types:
| Type | Property |
|------|----------|
| Full Binary Tree | Every node has 0 or 2 children |
| Complete Binary Tree | All levels full except last (filled left-to-right) |
| Perfect Binary Tree | All internal nodes have 2 children, all leaves same level |
| BST | Left < Root < Right |
| AVL Tree | BST + Height balanced (|BF| ≤ 1) |

### Traversals:
\`\`\`
Inorder  (L-Root-R): sorted output for BST
Preorder (Root-L-R): copy a tree
Postorder(L-R-Root): delete a tree
Level order: BFS using a queue
\`\`\`

### Height of a Binary Tree: O(log n) for balanced, O(n) for skewed.`,

  'linked list': `## Linked List

A linear data structure of **nodes** connected via pointers.

### Types:
| Type | Description |
|------|-------------|
| Singly Linked | Node → next only |
| Doubly Linked | Node ↔ next & prev |
| Circular Linked | Last node → head |
| Circular Doubly | Both directions + circular |

### Complexity:
| Operation | Singly | Array |
|-----------|--------|-------|
| Access | O(n) | O(1) |
| Search | O(n) | O(n) |
| Insert at head | O(1) | O(n) |
| Insert at tail | O(n) | O(1) amortized |
| Delete at head | O(1) | O(n) |

**Advantage over array:** No fixed size, O(1) insert/delete at head.`,

  'stack queue': `## Stack & Queue

### Stack (LIFO — Last In, First Out):
- **Operations:** push(), pop(), peek(), isEmpty()
- **Applications:** Undo/redo, expression evaluation, DFS, recursion call stack
- **Implementation:** Array or Linked List

### Queue (FIFO — First In, First Out):
- **Operations:** enqueue(), dequeue(), front(), isEmpty()
- **Types:**
  - **Circular Queue:** Avoids wasted space
  - **Priority Queue:** Dequeue by priority (use Heap)
  - **Deque:** Insert/delete at both ends
- **Applications:** BFS, CPU scheduling, printer queue

### Expression Evaluation using Stack:
\`\`\`
Infix:   A + B * C
Postfix: A B C * +   ← evaluate left-to-right
Prefix:  + A * B C   ← evaluate right-to-left
\`\`\``,

  'sorting': `## Sorting Algorithms — VTU Reference

| Algorithm | Best | Average | Worst | Space | Stable |
|-----------|------|---------|-------|-------|--------|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | ❌ |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | ❌ |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | ❌ |
| Counting Sort | O(n+k) | O(n+k) | O(n+k) | O(k) | ✅ |

**For VTU exams:** Know Merge Sort and Quick Sort implementations thoroughly.`,

  'quicksort': `## QuickSort Algorithm

**Strategy:** Divide & Conquer using a **pivot** element.

### Steps:
1. Choose pivot (first/last/random/median)
2. Partition: elements < pivot go left, > pivot go right
3. Recursively sort left and right sub-arrays

\`\`\`python
def quicksort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quicksort(arr, low, pi - 1)
        quicksort(arr, pi + 1, high)

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i+1], arr[high] = arr[high], arr[i+1]
    return i + 1
\`\`\`

**Complexity:** Best/Avg: O(n log n) | Worst: O(n²) — sorted input with bad pivot.`,

  'graph': `## Graph Data Structure

### Representations:
- **Adjacency Matrix:** O(V²) space, O(1) edge lookup
- **Adjacency List:** O(V+E) space, efficient for sparse graphs

### Traversals:
**BFS (Breadth First Search):**
- Use a **Queue**, visits level by level
- Finds shortest path in unweighted graphs
- Time: O(V+E)

**DFS (Depth First Search):**
- Use a **Stack** (or recursion)
- Used for: cycle detection, topological sort, connected components
- Time: O(V+E)

### Important Algorithms:
| Algorithm | Purpose | Complexity |
|-----------|---------|-----------|
| Dijkstra | Shortest path (no -ve weights) | O((V+E) log V) |
| Bellman-Ford | Shortest path (with -ve weights) | O(VE) |
| Floyd-Warshall | All-pairs shortest path | O(V³) |
| Kruskal / Prim | Minimum Spanning Tree | O(E log E) |
| Topological Sort | DAG ordering | O(V+E) |`,

  // ── Operating Systems ─────────────────────────────────────────────────────
  'deadlock': `## Deadlock in Operating Systems

A **deadlock** is a state where processes wait forever for resources held by each other.

### ☑️ Four Coffman Conditions (ALL must hold):
1. **Mutual Exclusion** — Resource used by only one process
2. **Hold & Wait** — Process holds resources while waiting for more
3. **No Preemption** — Resources cannot be forcibly taken
4. **Circular Wait** — P1→P2→P3→P1

### Strategies:
| Strategy | Description |
|----------|-------------|
| Prevention | Eliminate one of the 4 conditions |
| Avoidance | Banker's Algorithm — check safe state before allocation |
| Detection | Allow deadlock, detect & recover (kill process / preempt) |
| Ignorance | Ostrich Algorithm — pretend deadlocks don't happen |

### Banker's Algorithm:
- Allocate only if system remains in **safe state** (a safe sequence exists)`,

  'process scheduling': `## CPU Scheduling Algorithms

### Types of Scheduling:
| Algorithm | Type | Description |
|-----------|------|-------------|
| FCFS | Non-preemptive | First come, first served |
| SJF | Non-preemptive | Shortest job first (minimum average waiting time) |
| SRTF | Preemptive | Shortest remaining time first |
| Round Robin | Preemptive | Fixed time quantum, circular queue |
| Priority | Both | Highest priority first (starvation possible) |
| Multilevel Queue | Both | Separate queues per priority band |

### Key Metrics:
- **Throughput** = jobs completed per unit time
- **Turnaround Time** = Completion − Arrival
- **Waiting Time** = Turnaround − Burst
- **Response Time** = First CPU − Arrival

**Round Robin with small quantum** → good response time but high overhead.`,

  'memory management': `## Memory Management in OS

### Memory Allocation:
- **Contiguous:** Fixed/Variable partitioning
  - First Fit, Best Fit, Worst Fit algorithms
- **Non-Contiguous:** Paging, Segmentation

### Paging:
- Logical address = (page number, offset)
- Physical address = (frame number, offset)
- Page Table maps pages → frames
- TLB (Translation Lookaside Buffer) = fast page table cache

### Virtual Memory:
- Allows execution of partially-loaded programs
- **Page Fault** → OS loads page from disk
- **Thrashing** = excessive page faults (too many processes)

### Page Replacement Algorithms:
| Algorithm | Description |
|-----------|-------------|
| FIFO | Replace oldest page |
| LRU | Replace least recently used |
| Optimal | Replace page not needed for longest time |
| Clock (Second Chance) | Approximation of LRU |`,

  // ── DBMS ──────────────────────────────────────────────────────────────────
  'normalization': `## Database Normalization

**Goal:** Eliminate redundancy, prevent anomalies.

### Normal Forms:
| NF | Rule |
|----|------|
| 1NF | Atomic values; no repeating groups |
| 2NF | 1NF + No partial dependency (non-key attr depends on whole key) |
| 3NF | 2NF + No transitive dependency (non-key depends only on key) |
| BCNF | Every determinant is a candidate key |
| 4NF | No multi-valued dependencies |

### Example (3NF Violation):
\`\`\`
Student(RollNo, Name, DeptID, DeptName)
DeptID → DeptName (transitive dependency via DeptID)

Fix: Split into:
Student(RollNo, Name, DeptID)
Department(DeptID, DeptName)
\`\`\``,

  'sql': `## SQL — Complete Reference

\`\`\`sql
-- DDL (Structure)
CREATE TABLE students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  branch CHAR(5),
  marks FLOAT DEFAULT 0
);
ALTER TABLE students ADD COLUMN email VARCHAR(100);
DROP TABLE students;

-- DML (Data)
INSERT INTO students VALUES (1, 'Rahul', 'CSE', 85.5);
UPDATE students SET marks = 90 WHERE id = 1;
DELETE FROM students WHERE marks < 40;

-- SELECT with everything
SELECT s.name, d.dept_name, AVG(s.marks) as avg
FROM students s
JOIN departments d ON s.dept_id = d.id
WHERE s.marks > 60
GROUP BY d.dept_name
HAVING AVG(s.marks) > 70
ORDER BY avg DESC
LIMIT 10;

-- Subquery
SELECT name FROM students
WHERE marks > (SELECT AVG(marks) FROM students);
\`\`\`

### Key Concepts: ACID | Transactions | Constraints | Indexes | Views | Triggers`,

  'er diagram': `## ER Diagram (Entity-Relationship)

### Components:
| Symbol | Represents |
|--------|-----------|
| Rectangle | Entity (strong) |
| Double Rectangle | Weak Entity |
| Ellipse | Attribute |
| Double Ellipse | Multi-valued Attribute |
| Dashed Ellipse | Derived Attribute |
| Diamond | Relationship |
| Double Diamond | Identifying Relationship |

### Cardinality:
- **1:1** — One student has one ID card
- **1:N** — One dept has many students
- **M:N** — Students enroll in many courses; courses have many students

### Participation:
- **Total (Double line)** — Every entity must participate
- **Partial (Single line)** — Some entities may not participate`,

  'transaction': `## Database Transactions & ACID

A **transaction** is a unit of work that must be completed fully or not at all.

### ACID Properties:
| Property | Meaning |
|----------|---------|
| **Atomicity** | All operations complete or none do (Rollback) |
| **Consistency** | DB moves from one valid state to another |
| **Isolation** | Concurrent transactions don't interfere |
| **Durability** | Committed transactions survive crashes |

### Concurrency Problems:
- **Dirty Read** — Read uncommitted data
- **Non-repeatable Read** — Same query gives different results
- **Phantom Read** — New rows appear in re-read

### Isolation Levels (weakest → strongest):
Read Uncommitted → Read Committed → Repeatable Read → Serializable`,

  // ── Computer Networks ─────────────────────────────────────────────────────
  'osi model': `## OSI Model — 7 Layers

| Layer | Name | Protocols / Devices |
|-------|------|---------------------|
| 7 | Application | HTTP, HTTPS, FTP, SMTP, DNS, DHCP |
| 6 | Presentation | SSL/TLS, JPEG, MPEG, ASCII, Encryption |
| 5 | Session | NetBIOS, RPC, NFS |
| 4 | Transport | TCP, UDP, Ports, Segmentation |
| 3 | Network | IP, ICMP, ARP, Routers |
| 2 | Data Link | Ethernet, MAC, Switches, Frames |
| 1 | Physical | Cables, Hubs, Bits, Repeaters |

**Mnemonic (Top→Bottom):** "**A**ll **P**eople **S**eem **T**o **N**eed **D**ata **P**rocessing"

### TCP vs UDP:
| | TCP | UDP |
|-|-----|-----|
| Connection | Yes (3-way handshake) | No |
| Reliability | Guaranteed | Not guaranteed |
| Order | Guaranteed | Not guaranteed |
| Speed | Slower | Faster |
| Use | HTTP, FTP, Email | Streaming, DNS, VoIP |`,

  'tcp ip': `## TCP/IP Protocol Suite

### 4-Layer Model:
| Layer | Protocols |
|-------|-----------|
| Application | HTTP, HTTPS, FTP, SMTP, DNS, Telnet |
| Transport | TCP, UDP |
| Internet | IP (IPv4/IPv6), ICMP, ARP, RARP |
| Network Access | Ethernet, Wi-Fi, PPP |

### TCP 3-Way Handshake:
\`\`\`
Client            Server
  |---  SYN  --->  |
  |<-- SYN-ACK ---  |
  |---  ACK  --->  |
  |  Connection  ✅ |
\`\`\`

### IP Addressing:
- **IPv4:** 32-bit, 4 octets (e.g., 192.168.1.1)
- **IPv6:** 128-bit, 8 groups of 4 hex digits
- **Subnetting:** CIDR notation (e.g., 192.168.1.0/24)
- **NAT:** Maps private IPs to public IP`,

  'routing': `## Routing Algorithms

### Static vs Dynamic Routing:
- **Static:** Admin configures manually, no overhead
- **Dynamic:** Routers exchange info, adapt to changes

### Distance Vector (RIP):
- Each router knows distance to neighbors
- Uses **Bellman-Ford** algorithm
- Problem: **Count-to-infinity** (slow convergence)

### Link State (OSPF):
- Each router knows full topology
- Uses **Dijkstra's algorithm**
- Faster convergence, more memory

### BGP (Border Gateway Protocol):
- Used between ISPs / autonomous systems
- Path vector protocol

### Routing Table:
| Dest Network | Subnet Mask | Next Hop | Interface |
|---|---|---|---|
| 192.168.1.0 | /24 | — | eth0 |
| 0.0.0.0 | /0 | 10.0.0.1 | eth1 |`,

  // ── Algorithms ─────────────────────────────────────────────────────────────
  'dynamic programming': `## Dynamic Programming (DP)

**Idea:** Break problem into subproblems, store results to avoid recomputation.

### Two Approaches:
- **Top-down (Memoization):** Recursive + cache results
- **Bottom-up (Tabulation):** Fill table iteratively

### Classic VTU Problems:
| Problem | Complexity |
|---------|-----------|
| Fibonacci | O(n) |
| 0/1 Knapsack | O(nW) |
| Longest Common Subsequence (LCS) | O(mn) |
| Longest Increasing Subsequence (LIS) | O(n²) or O(n log n) |
| Matrix Chain Multiplication | O(n³) |
| Edit Distance | O(mn) |
| Coin Change | O(n × amount) |

\`\`\`python
# 0/1 Knapsack
def knapsack(W, wt, val, n):
    dp = [[0]*(W+1) for _ in range(n+1)]
    for i in range(1, n+1):
        for w in range(W+1):
            dp[i][w] = dp[i-1][w]
            if wt[i-1] <= w:
                dp[i][w] = max(dp[i][w], val[i-1] + dp[i-1][w-wt[i-1]])
    return dp[n][W]
\`\`\``,

  'divide conquer': `## Divide and Conquer

**Idea:** Divide → Solve sub-problems → Combine results.

### Master Theorem: T(n) = aT(n/b) + f(n)
- If f(n) = O(n^(log_b a - ε)) → T(n) = Θ(n^(log_b a))
- If f(n) = Θ(n^(log_b a)) → T(n) = Θ(n^(log_b a) × log n)
- If f(n) = Ω(n^(log_b a + ε)) → T(n) = Θ(f(n))

### Examples:
| Algorithm | Recurrence | Complexity |
|-----------|-----------|-----------|
| Merge Sort | T(n) = 2T(n/2) + O(n) | O(n log n) |
| Binary Search | T(n) = T(n/2) + O(1) | O(log n) |
| Strassen Matrix Mult | T(n) = 7T(n/2) + O(n²) | O(n^2.81) |`,

  // ── Machine Learning / AI ─────────────────────────────────────────────────
  'machine learning': `## Machine Learning — VTU Module 6 / 7

### Types:
| Type | Description | Examples |
|------|-------------|---------|
| **Supervised** | Labeled data, learns mapping X→Y | Regression, Classification |
| **Unsupervised** | No labels, find structure | Clustering, PCA |
| **Reinforcement** | Agent + environment, maximize reward | Q-Learning, DQN |
| **Semi-supervised** | Few labeled + many unlabeled | SSL methods |

### Key Algorithms:
- **Linear/Logistic Regression** — Simple, interpretable
- **Decision Tree** — Easy to understand, prone to overfitting
- **SVM** — Maximizes margin, good for high-dim
- **K-NN** — Instance-based, no training
- **Naive Bayes** — Probabilistic, fast
- **Neural Networks** — Multi-layer perceptron, backprop

### Bias-Variance Tradeoff:
- **High Bias (Underfitting)** → Model too simple → Increase complexity
- **High Variance (Overfitting)** → Model memorizes → Regularization, more data`,

  'neural network': `## Neural Networks & Deep Learning

### Architecture:
\`\`\`
Input Layer → Hidden Layers → Output Layer
  (features)    (transformations)  (predictions)
\`\`\`

### Activation Functions:
| Function | Formula | Use Case |
|----------|---------|----------|
| Sigmoid | 1/(1+e^-x) | Binary classification output |
| ReLU | max(0, x) | Hidden layers (most common) |
| Tanh | (e^x-e^-x)/(e^x+e^-x) | Hidden layers |
| Softmax | e^xi / Σe^xj | Multi-class output |

### Training:
1. **Forward Pass** → compute output
2. **Loss Function** → MSE (regression), Cross-Entropy (classification)
3. **Backpropagation** → compute gradients
4. **Gradient Descent** → update weights (SGD, Adam, RMSprop)

### CNN:
- Conv → ReLU → Pooling → Flatten → Dense
- Used for: Image recognition, object detection`,

  // ── Software Engineering ───────────────────────────────────────────────────
  'sdlc': `## Software Development Life Cycle (SDLC)

### Phases:
1. **Requirements** — Gather & analyze user needs (SRS document)
2. **Design** — System & detailed design (HLD, LLD)
3. **Implementation** — Coding
4. **Testing** — Unit, Integration, System, UAT
5. **Deployment** — Release to production
6. **Maintenance** — Bug fixes, enhancements

### SDLC Models:
| Model | When to Use |
|-------|------------|
| Waterfall | Well-defined requirements, no changes |
| V-Model | Quality-critical systems, clear requirements |
| Prototype | Unclear requirements |
| Spiral | High-risk projects, large scale |
| Agile | Changing requirements, iterative delivery |
| RAD | Quick delivery, modular systems |

### Agile:
- Scrum: Sprints (2-4 weeks), Daily standup, Backlog
- Kanban: Visual board, WIP limits`,

  'design patterns': `## Software Design Patterns

### Creational Patterns:
| Pattern | Intent |
|---------|--------|
| **Singleton** | One instance only |
| **Factory** | Create objects without specifying exact class |
| **Abstract Factory** | Create families of related objects |
| **Builder** | Construct complex objects step by step |
| **Prototype** | Clone existing objects |

### Structural Patterns:
| Pattern | Intent |
|---------|--------|
| **Adapter** | Convert interface to another |
| **Decorator** | Add behavior dynamically |
| **Facade** | Simplify complex subsystem |
| **Proxy** | Placeholder/surrogate |

### Behavioral Patterns:
| Pattern | Intent |
|---------|--------|
| **Observer** | Notify dependents on state change |
| **Strategy** | Define a family of interchangeable algorithms |
| **Command** | Encapsulate request as object |
| **Iterator** | Traverse collection without knowing structure |`,

  // ── Computer Organization ──────────────────────────────────────────────────
  'computer organization': `## Computer Organization & Architecture

### Basic Computer:
- **CPU Components:** ALU, Control Unit, Registers (PC, IR, ACC, MAR, MDR)
- **Bus Types:** Data bus, Address bus, Control bus

### Instruction Formats:
\`\`\`
3-Address: op R1, R2, R3
2-Address: op R1, R2   (R1 ← R1 op R2)
1-Address: op X        (ACC ← ACC op X)
0-Address: op          (Stack-based)
\`\`\`

### Addressing Modes:
| Mode | Example | EA |
|------|---------|-----|
| Immediate | ADD #5 | Operand in instruction |
| Direct | ADD 200 | EA = 200 |
| Indirect | ADD (200) | EA = Memory[200] |
| Register | ADD R1 | EA = R1 |
| Indexed | ADD X(R1) | EA = X + R1 |

### Pipelining:
- IF → ID → EX → MEM → WB (5-stage)
- **Hazards:** Structural, Data, Control
- **Speedup:** n × k / (k + n - 1) ≈ k for large n`,

  // ── Electronics / ECE ──────────────────────────────────────────────────────
  'digital circuits': `## Digital Electronics & Logic Design

### Number Systems:
- Binary (base 2), Octal (base 8), Hexadecimal (base 16)
- **2's Complement** = invert bits + 1 (used for signed integers)

### Logic Gates:
| Gate | Symbol | Expression |
|------|--------|-----------|
| AND | · | A·B |
| OR | + | A+B |
| NOT | ¬ | Ā |
| NAND | ↑ | (A·B)' — Universal gate |
| NOR | ↓ | (A+B)' — Universal gate |
| XOR | ⊕ | A'B + AB' |
| XNOR | ⊙ | AB + A'B' |

### Karnaugh Map (K-Map):
- Used to minimize Boolean expressions
- Group 1s in powers of 2 (1, 2, 4, 8...)
- Wrap-around allowed (torus)

### Flip-Flops:
- **SR:** Set-Reset, forbidden state when S=R=1
- **D:** Data latch, Q follows D on clock
- **JK:** Eliminates forbidden state (toggles on J=K=1)
- **T:** Toggle flip-flop (T=1 → toggle, T=0 → hold)`,

  'signals systems': `## Signals & Systems (ECE)

### Signal Types:
- **Continuous-time (CT):** x(t), defined for all t
- **Discrete-time (DT):** x[n], defined for integer n
- **Periodic:** x(t+T) = x(t)
- **Energy signal:** E < ∞, Power = 0
- **Power signal:** P < ∞, E = ∞

### Fourier Series:
\`x(t) = a₀ + Σ [aₙcos(nω₀t) + bₙsin(nω₀t)]\`
- **Dirichlet conditions** must be satisfied
- Represents periodic signals as sum of harmonics

### Fourier Transform:
- X(ω) = ∫ x(t) e^(-jωt) dt
- Used for spectral analysis of aperiodic signals

### LTI Systems:
- Linear + Time-Invariant
- Characterized by impulse response h(t) or h[n]
- Output: y(t) = x(t) * h(t) (convolution)
- **Stable:** h(t) absolutely integrable`,

  // ── Mathematics ────────────────────────────────────────────────────────────
  'calculus': `## Engineering Calculus — Key Topics

### Limits & Continuity:
- L'Hôpital's Rule: lim f/g = lim f'/g' (0/0 or ∞/∞ forms)
- Continuity: lim_{x→a} f(x) = f(a)

### Derivatives:
| Function | Derivative |
|----------|-----------|
| xⁿ | nxⁿ⁻¹ |
| eˣ | eˣ |
| ln x | 1/x |
| sin x | cos x |
| cos x | -sin x |
| tan x | sec²x |

### Integration Techniques:
- Substitution: ∫f(g(x))g'(x)dx
- Integration by Parts: ∫u dv = uv - ∫v du
- Partial Fractions: decompose rational functions

### Multivariable:
- Partial derivatives, gradient ∇f
- Double/Triple integrals (area, volume)
- Green's, Stokes', Divergence theorems`,

  'linear algebra': `## Linear Algebra — Engineering Mathematics

### Matrix Operations:
- **Addition/Subtraction:** Element-wise (same dimensions)
- **Multiplication:** (m×n)(n×p) = (m×p)
- **Transpose:** A^T — reflect about diagonal
- **Inverse:** A⁻¹ exists iff det(A) ≠ 0
- **Rank:** Max linearly independent rows/columns

### Determinants:
- 2×2: ad - bc
- 3×3: Cofactor expansion along any row/column
- Properties: det(AB) = det(A)·det(B), det(A^T) = det(A)

### Eigenvalues & Eigenvectors:
\`\`\`
Ax = λx
(A - λI)x = 0
det(A - λI) = 0  → characteristic equation
\`\`\`
- **Application:** PCA, stability analysis, Google PageRank

### System of Linear Equations:
- Gaussian Elimination, Gauss-Jordan
- Cramer's Rule (small systems)
- Consistent/Inconsistent/Infinitely many solutions`,

  // ── Exam Tips ──────────────────────────────────────────────────────────────
  'exam tips': `## VTU Exam Preparation Strategy 🎓

### VTU Exam Pattern:
- **Internal:** 50 marks (2 CIAs + Lab)
- **External Theory:** 50 marks (3-hour paper, choose 5 from 8 questions)
- **Passing:** 40% in each component separately

### Preparation Plan:
1. **Weeks 1-2:** Cover all 5 modules from syllabus
2. **Week 3:** Previous year question papers (last 5 years)
3. **Week 4:** Revision — important formulas, diagrams, algorithms

### Common VTU Question Types (10 marks):
- **Algorithm questions:** Write pseudocode + trace with example
- **Concept questions:** Define + explain + example + diagram
- **Problem-solving:** Step-by-step with all workings shown
- **Comparison tables:** Always include when comparing concepts

### Exam Day Tips:
- ✅ Start with questions you know best
- ✅ Include **diagrams** — they fetch extra marks
- ✅ Write complexity analysis for algorithms
- ✅ For DBMS: show normalization steps clearly
- ✅ For Networks: draw protocol diagrams
- ✅ Manage time: ~20 min per 10-mark question`,

  'vtu': `## About VTU (Visvesvaraya Technological University)

### Quick Facts:
- Established: 1998 | Headquarters: Belagavi, Karnataka
- Autonomous university governing 200+ affiliated colleges
- NAAC Accredited: A++

### Semester System:
- **Odd Semesters:** July–December (Exams: Nov–Dec)
- **Even Semesters:** January–June (Exams: May–June)
- 8 semesters for B.E. / B.Tech (4 years)

### Scheme (CBCS 2021 onwards):
- Credits per semester: ~20-24
- Minimum credits to graduate: ~160
- SGPA/CGPA on 10-point scale

### Important Resources:
- **VTU e-learning:** vtu.ac.in/e-learning
- **Question Papers:** vtupucc.com / vtucode.in
- **Notes:** vturesource.com / bookspar.com
- **NPTEL:** For video lectures on any topic

### Branches Available:
CSE, ISE, AIML, DS, CS, ECE, EEE, EIE, ME, CV, CH, BT, AE, AS, BM, RA, IEM, EN, AU, ARCH`,
}

function findAnswer(msg: string, subjectCtx: string): string {
  const lower = msg.toLowerCase()

  // Find best matching topic
  for (const [key, answer] of Object.entries(KB)) {
    const keywords = key.split(' ')
    if (keywords.every(k => lower.includes(k)) || lower.includes(key)) {
      return answer
    }
  }

  // Partial match
  for (const [key, answer] of Object.entries(KB)) {
    const keywords = key.split(' ')
    if (keywords.some(k => k.length > 4 && lower.includes(k))) {
      return answer
    }
  }

  // Context-aware generic
  const ctx = subjectCtx ? `\n*Context: ${subjectCtx}*\n` : ''
  return `## VTU AI Assistant — "${msg}"
${ctx}
I can help with these VTU topics. Try asking about:

### 📘 Core CS/IT:
- **Data Structures:** Big O, Binary Tree, Linked List, Stack/Queue, Graph, Sorting, QuickSort
- **Algorithms:** Dynamic Programming, Divide & Conquer
- **OS:** Deadlock, Process Scheduling, Memory Management
- **DBMS:** Normalization, SQL, ER Diagram, Transactions
- **Networks:** OSI Model, TCP/IP, Routing

### 🤖 Advanced:
- **Machine Learning:** Types, algorithms, Neural Networks
- **Software Engineering:** SDLC, Design Patterns
- **Computer Organization:** Pipelining, Addressing Modes

### 📡 Electronics:
- **Digital Circuits:** Logic gates, K-Map, Flip-Flops
- **Signals & Systems:** Fourier Series/Transform, LTI

### 📐 Mathematics:
- **Calculus:** Derivatives, Integration, Multivariate
- **Linear Algebra:** Matrices, Eigenvalues

### 🎓 VTU Specific:
- **Exam Tips:** Strategy, paper pattern, time management
- **VTU:** Info about university, schemes, resources

**Pro Tip:** Use specific keywords like "explain quicksort", "SQL joins example", "OSI model table" for detailed answers!`
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
      if (subject) subjectContext = `${subject.name}${subject.description ? ': ' + subject.description : ''}`
    }

    // Try OpenAI if key available
    if (c.env.OPENAI_API_KEY) {
      try {
        const messages: any[] = [
          {
            role: 'system',
            content: `You are an expert VTU (Visvesvaraya Technological University, India) academic assistant for engineering students. Help with all engineering subjects taught at VTU. ${subjectContext ? `Current subject: ${subjectContext}.` : ''} Provide structured markdown answers with code examples, tables, and diagrams in ASCII where helpful. Be thorough and exam-focused.`
          },
          ...(history || []).slice(-6),
          { role: 'user', content: message }
        ]

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${c.env.OPENAI_API_KEY}` },
          body: JSON.stringify({ model: 'gpt-3.5-turbo', messages, max_tokens: 1000, temperature: 0.6 })
        })

        if (response.ok) {
          const data: any = await response.json()
          const reply = data.choices?.[0]?.message?.content || ''
          if (reply) {
            await c.env.DB.prepare(`UPDATE users SET points = points + 5 WHERE id = ?`).bind(user.id).run()
            return c.json({ reply, source: 'openai' })
          }
        }
      } catch (e) { /* fallthrough to local */ }
    }

    // Local knowledge base
    const reply = findAnswer(message, subjectContext)
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
    const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 30).slice(0, 7)
    const summary = `## 📝 AI Summary — ${subject || 'General Topic'}

### Key Points:
${sentences.map((s: string) => `- ${s.trim()}`).join('\n')}

### Study Tips:
1. Review this content in relation to your VTU syllabus module
2. Practice related questions from previous year papers
3. Draw diagrams or flowcharts to remember visually
4. Test yourself with the Quiz section on this topic`
    return c.json({ summary })
  } catch (e: any) { return c.json({ error: e.message }, 500) }
})

ai.get('/topics', (c) => {
  return c.json({ topics: Object.keys(KB) })
})

export default ai
