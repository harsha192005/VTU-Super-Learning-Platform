-- Additional resources with real VTU PDF links
INSERT OR IGNORE INTO resources (title, description, type, branch_code, semester, file_url, file_name, tags, is_important, uploaded_by) VALUES
('Data Structures Notes - Module 1', 'Arrays, Linked Lists, Stacks, Queues with examples', 'notes', 'CSE', 3, 'https://www.vtucode.in/files/ds-module1.pdf', 'ds-module1.pdf', '["arrays","linked list","stack","queue"]', 1, 1),
('Data Structures Notes - Module 2', 'Trees, Binary Trees, BST, AVL Trees', 'notes', 'CSE', 3, 'https://www.vtucode.in/files/ds-module2.pdf', 'ds-module2.pdf', '["trees","BST","AVL"]', 1, 1),
('DBMS Notes - Complete', 'Complete DBMS notes covering all 5 modules', 'notes', 'CSE', 4, 'https://www.vtucode.in/files/dbms-complete.pdf', 'dbms-complete.pdf', '["SQL","normalization","ER diagram","transactions"]', 1, 1),
('Computer Networks - Module 3', 'Network layer, IP addressing, routing protocols', 'notes', 'CSE', 4, 'https://www.vtucode.in/files/cn-module3.pdf', 'cn-module3.pdf', '["IP","routing","OSI"]', 1, 1),
('Operating Systems - Process Management', 'Process scheduling, deadlock, synchronization', 'notes', 'CSE', 4, 'https://www.vtucode.in/files/os-process.pdf', 'os-process.pdf', '["process","scheduling","deadlock"]', 1, 1),
('Machine Learning - Complete Notes', 'Supervised, unsupervised, deep learning concepts', 'notes', 'CSE', 6, 'https://www.vtucode.in/files/ml-notes.pdf', 'ml-notes.pdf', '["ML","AI","neural networks","deep learning"]', 1, 1),
('Algorithms - Design & Analysis', 'Greedy, DP, Backtracking, Branch & Bound', 'notes', 'CSE', 5, 'https://www.vtucode.in/files/algo-notes.pdf', 'algo-notes.pdf', '["algorithms","DP","greedy","complexity"]', 1, 1),
('CSE Sem 3 Syllabus 2021 Scheme', 'Official VTU syllabus for CSE Semester 3 (CBCS 2021)', 'syllabus', 'CSE', 3, 'https://www.vtu.ac.in/pdf/cbcs/2021/cse/sem3.pdf', 'cse-sem3-syllabus.pdf', '["syllabus","2021 scheme","CSE"]', 1, 1),
('CSE Sem 4 Syllabus 2021 Scheme', 'Official VTU syllabus for CSE Semester 4 (CBCS 2021)', 'syllabus', 'CSE', 4, 'https://www.vtu.ac.in/pdf/cbcs/2021/cse/sem4.pdf', 'cse-sem4-syllabus.pdf', '["syllabus","2021 scheme","CSE"]', 1, 1),
('Data Structures Textbook - Seymour Lipschutz', 'Schaum series DS textbook widely used for VTU', 'textbook', 'CSE', 3, 'https://ia800905.us.archive.org/12/items/schaum-series-data-structures/Schaum_Series_Data_Structures.pdf', 'lipschutz-ds.pdf', '["textbook","data structures","reference"]', 1, 1),
('DBMS Textbook - Ramakrishnan & Gehrke', 'Database Management Systems - Cow Book', 'textbook', 'CSE', 4, 'https://ia803405.us.archive.org/20/items/database-management-systems-3rd-edition/Database-Management-Systems-3rd-Edition.pdf', 'ramakrishnan-dbms.pdf', '["textbook","database","SQL"]', 1, 1),
('Operating Systems - Galvin Textbook', 'OS concepts by Abraham Silberschatz, Peter Galvin', 'textbook', 'CSE', 4, 'https://ia800304.us.archive.org/19/items/operating-system-concepts-10th-edition/Operating-System-Concepts-10th-Edition.pdf', 'galvin-os.pdf', '["textbook","OS","process management"]', 1, 1),
('VTU CSE Sem 3 QP Dec 2023', 'Data Structures & DBMS question paper Dec 2023', 'question_paper', 'CSE', 3, 'https://www.vtucode.in/qp/cse-sem3-dec2023.pdf', 'cse-sem3-dec2023.pdf', '["question paper","2023","sem3"]', 1, 1),
('VTU CSE Sem 4 QP June 2023', 'OS & CN question paper June 2023', 'question_paper', 'CSE', 4, 'https://www.vtucode.in/qp/cse-sem4-june2023.pdf', 'cse-sem4-june2023.pdf', '["question paper","2023","sem4"]', 1, 1),
('VTU CSE Sem 5 QP Dec 2023', 'Algorithms & CN question paper Dec 2023', 'question_paper', 'CSE', 5, 'https://www.vtucode.in/qp/cse-sem5-dec2023.pdf', 'cse-sem5-dec2023.pdf', '["question paper","2023","sem5"]', 1, 1),
('DS Lab Manual - VTU 2021', 'Practical experiments for Data Structures Lab', 'lab_manual', 'CSE', 3, 'https://www.vtucode.in/lab/ds-lab-manual.pdf', 'ds-lab-manual.pdf', '["lab","data structures","programs"]', 0, 1),
('DBMS Lab Manual - VTU 2021', 'SQL experiments and PL/SQL programs', 'lab_manual', 'CSE', 4, 'https://www.vtucode.in/lab/dbms-lab-manual.pdf', 'dbms-lab-manual.pdf', '["lab","SQL","PL/SQL","triggers"]', 0, 1),
('Web Technologies Lab Manual', 'HTML, CSS, JavaScript, PHP, MySQL experiments', 'lab_manual', 'CSE', 5, 'https://www.vtucode.in/lab/wt-lab-manual.pdf', 'wt-lab-manual.pdf', '["lab","HTML","CSS","JavaScript"]', 0, 1),
('ECE Signals & Systems Notes', 'Continuous & discrete signals, Fourier analysis', 'notes', 'ECE', 3, 'https://www.vtucode.in/files/ece-signals.pdf', 'ece-signals.pdf', '["signals","systems","Fourier","ECE"]', 1, 1),
('ECE Digital Electronics Notes', 'Logic gates, K-Map, flip-flops, counters', 'notes', 'ECE', 3, 'https://www.vtucode.in/files/ece-digital.pdf', 'ece-digital.pdf', '["digital","logic gates","flip-flop","ECE"]', 1, 1),
('AIML Deep Learning Notes', 'CNN, RNN, LSTM, GAN architectures', 'notes', 'AIML', 6, 'https://www.vtucode.in/files/aiml-deep-learning.pdf', 'aiml-deep-learning.pdf', '["deep learning","CNN","RNN","LSTM"]', 1, 1),
('Python Programming Notes', 'Python basics to advanced, OOP, file handling', 'notes', 'CSE', 3, 'https://www.vtucode.in/files/python-notes.pdf', 'python-notes.pdf', '["python","programming","OOP"]', 1, 1),
('Computer Networks Forouzan Textbook', 'Data Communications and Networking by Forouzan', 'textbook', 'CSE', 4, 'https://ia803102.us.archive.org/26/items/data-communications-and-networking-by-behrouz-a.forouzan-4th-edition/DataCommunicationsAndNetworkingByBehrouzA.ForouzanFourthEdition.pdf', 'forouzan-cn.pdf', '["textbook","networks","communication"]', 1, 1),
('VTU CSE All Previous Year QP Pack', 'Compiled QPs for CSE Sem 1-8 (2019-2023)', 'question_paper', 'CSE', 5, 'https://www.vtupucc.com/qp-pack/cse-all.pdf', 'cse-all-qps.pdf', '["question papers","all semesters","CSE","important"]', 1, 1),
('VTU Mathematics-1 Notes', 'Calculus, Linear Algebra for all branches', 'notes', 'CSE', 1, 'https://www.vtucode.in/files/maths1-notes.pdf', 'maths1-notes.pdf', '["mathematics","calculus","linear algebra","sem1"]', 1, 1);

