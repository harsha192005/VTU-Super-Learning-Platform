-- VTU Super Learning Platform - Seed Data

-- Admin User (password: Harsha#19)
INSERT OR IGNORE INTO users (name, email, password_hash, role, branch, semester, points, level) VALUES
('harshavardan T', 'harsha7411156@gmail.com', '5a4516772f66e18d01b05c9568f84ab94ba3c6de76289f5aa8070c7734555774', 'admin', 'CSE', 8, 9999, 10);

-- Student Users (password: Student@123)
INSERT OR IGNORE INTO users (name, email, password_hash, role, branch, semester, points, level, streak) VALUES
('Rahul Kumar', 'rahul@student.vtu.ac.in', '$2a$10$studenthashedpassword12345', 'student', 'CSE', 5, 1250, 3, 7),
('Priya Sharma', 'priya@student.vtu.ac.in', '$2a$10$studenthashedpassword12345', 'student', 'ISE', 3, 980, 2, 12),
('Arjun Patel', 'arjun@student.vtu.ac.in', '$2a$10$studenthashedpassword12345', 'student', 'ECE', 4, 750, 2, 3),
('Sneha Reddy', 'sneha@student.vtu.ac.in', '$2a$10$studenthashedpassword12345', 'student', 'AI & ML', 6, 2100, 4, 21);

-- Branches
INSERT OR IGNORE INTO branches (code, name, category, description, icon) VALUES
('CSE', 'Computer Science & Engineering', 'Computer & IT', 'Core CS with programming, algorithms, OS, and networks', '💻'),
('ISE', 'Information Science & Engineering', 'Computer & IT', 'Information systems, databases, software engineering', '🖥️'),
('AIML', 'Artificial Intelligence & Machine Learning', 'Computer & IT', 'AI, ML, deep learning, data science applications', '🤖'),
('DS', 'Data Science', 'Computer & IT', 'Data analytics, visualization, big data processing', '📊'),
('CS', 'Cyber Security', 'Computer & IT', 'Network security, ethical hacking, cryptography', '🔒'),
('ECE', 'Electronics & Communication Engineering', 'Electronics & Electrical', 'Signals, circuits, VLSI, communication systems', '📡'),
('EEE', 'Electrical & Electronics Engineering', 'Electronics & Electrical', 'Power systems, machines, control systems', '⚡'),
('EIE', 'Electronics & Instrumentation Engineering', 'Electronics & Electrical', 'Sensors, process control, measurement systems', '🔬'),
('ME', 'Mechanical Engineering', 'Core Engineering', 'Thermodynamics, manufacturing, machine design', '⚙️'),
('CV', 'Civil Engineering', 'Core Engineering', 'Structures, transportation, geotechnical engineering', '🏗️'),
('CH', 'Chemical Engineering', 'Core Engineering', 'Process engineering, reaction kinetics, separations', '🧪'),
('IEM', 'Industrial Engineering & Management', 'Core Engineering', 'Operations research, quality management, IE tools', '📈'),
('AE', 'Aeronautical Engineering', 'Specialized', 'Aerospace structures, propulsion, aerodynamics', '✈️'),
('AS', 'Aerospace Engineering', 'Specialized', 'Space systems, orbital mechanics, spacecraft design', '🚀'),
('AU', 'Automobile Engineering', 'Specialized', 'Vehicle dynamics, engine design, automotive systems', '🚗'),
('BT', 'Biotechnology', 'Specialized', 'Genetic engineering, bioprocessing, bioinformatics', '🧬'),
('BM', 'Biomedical Engineering', 'Specialized', 'Medical devices, biosignals, health informatics', '🏥'),
('EN', 'Environmental Engineering', 'Specialized', 'Pollution control, water treatment, sustainability', '🌿'),
('RA', 'Robotics & Automation', 'Specialized', 'Robotics, PLC, automation systems', '🦾'),
('ARCH', 'Bachelor of Architecture', 'Architecture', 'Architectural design, urban planning, structures', '🏛️');

-- CSE Subjects (Semester 1-8)
INSERT OR IGNORE INTO subjects (code, name, branch_code, semester, credits, description) VALUES
-- Semester 1
('21MAT11', 'Calculus and Linear Algebra', 'CSE', 1, 4, 'Differential calculus, integral calculus, linear algebra basics'),
('21PHY12', 'Engineering Physics', 'CSE', 1, 4, 'Modern physics, quantum mechanics, semiconductor devices'),
('21CHE11', 'Engineering Chemistry', 'CSE', 1, 4, 'Electrochemistry, polymers, fuels and combustion'),
('21CIV13', 'Engineering Graphics', 'CSE', 1, 1, 'Projections, sectional views, isometric drawing'),
('21ELN15', 'Basic Electronics', 'CSE', 1, 3, 'Diodes, transistors, digital electronics'),
-- Semester 2
('21MAT21', 'Advanced Calculus and Numerical Methods', 'CSE', 2, 4, 'Vector calculus, Fourier series, numerical methods'),
('21ELE22', 'Elements of Electrical Engineering', 'CSE', 2, 4, 'DC circuits, AC circuits, electrical machines'),
('21CSL28', 'C Programming Lab', 'CSE', 2, 1, 'Programming in C language practical sessions'),
('21MATDIP41', 'Additional Mathematics', 'CSE', 2, 0, 'Engineering mathematics supplementary'),
-- Semester 3
('21CS32', 'Data Structures and Applications', 'CSE', 3, 4, 'Arrays, linked lists, trees, graphs, sorting algorithms'),
('21CS33', 'Computer Organization', 'CSE', 3, 4, 'Digital logic, processor design, memory organization'),
('21CS34', 'Discrete Mathematics', 'CSE', 3, 4, 'Logic, sets, graphs, combinatorics, relations'),
('21CS35', 'Software Engineering', 'CSE', 3, 3, 'SDLC, design patterns, project management'),
('21CS36', 'Database Management Systems', 'CSE', 3, 3, 'ER model, SQL, normalization, transactions'),
-- Semester 4
('21CS42', 'Analysis and Design of Algorithms', 'CSE', 4, 4, 'Algorithm design paradigms, complexity analysis'),
('21CS43', 'Operating Systems', 'CSE', 4, 4, 'Process management, memory management, file systems'),
('21CS44', 'Microprocessors', 'CSE', 4, 4, '8086 architecture, assembly language, interfacing'),
('21CS45', 'Object Oriented Concepts', 'CSE', 4, 3, 'OOP principles, Java programming, design patterns'),
('21CS46', 'Computer Networks', 'CSE', 4, 3, 'OSI model, TCP/IP, routing, network security'),
-- Semester 5
('21CS51', 'Automata Theory and Computability', 'CSE', 5, 4, 'Finite automata, pushdown automata, Turing machines'),
('21CS52', 'Computer Graphics', 'CSE', 5, 3, '2D/3D transformations, rendering, OpenGL'),
('21CS53', 'System Software', 'CSE', 5, 3, 'Assemblers, loaders, compilers, linkers'),
('21CS54', 'Artificial Intelligence', 'CSE', 5, 3, 'Search algorithms, knowledge representation, ML basics'),
('21CS55', 'Cryptography and Network Security', 'CSE', 5, 3, 'Encryption, public key, digital signatures, protocols'),
-- Semester 6
('21CS61', 'Compiler Design', 'CSE', 6, 4, 'Lexical analysis, parsing, semantic analysis, code generation'),
('21CS62', 'Data Communication', 'CSE', 6, 3, 'Signals, transmission media, error detection, protocols'),
('21CS63', 'Machine Learning', 'CSE', 6, 3, 'Supervised/unsupervised learning, neural networks'),
('21CS64', 'Cloud Computing', 'CSE', 6, 3, 'Cloud architecture, virtualization, AWS/GCP services'),
('21CS65', 'Internet of Things', 'CSE', 6, 3, 'IoT architecture, sensors, protocols, applications'),
-- Semester 7
('21CS71', 'Big Data Analytics', 'CSE', 7, 3, 'Hadoop, Spark, MapReduce, data warehousing'),
('21CS72', 'Deep Learning', 'CSE', 7, 3, 'CNN, RNN, transformers, generative models'),
('21CSP78', 'Project Work Phase 1', 'CSE', 7, 2, 'Final year project initiation and planning'),
-- Semester 8
('21CSP88', 'Project Work Phase 2', 'CSE', 8, 10, 'Final year project implementation and viva'),
('21CS81', 'Professional Ethics', 'CSE', 8, 2, 'Engineering ethics, legal aspects, social responsibility');

-- ECE Subjects
INSERT OR IGNORE INTO subjects (code, name, branch_code, semester, credits, description) VALUES
('21EC32', 'Network Analysis', 'ECE', 3, 4, 'Circuit theorems, network functions, Laplace transforms'),
('21EC33', 'Electronic Devices', 'ECE', 3, 4, 'BJT, FET, op-amps, semiconductor devices'),
('21EC34', 'Signals and Systems', 'ECE', 3, 4, 'Fourier, Laplace, Z-transform, LTI systems'),
('21EC42', 'Analog Electronics', 'ECE', 4, 4, 'Amplifiers, oscillators, analog IC design'),
('21EC43', 'Digital Signal Processing', 'ECE', 4, 4, 'DFT, FFT, FIR/IIR filters, DSP applications'),
('21EC44', 'VLSI Design', 'ECE', 4, 4, 'CMOS logic, layout design, FPGA programming'),
('21EC53', 'Communication Systems', 'ECE', 5, 4, 'AM/FM modulation, digital communications, multiplexing'),
('21EC54', 'Microwave Engineering', 'ECE', 5, 3, 'Microwave transmission, antennas, radar systems');

-- Quizzes
INSERT OR IGNORE INTO quizzes (title, description, subject_id, branch_code, semester, duration_minutes, total_questions, passing_score, difficulty, created_by) VALUES
('Data Structures Fundamentals', 'Test your knowledge of arrays, linked lists, and trees', 11, 'CSE', 3, 20, 10, 60, 'medium', 1),
('Operating Systems Concepts', 'Process management, scheduling, and memory concepts', 13, 'CSE', 4, 25, 10, 60, 'medium', 1),
('DBMS SQL Quiz', 'SQL queries, normalization, and transactions', 16, 'CSE', 3, 15, 10, 70, 'easy', 1),
('Machine Learning Basics', 'Supervised learning, algorithms, model evaluation', 23, 'CSE', 6, 30, 10, 65, 'hard', 1),
('Computer Networks MCQ', 'OSI model, protocols, routing, and security', 15, 'CSE', 4, 20, 10, 60, 'medium', 1);

-- Quiz Questions - Data Structures
INSERT OR IGNORE INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
(1, 'What is the time complexity of binary search?', 'O(n)', 'O(log n)', 'O(n²)', 'O(1)', 'b', 'Binary search divides the search space in half each iteration, giving O(log n) complexity.'),
(1, 'Which data structure uses LIFO order?', 'Queue', 'Array', 'Stack', 'Linked List', 'c', 'Stack follows Last-In-First-Out (LIFO) principle where the last element pushed is the first to be popped.'),
(1, 'What is the height of a complete binary tree with n nodes?', 'n', 'log₂n', '√n', 'n/2', 'b', 'A complete binary tree with n nodes has height floor(log₂n).'),
(1, 'Which traversal visits left subtree, root, then right subtree?', 'Preorder', 'Postorder', 'Level order', 'Inorder', 'd', 'Inorder traversal: Left → Root → Right, which gives sorted output for BST.'),
(1, 'What is the worst case time complexity of quicksort?', 'O(n log n)', 'O(n)', 'O(n²)', 'O(log n)', 'c', 'Quicksort worst case occurs when pivot is always smallest/largest element, giving O(n²).'),
(1, 'A queue is implemented using a circular array of size n. What is the max number of elements?', 'n', 'n+1', 'n-1', 'n/2', 'c', 'To distinguish full from empty state in circular queue, one slot is wasted, so max elements = n-1.'),
(1, 'Which sorting algorithm is stable AND has O(n log n) worst case?', 'Quicksort', 'Heapsort', 'Merge Sort', 'Shell Sort', 'c', 'Merge sort is stable and guarantees O(n log n) in all cases.'),
(1, 'What is a hash collision?', 'Two identical keys', 'Two different keys mapped to same index', 'A failed hash function', 'An empty hash table', 'b', 'Hash collision occurs when two different keys produce the same hash index.'),
(1, 'In a min-heap, the root element is?', 'Maximum', 'Minimum', 'Median', 'Average', 'b', 'In a min-heap, the root always contains the minimum element of the entire heap.'),
(1, 'What is the space complexity of merge sort?', 'O(1)', 'O(log n)', 'O(n)', 'O(n²)', 'c', 'Merge sort requires O(n) extra space for the temporary arrays during merging.');

-- Quiz Questions - OS
INSERT OR IGNORE INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
(2, 'Which scheduling algorithm can cause starvation?', 'Round Robin', 'FCFS', 'Priority Scheduling', 'SJF', 'c', 'Priority scheduling can cause starvation when low-priority processes never get CPU time if higher-priority processes keep arriving.'),
(2, 'What is a deadlock?', 'Process waiting for I/O', 'Two processes in infinite wait for resources held by each other', 'CPU idle state', 'Memory overflow', 'b', 'Deadlock occurs when processes wait indefinitely for resources held by each other.'),
(2, 'Page fault occurs when?', 'Page is in memory', 'Page is not in physical memory', 'Page table is full', 'TLB miss', 'b', 'A page fault occurs when a process accesses a page not currently in physical memory.'),
(2, 'Which page replacement algorithm has Beladys anomaly?', 'LRU', 'Optimal', 'FIFO', 'LFU', 'c', 'FIFO page replacement can show Belady anomaly where more frames can cause more page faults.'),
(2, 'What is thrashing?', 'High CPU utilization', 'Excessive page swapping causing low CPU utilization', 'Disk fragmentation', 'Memory leak', 'b', 'Thrashing occurs when the system spends more time swapping pages than executing processes.'),
(2, 'In semaphore, P() operation does?', 'Signals', 'Wait/Decrement', 'Initialize', 'Unlock', 'b', 'P() (proberen = test) decrements the semaphore and blocks if value becomes negative.'),
(2, 'Which memory allocation strategy causes external fragmentation?', 'Paging', 'Segmentation', 'Fixed partitioning', 'Demand paging', 'b', 'Segmentation uses variable-size partitions, leading to external fragmentation over time.'),
(2, 'What is context switching?', 'Switching between programs', 'Saving/restoring process state for CPU sharing', 'Interrupt handling', 'System call execution', 'b', 'Context switching saves the state of current process and restores state of next process to share CPU.'),
(2, 'Banker algorithm is used for?', 'Memory allocation', 'Deadlock avoidance', 'Page replacement', 'CPU scheduling', 'b', 'Banker algorithm is a deadlock avoidance algorithm that checks if resource allocation leads to safe state.'),
(2, 'Which is NOT a condition for deadlock?', 'Mutual exclusion', 'Hold and wait', 'Preemption', 'Circular wait', 'c', 'Preemption (ability to forcibly take resources) actually prevents deadlock. The four conditions for deadlock are: mutual exclusion, hold and wait, no preemption, circular wait.');

-- Badges
INSERT OR IGNORE INTO badges (name, description, icon, condition_type, condition_value) VALUES
('Quiz Rookie', 'Complete your first quiz', '🎯', 'quiz_score', 1),
('Perfect Score', 'Get 100% in any quiz', '💯', 'quiz_score', 100),
('Study Streak 7', '7 day study streak', '🔥', 'streak', 7),
('Study Streak 30', '30 day study streak', '🏆', 'streak', 30),
('Knowledge Seeker', 'Download 10 resources', '📚', 'downloads', 10),
('Point Master', 'Earn 1000 points', '⭐', 'points', 1000),
('Top Performer', 'Score 90%+ in 5 quizzes', '🥇', 'quiz_score', 90),
('Speed Learner', 'Complete quiz in under 5 minutes', '⚡', 'quiz_score', 1),
('Bookworm', 'Bookmark 20 resources', '🔖', 'downloads', 20),
('AI Explorer', 'Have 10 AI chat sessions', '🤖', 'points', 100);

-- Announcements
INSERT OR IGNORE INTO announcements (title, content, type, created_by) VALUES
('Welcome to VTU Super Learning Platform!', 'We are excited to launch the VTU Super Learning Platform. Explore AI-powered learning, quizzes, and resources for all VTU branches and semesters!', 'general', 1),
('VTU Exam Schedule Released', 'The semester exam schedule for Dec 2024 has been released. Check the exam countdown section for your upcoming exams.', 'exam', 1),
('New Resources Uploaded', '200+ new PDFs including notes, question papers, and lab manuals have been uploaded across all branches and semesters.', 'resource', 1),
('Campus Placement Season 2025', 'Campus placement season is starting! Check out company-wise preparation guides and practice aptitude questions in the Placement module.', 'placement', 1);

-- Placement Questions
INSERT OR IGNORE INTO placement_questions (question, answer, category, company, difficulty, tags) VALUES
('What is the time complexity of finding an element in a hash table?', 'O(1) average case, O(n) worst case due to collisions', 'technical', 'Google', 'easy', '["data-structures", "hashing", "complexity"]'),
('Explain the concept of dynamic programming.', 'DP is an optimization technique that solves complex problems by breaking them into simpler subproblems, storing results to avoid redundant computation (memoization/tabulation).', 'technical', 'Amazon', 'medium', '["algorithms", "dp", "optimization"]'),
('What is the difference between process and thread?', 'Process: independent program with own memory space. Thread: lightweight unit within process, sharing memory. Threads faster to create/switch but share vulnerabilities.', 'technical', 'Microsoft', 'medium', '["os", "concurrency", "systems"]'),
('A train travels 120km at 60kmph and returns at 40kmph. Find average speed.', 'Average speed = 2×60×40/(60+40) = 48 kmph (harmonic mean for equal distances)', 'aptitude', NULL, 'easy', '["speed", "time-distance", "arithmetic"]'),
('In a group of 6 boys and 4 girls, a committee of 4 must have at least 1 girl. How many ways?', '= Total ways - All boys = C(10,4) - C(6,4) = 210 - 15 = 195 ways', 'aptitude', NULL, 'medium', '["combinations", "counting", "probability"]'),
('Tell me about yourself.', 'Structured answer: Brief intro, academic background, key projects/internships, technical skills, career goals. Keep it 1-2 minutes, professional, and relevant to the role.', 'hr', NULL, 'easy', '["communication", "self-introduction", "hr"]'),
('Why do you want to join our company?', 'Research company values, recent achievements, products. Align your skills and career goals with company mission. Show genuine enthusiasm and specific knowledge.', 'hr', NULL, 'easy', '["motivation", "research", "hr"]'),
('Write code to reverse a linked list.', 'Iterative: Use three pointers (prev, curr, next). prev=null, while curr!=null: next=curr.next, curr.next=prev, prev=curr, curr=next. Return prev.', 'coding', 'Infosys', 'easy', '["linked-list", "reversal", "pointers"]'),
('Find the maximum subarray sum (Kadanes algorithm).', 'Initialize maxSum=arr[0], currentSum=arr[0]. For each element: currentSum=max(arr[i], currentSum+arr[i]), maxSum=max(maxSum,currentSum). Time: O(n)', 'coding', 'TCS', 'medium', '["arrays", "dynamic-programming", "kadane"]'),
('What are SOLID principles?', 'S-Single Responsibility, O-Open/Closed, L-Liskov Substitution, I-Interface Segregation, D-Dependency Inversion. Design principles for maintainable object-oriented code.', 'technical', 'Wipro', 'medium', '["design-patterns", "oop", "software-engineering"]');

-- Daily Challenges
INSERT OR IGNORE INTO daily_challenges (challenge_date, title, type, content, points_reward) VALUES
(date('now'), 'Todays Algorithm Challenge', 'mcq', '{"question":"What is the time complexity of finding the kth smallest element using a min-heap of n elements?","options":["O(k)","O(k log n)","O(n log k)","O(n)"],"correct":1,"explanation":"Building heap is O(n), then extracting min k times is O(k log n), total O(n + k log n) ≈ O(k log n)"}', 75),
(date('now', '-1 day'), 'Binary Tree Challenge', 'mcq', '{"question":"What is the maximum number of nodes in a binary tree of height h?","options":["2h","2h - 1","2h+1 - 1","h2"],"correct":2,"explanation":"A full binary tree of height h has 2^(h+1) - 1 nodes maximum."}', 50);

-- Exam Countdowns
INSERT OR IGNORE INTO exam_countdowns (title, branch_code, semester, exam_date, description, created_by) VALUES
('VTU Theory Exams - Dec 2024', NULL, NULL, date('now', '+45 days'), 'VTU semester theory examinations for all branches and semesters', 1),
('CSE Internal Assessment 2', 'CSE', NULL, date('now', '+15 days'), 'Second internal assessment test for all CSE subjects', 1),
('VTU Lab Examinations', NULL, NULL, date('now', '+30 days'), 'Practical/Lab examinations for all engineering branches', 1);

-- Sample Resources (using placeholder URLs)
INSERT OR IGNORE INTO resources (title, description, type, subject_id, branch_code, semester, file_url, file_name, tags, is_important, uploaded_by) VALUES
('Data Structures Complete Notes - Module 1', 'Comprehensive notes covering arrays, linked lists, stacks and queues with examples', 'notes', 11, 'CSE', 3, 'https://www.africau.edu/images/default/sample.pdf', 'DS_Module1_Notes.pdf', '["arrays","linked-list","stack","queue"]', 1, 1),
('DBMS Previous Year Question Papers 2023', '5 year collection of VTU DBMS question papers with solutions', 'question_paper', 16, 'CSE', 3, 'https://www.africau.edu/images/default/sample.pdf', 'DBMS_QP_2023.pdf', '["sql","normalization","transactions"]', 1, 1),
('Operating Systems Lab Manual', 'Complete lab manual for OS practicals - shell programming, process management', 'lab_manual', 13, 'CSE', 4, 'https://www.africau.edu/images/default/sample.pdf', 'OS_Lab_Manual.pdf', '["shell","process","semaphore"]', 0, 1),
('Machine Learning Textbook - Tom Mitchell', 'Classic ML textbook covering all fundamental algorithms', 'textbook', 23, 'CSE', 6, 'https://www.africau.edu/images/default/sample.pdf', 'ML_Tom_Mitchell.pdf', '["supervised","unsupervised","neural-networks"]', 1, 1),
('Computer Networks - VTU Syllabus 2021', 'Official VTU syllabus for Computer Networks subject', 'syllabus', 15, 'CSE', 4, 'https://www.africau.edu/images/default/sample.pdf', 'CN_Syllabus_2021.pdf', '["osi","tcp-ip","routing"]', 0, 1),
('Algorithms Analysis - Important Questions', 'Module-wise important questions for ADA exam preparation', 'question_paper', 12, 'CSE', 4, 'https://www.africau.edu/images/default/sample.pdf', 'ADA_ImportantQ.pdf', '["sorting","graph","dynamic-programming"]', 1, 1);

-- Study Progress for demo student
INSERT OR IGNORE INTO study_progress (user_id, subject_id, completion_percentage, last_studied, total_time_minutes) VALUES
(2, 11, 75.5, datetime('now', '-1 day'), 180),
(2, 12, 45.0, datetime('now', '-3 days'), 90),
(2, 13, 60.0, datetime('now', '-2 days'), 120),
(2, 16, 85.0, datetime('now'), 240);

-- Quiz Attempt for demo student
INSERT OR IGNORE INTO quiz_attempts (user_id, quiz_id, score, total_marks, percentage, time_taken, status, completed_at) VALUES
(2, 1, 8, 10, 80.0, 720, 'completed', datetime('now', '-2 days')),
(2, 3, 9, 10, 90.0, 540, 'completed', datetime('now', '-1 day')),
(3, 2, 7, 10, 70.0, 900, 'completed', datetime('now', '-3 days'));

-- Bookmarks
INSERT OR IGNORE INTO bookmarks (user_id, resource_id) VALUES
(2, 1), (2, 2), (2, 4), (3, 1), (3, 5), (4, 3);

-- Notifications
INSERT OR IGNORE INTO notifications (user_id, title, message, type) VALUES
(NULL, 'Welcome to VTU Platform!', 'Start your learning journey today with AI-powered study tools.', 'info'),
(2, 'Quiz Result Available', 'Your Data Structures quiz score: 80%. Great job!', 'success'),
(2, 'New Resource Uploaded', 'ML Textbook by Tom Mitchell has been added to your Semester 6 resources.', 'resource'),
(NULL, 'Daily Challenge Ready!', 'New daily challenge is available. Earn 75 bonus points today!', 'info');
