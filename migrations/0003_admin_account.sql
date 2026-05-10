UPDATE users
SET
  name = 'harshavardan T',
  password_hash = '5a4516772f66e18d01b05c9568f84ab94ba3c6de76289f5aa8070c7734555774',
  role = 'admin',
  branch = 'CSE',
  semester = 8,
  points = 9999,
  level = 10,
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE email = 'harsha7411156@gmail.com';

UPDATE users
SET
  name = 'harshavardan T',
  email = 'harsha7411156@gmail.com',
  password_hash = '5a4516772f66e18d01b05c9568f84ab94ba3c6de76289f5aa8070c7734555774',
  role = 'admin',
  branch = 'CSE',
  semester = 8,
  points = 9999,
  level = 10,
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE (email = 'admin@vtu.edu.in' OR id = 1)
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'harsha7411156@gmail.com');

INSERT INTO users (name, email, password_hash, role, branch, semester, points, level, is_active)
SELECT
  'harshavardan T',
  'harsha7411156@gmail.com',
  '5a4516772f66e18d01b05c9568f84ab94ba3c6de76289f5aa8070c7734555774',
  'admin',
  'CSE',
  8,
  9999,
  10,
  1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'harsha7411156@gmail.com');

UPDATE users
SET role = 'student'
WHERE role = 'admin' AND email <> 'harsha7411156@gmail.com';