-- Additional quiz questions for existing quizzes
INSERT OR IGNORE INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, marks) VALUES
-- Data Structures (quiz 1) - additional
(1, 'What is the time complexity of inserting at the beginning of a doubly linked list?', 'O(1)', 'O(n)', 'O(log n)', 'O(n²)', 'a', 'Insertion at the head only requires updating the head pointer and next/prev links, which is O(1).', 1),
(1, 'Which data structure uses LIFO (Last In First Out) principle?', 'Queue', 'Stack', 'Heap', 'Tree', 'b', 'A Stack follows LIFO - the last element pushed is the first to be popped.', 1),
(1, 'The height of a complete binary tree with n nodes is:', 'O(n)', 'O(n²)', 'O(log n)', 'O(1)', 'c', 'A complete binary tree is balanced, so its height is floor(log₂n).', 1),

-- OS quiz (quiz 2) - additional
(2, 'Which scheduling algorithm has the minimum average waiting time?', 'FCFS', 'Round Robin', 'SJF', 'Priority', 'c', 'SJF (Shortest Job First) is proven to give the minimum average waiting time among all non-preemptive algorithms.', 1),
(2, 'Which of the following is NOT one of the Coffman conditions for deadlock?', 'Mutual Exclusion', 'Hold and Wait', 'Round Robin', 'Circular Wait', 'c', 'The four Coffman conditions are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.', 1),
(2, 'In virtual memory, what happens when a required page is not in RAM?', 'Program crashes', 'Page fault occurs', 'CPU halts', 'OS restarts', 'b', 'A page fault interrupt is generated, and the OS loads the required page from disk into RAM.', 1),

