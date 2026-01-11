# How to Import CSV File in Supabase - Step by Step

## Method 1: Using Supabase Dashboard (GUI) - EASIEST!

### Step 1: Go to Table Editor
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **"Table Editor"** in left sidebar
4. Click on **"users"** table

### Step 2: Import CSV
1. Look for the **"..."** (three dots) menu at top right of the table
2. Click **"Insert"** → **"Import data from CSV"**
3. Click **"Choose File"** and select `students-template.csv`
4. Review the column mapping
5. Click **"Import"**
6. ✅ Done!

**Note:** This only works if the CSV columns match your table columns exactly.

---

## Method 2: Using SQL Editor (More Flexible) - RECOMMENDED

This method gives you more control and works better for our student data.

### Step 1: Create Script

I've already created the script in `add-students-bulk.sql`. Here's the simplified version:

```sql
-- 1. Create temporary table
CREATE TEMP TABLE temp_students (
  student_id TEXT,
  name TEXT,
  phone TEXT,
  email TEXT,
  password TEXT
);

-- 2. Copy CSV data (you'll paste CSV rows here)
INSERT INTO temp_students (student_id, name, phone, email, password) VALUES
('STU001', 'Student 001', '9999990001', 'student001@attarchallenge.com', 'student123'),
('STU002', 'Student 002', '9999990002', 'student002@attarchallenge.com', 'student123'),
('STU003', 'Student 003', '9999990003', 'student003@attarchallenge.com', 'student123');
-- Add all 50 rows...

-- 3. Insert into users table with password encryption
INSERT INTO users (phone, email, password_hash, user_role, student_id, name)
SELECT 
  phone,
  email,
  crypt(password, gen_salt('bf')),
  'student',
  student_id,
  name
FROM temp_students;

-- 4. Clean up
DROP TABLE temp_students;
```

### Step 2: Execute in SQL Editor

1. Go to **"SQL Editor"** in Supabase
2. Click **"New query"**
3. Paste the script above
4. Click **"Run"** (or press Ctrl+Enter)
5. ✅ Students imported!

---

## Method 3: Bulk Auto-Generate (FASTEST!)

**Skip the CSV entirely!** Just run this:

### Complete Script (Copy & Paste)

```sql
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
      crypt('student123', gen_salt('bf')),
      'student',
      'STU' || LPAD(counter::TEXT, 3, '0'),
      'Student ' || LPAD(counter::TEXT, 3, '0')
    );
  END LOOP;
  
  -- Initialize student stats
  INSERT INTO student_stats (student_id, total_referrals, total_sales)
  SELECT student_id, 0, 0
  FROM users
  WHERE user_role = 'student'
  ON CONFLICT (student_id) DO NOTHING;
  
END $$;

-- Verify
SELECT COUNT(*) as total FROM users WHERE user_role = 'student';
SELECT student_id, name, email FROM users WHERE user_role = 'student' LIMIT 10;
```

### Steps:
1. Supabase → SQL Editor
2. Paste script above
3. Click Run
4. Check output - should show 50 students created
5. ✅ Done in 10 seconds!

---

## Comparison

| Method | Difficulty | Time | Best For |
|--------|-----------|------|----------|
| Dashboard GUI | Easy | 2 min | Small datasets, matching columns |
| SQL + Manual CSV | Medium | 5 min | Custom data with transformations |
| Auto-generate | Easiest | 10 sec | Testing, placeholder data |

---

## My Recommendation for You

**Use Method 3 (Auto-generate)** because:
- ✅ Fastest - no CSV needed
- ✅ Passwords automatically encrypted
- ✅ Stats table auto-initialized
- ✅ No manual data entry
- ✅ Can update names later

**After creation:**
1. Export student list for reference
2. Share credentials with students
3. Students can update their profiles

---

## Verify Students Created

Run this in SQL Editor:

```sql
-- Count students
SELECT COUNT(*) FROM users WHERE user_role = 'student';

-- View all students
SELECT student_id, name, email, phone 
FROM users 
WHERE user_role = 'student'
ORDER BY student_id;

-- Test login (check if password works)
SELECT student_id, name 
FROM users 
WHERE student_id = 'STU001' 
AND password_hash = crypt('student123', password_hash);
```

---

## Export Student List (After Import)

To get a list of all students with credentials:

```sql
SELECT 
  student_id as "Student ID",
  name as "Name",
  'student123' as "Password",
  email as "Email"
FROM users
WHERE user_role = 'student'
ORDER BY student_id;
```

Copy results to Excel/Google Sheets and share with students!

---

## Troubleshooting

**"Permission denied"**
- Run `multi-auth-schema.sql` first to create tables

**"Duplicate key"**
- Student IDs must be unique
- Check for existing students first

**"Function crypt does not exist"**
- Enable pgcrypto extension:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  ```

**CSV import fails**
- Use Method 3 instead (auto-generate)
- Or manually insert with SQL

---

## Quick Start Now

**Copy this entire block and run in SQL Editor:**

```sql
-- Enable encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create 50 students
DO $$
DECLARE counter INT;
BEGIN
  FOR counter IN 1..50 LOOP
    INSERT INTO users (phone, email, password_hash, user_role, student_id, name)
    VALUES (
      '999999' || LPAD(counter::TEXT, 4, '0'),
      'student' || LPAD(counter::TEXT, 3, '0') || '@attarchallenge.com',
      crypt('student123', gen_salt('bf')),
      'student',
      'STU' || LPAD(counter::TEXT, 3, '0'),
      'Student ' || LPAD(counter::TEXT, 3, '0')
    );
  END LOOP;
END $$;

-- Initialize stats
INSERT INTO student_stats (student_id, total_referrals, total_sales)
SELECT student_id, 0, 0 FROM users WHERE user_role = 'student'
ON CONFLICT DO NOTHING;

-- Show results
SELECT student_id, name FROM users WHERE user_role = 'student' ORDER BY student_id;
```

✅ That's it! 50 students created with 1 click!
