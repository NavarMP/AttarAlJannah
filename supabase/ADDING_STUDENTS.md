# Adding 50 Students - Quick Guide

## 🚀 Fastest Way: Run SQL Script (2 minutes)

Just created `supabase/add-students-bulk.sql` with 3 methods to add students.

### Option A: Auto-Generate 50 Students (EASIEST!)

**What you get:**
- Student IDs: STU001, STU002, ..., STU050
- Names: Student 001, Student 002, ...
- Emails: student001@attarchallenge.com, etc.
- Phones: 9999990001, 9999990002, ... (fake numbers)
- Password: **`student123`** (same for all)

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the code from bottom of `add-students-bulk.sql` (the uncommented DO block)
3. Paste and click "Run"
4. ✅ Done! 50 students created instantly

**Student can login with:**
- Student ID: `STU001`
- Password: `student123`

---

## Option B: CSV Import (For Real Student Data)

If you have actual student names, emails, etc.

### Step 1: Prepare CSV File

Create `students.csv`:
```csv
student_id,name,phone,email,password
STU001,Ahmed Ali,9876543211,ahmed@school.com,ahmed123
STU002,Fatima Jan,9876543212,fatima@school.com,fatima123
STU003,Hassan Raza,9876543213,hassan@school.com,hassan123
...
```

### Step 2: Import via Supabase

1. Supabase Dashboard → SQL Editor
2. Run the temp table creation from the SQL file
3. Then import your CSV
4. Run the INSERT INTO users command

---

## Option C: Manual Entry via Admin Panel (Future)

I can create an admin page where you can:
- Add students one by one via form
- Upload CSV file
- Edit student details
- Reset passwords

**Want me to build this?** It'll take 10-15 minutes.

---

## 📝 What You Need to Decide

Before running the SQL:

### 1. Student ID Format
- **Auto (STU001-STU050)** - Use Option A
- **Custom (Roll numbers, etc.)** - Use Option B/C

### 2. Passwords
- **Same for all (`student123`)** - Simplest, students can change later
- **Unique per student** - More secure, but you need to track them

### 3. Contact Info
- **Fake emails/phones** - For testing, Option A
- **Real data** - Use Option B with CSV

---

## 🎯 My Recommendation for You

**Use Option A (Auto-generate)** because:
1. ✅ Fastest - runs in 2 seconds
2. ✅ No data prep needed
3. ✅ Can update details later
4. ✅ Gets you testing immediately

**Then later:**
- Give each student their ID and password
- They can update their profile
- Add admin panel to manage them

---

## After Adding Students

### Share Credentials with Students

Create a spreadsheet:
```
| Student ID | Password  | Referral Link |
|-----------|-----------|---------------|
| STU001    | student123| yourdomain.com/order?ref=STU001 |
| STU002    | student123| yourdomain.com/order?ref=STU002 |
```

### Test Student Login

1. Go to `/login`
2. Click "Student Login"
3. Student ID: `STU001`
4. Password: `student123`
5. Should go to student dashboard!

---

## What to do NOW

**Choose one:**

**A)** Run the SQL script for auto-generation (fastest!)
```sql
-- Go to Supabase SQL Editor and run the DO block from the file
```

**B)** Give me your student data and I'll create the CSV import

**C)** Ask me to build an admin panel for student management

Which option do you prefer?