-- DBMS SQL Quiz (quiz 3) - additional  
(3, 'Which normal form eliminates transitive dependencies?', '1NF', '2NF', '3NF', 'BCNF', 'c', '3NF eliminates transitive dependencies (non-key attributes depending on other non-key attributes).', 1),
(3, 'What does the HAVING clause do in SQL?', 'Filters rows before grouping', 'Filters groups after GROUP BY', 'Sorts the result', 'Joins two tables', 'b', 'HAVING filters groups created by GROUP BY, similar to WHERE but for aggregated results.', 1),
(3, 'Which SQL command is used to remove a table permanently?', 'DELETE', 'TRUNCATE', 'DROP', 'REMOVE', 'c', 'DROP TABLE removes the table structure and all data permanently. TRUNCATE removes data but keeps structure.', 1),

-- ML Quiz (quiz 4) - additional
(4, 'What is the purpose of the activation function in neural networks?', 'Reduce computation', 'Add non-linearity', 'Initialize weights', 'Normalize data', 'b', 'Activation functions introduce non-linearity, allowing neural networks to learn complex patterns.', 1),
(4, 'Which algorithm is used to train neural networks?', 'Gradient Descent', 'Binary Search', 'Bubble Sort', 'Dijkstra', 'a', 'Backpropagation combined with Gradient Descent (or variants like Adam, SGD) is used to train neural networks.', 1),
(4, 'What is overfitting in machine learning?', 'Model performs well on all data', 'Model too simple for data', 'Model memorizes training data but fails on test data', 'Model trains too slowly', 'c', 'Overfitting occurs when a model learns noise in training data and fails to generalize to new data.', 1),

-- Networks (quiz 5) - additional
(5, 'Which layer of the OSI model is responsible for routing?', 'Physical', 'Data Link', 'Network', 'Transport', 'c', 'The Network layer (Layer 3) handles logical addressing (IP) and routing between networks.', 1),
(5, 'What is the size of an IPv4 address?', '16 bits', '32 bits', '64 bits', '128 bits', 'b', 'IPv4 uses 32-bit addresses, typically written as 4 octets in dotted decimal notation.', 1),
(5, 'What does DNS stand for?', 'Data Network System', 'Domain Name System', 'Dynamic Network Service', 'Distributed Node System', 'b', 'DNS (Domain Name System) translates human-readable domain names to IP addresses.', 1);

-- Additional exam countdowns
INSERT OR IGNORE INTO exam_countdowns (title, description, exam_date, branch_code) VALUES
('VTU CBCS Sem 7 Theory Exams', 'End semester examinations for all 7th semester students', '2026-11-25', NULL),
('VTU Supplementary Exams 2026', 'Supplementary/re-sit examinations for all branches', '2026-07-15', NULL),
('Internal Assessment Test 2 - Sem 5', 'CIA-2 for 5th semester students', '2026-09-20', NULL),
('VTU Even Sem Result Declaration', 'Expected date for Even Semester results (tentative)', '2026-08-10', NULL);
