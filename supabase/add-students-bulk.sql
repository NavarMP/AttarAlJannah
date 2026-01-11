-- =====================================================
-- STUDENT BULK REGISTRATION
-- =====================================================

-- Method 1: Insert Students One by One
-- Replace the values with actual student data

-- Example student insertions:
INSERT INTO users (phone, email, password_hash, user_role, student_id, name)
VALUES 
  -- Student 1
  ('9999999001', 'student001@example.com', crypt('password123', gen_salt('bf')), 'student', 'STU001', 'Student Name 1'),
  
  -- Student 2
  ('9999999002', 'student002@example.com', crypt('password123', gen_salt('bf')), 'student', 'STU002', 'Student Name 2'),
  
  -- Student 3
  ('9999999003', 'student003@example.com', crypt('password123', gen_salt('bf')), 'student', 'STU003', 'Student Name 3');
  
  -- Add more students following the same pattern...

-- =====================================================
-- Method 2: Bulk Insert from CSV Format
-- =====================================================

-- First, create a temporary table to hold CSV data
CREATE TEMP TABLE temp_students (
  student_id TEXT,
  name TEXT,
  phone TEXT,
  email TEXT,
  password TEXT
);

-- Import from CSV (you'll do this in Supabase dashboard or via script)
-- CSV format: student_id,name,phone,email,password
-- Example CSV:
-- STU001,Ahmed Ali,9999999001,student001@school.com,pass123
-- STU002,Fatima Khan,9999999002,student002@school.com,pass456
-- STU003,Hassan Raza,9999999003,student003@school.com,pass789

-- After importing CSV to temp table, insert into users table:
INSERT INTO users (phone, email, password_hash, user_role, student_id, name)
SELECT 
  phone,
  email,
  crypt(password, gen_salt('bf')),
  'student',
  student_id,
  name
FROM temp_students;

-- Clean up temp table
DROP TABLE temp_students;

-- =====================================================
-- Method 3: Generate Students with Pattern
-- =====================================================

-- Generate 50 students with auto-generated IDs and default password
DO $$
DECLARE
  counter INT;
BEGIN
  FOR counter IN 1..50 LOOP
    INSERT INTO users (
      phone,
      email,
      password_hash,
      user_role,
      student_id,
      name
    ) VALUES (
      '999999' || LPAD(counter::TEXT, 4, '0'), -- Phone: 9999990001, 9999990002, etc.
      'student' || LPAD(counter::TEXT, 3, '0') || '@school.com', -- Email: student001@school.com
      crypt('student' || counter, gen_salt('bf')), -- Password: student1, student2, etc.
      'student',
      'STU' || LPAD(counter::TEXT, 3, '0'), -- Student ID: STU001, STU002, etc.
      'Student ' || counter -- Name: Student 1, Student 2, etc.
    );
  END LOOP;
END $$;

-- =====================================================
-- Verify Students Created
-- =====================================================

-- Check all students
SELECT 
  student_id,
  name,
  email,
  phone,
  user_role,
  created_at
FROM users 
WHERE user_role = 'student'
ORDER BY student_id;

-- Count total students
SELECT COUNT(*) as total_students 
FROM users 
WHERE user_role = 'student';

-- =====================================================
-- Initialize Student Stats
-- =====================================================

-- Create stats record for each student
INSERT INTO student_stats (student_id, total_referrals, total_sales)
SELECT 
  student_id,
  0,
  0
FROM users
WHERE user_role = 'student'
ON CONFLICT (student_id) DO NOTHING;

-- =====================================================
-- Student Login Examples
-- =====================================================

-- Students can login with:
-- Student ID: STU001
-- Password: student1 (or whatever password you set)

-- To update a student's password:
UPDATE users 
SET password_hash = crypt('newpassword123', gen_salt('bf'))
WHERE student_id = 'STU001';

-- =====================================================
-- Export Student List (for sharing credentials)
-- =====================================================

-- Generate CSV of student credentials (run this ONCE then save output)
SELECT 
  student_id as "Student ID",
  name as "Name",
  email as "Email",
  phone as "Phone",
  'student' || SUBSTRING(student_id FROM 4)::INT as "Password"
FROM users
WHERE user_role = 'student'
ORDER BY student_id;

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

/*
1. PASSWORDS ARE ENCRYPTED:
   - We use bcrypt (crypt function) to hash passwords
   - Original passwords cannot be retrieved
   - Store the plain passwords somewhere safe before encrypting!

2. STUDENT ID FORMAT:
   - Must be unique
   - Recommended: STU001, STU002, etc.
   - Or use roll numbers: 2024001, 2024002, etc.

3. EMAIL REQUIREMENT:
   - Each student needs a unique email for Supabase auth
   - Can be fake emails for testing: student001@school.com
   - For production, use real emails

4. PHONE REQUIREMENT:
   - Each student needs a unique phone
   - Can use fake numbers for testing: 9999999001
   - For production, use real numbers if needed

5. DEFAULT PASSWORDS:
   - Set all to same password initially: "student123"
   - Students can change later (feature to be added)
   - OR set unique passwords per student
*/

-- =====================================================
-- Quick Start: Add 50 Students Now!
-- =====================================================

-- Uncomment and run this to create 50 students instantly:

/*
DO $$
DECLARE
  counter INT;
BEGIN
  FOR counter IN 1..50 LOOP
    INSERT INTO users (
      phone,
      email,
      password_hash,
      user_role,
      student_id,
      name
    ) VALUES (
      '999999' || LPAD(counter::TEXT, 4, '0'),
      'student' || LPAD(counter::TEXT, 3, '0') || '@attarchallenge.com',
      crypt('student123', gen_salt('bf')), -- Same password for all: "student123"
      'student',
      'STU' || LPAD(counter::TEXT, 3, '0'),
      'Student ' || LPAD(counter::TEXT, 3, '0')
    );
  END LOOP;
  
  -- Initialize their stats
  INSERT INTO student_stats (student_id, total_referrals, total_sales)
  SELECT student_id, 0, 0
  FROM users
  WHERE user_role = 'student'
  ON CONFLICT (student_id) DO NOTHING;
  
END $$;

-- Verify
SELECT COUNT(*) as "Total Students Created" FROM users WHERE user_role = 'student';
SELECT student_id, name, email FROM users WHERE user_role = 'student' LIMIT 10;
*/
