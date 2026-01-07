# Supabase Database Setup Guide

This guide will help you set up the Supabase database for the Attar Al Jannah application.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Fill in the project details:
   - **Name**: Attar Al Jannah
   - **Database Password**: (choose a strong password)
   - **Region**: Choose closest to your location
4. Wait for the project to be created (~2 minutes)

## 2. Get Your API Keys

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **anon public** key
   - **service_role** key (keep this secret!)

3. Create a `.env.local` file in your project root with these values:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Create Database Tables

Go to **SQL Editor** in your Supabase dashboard and run these SQL commands:

### Users Table

```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'student', 'customer')) DEFAULT 'customer',
  address TEXT,
  total_sales INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster lookups
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
```

### Orders Table

```sql
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES users(id),
  referred_by UUID REFERENCES users(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price DECIMAL(10, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cod', 'upi')) NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'verified')) DEFAULT 'pending',
  order_status TEXT CHECK (order_status IN ('pending', 'confirmed', 'delivered')) DEFAULT 'pending',
  payment_screenshot_url TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_referred_by ON orders(referred_by);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_status ON orders(order_status);
```

### Challenge Progress Table

```sql
CREATE TABLE challenge_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES users(id) UNIQUE NOT NULL,
  verified_sales INTEGER DEFAULT 0,
  goal INTEGER DEFAULT 20,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index
CREATE INDEX idx_challenge_progress_student_id ON challenge_progress(student_id);
```

### Update Timestamp Trigger

```sql
-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for orders table
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for challenge_progress table
CREATE TRIGGER update_challenge_progress_updated_at BEFORE UPDATE ON challenge_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 4. Create Storage Bucket for Payment Screenshots

1. Go to **Storage** in your Supabase dashboard
2. Click "Create Bucket"
3. Name it: `payment-screenshots`
4. Make it **public** (so admins can view screenshots)
5. Click "Create Bucket"

### Set Storage Policies

Go to the bucket's policies and add this policy:

```sql
-- Allow anyone to upload
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment-screenshots');

-- Allow anyone to read
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-screenshots');
```

## 5. Set Row Level Security (RLS) Policies

For now, we'll disable RLS for development. In production, you should enable proper policies.

```sql
-- Disable RLS for development (enable in production with proper policies)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress DISABLE ROW LEVEL SECURITY;
```

## 6. Insert Sample Data

### Create Admin User

```sql
INSERT INTO users (name, phone, role, address)
VALUES ('Admin User', '9999999999', 'admin', 'Admin Office');
```

### Create Sample Students

```sql
INSERT INTO users (name, phone, role, address)
VALUES 
  ('Student One', '9876543210', 'student', 'Student Address 1'),
  ('Student Two', '9876543211', 'student', 'Student Address 2');
```

### Initialize Challenge Progress for Students

```sql
INSERT INTO challenge_progress (student_id, verified_sales, goal)
SELECT id, 0, 20
FROM users
WHERE role = 'student';
```

## 7. Test the Connection

Run your Next.js app:

```bash
npm run dev
```

Visit `http://localhost:3000` and try:
1. Placing an order
2. Logging in as a student (use phone: `9876543210`)
3. Viewing the dashboard

## Troubleshooting

### Connection Issues
- Make sure your `.env.local` file has the correct values
- Restart your development server after adding environment variables

### Permission Errors
- Check that RLS is disabled for development
- Verify storage bucket policies are set correctly

### Data Not Showing
- Check the Supabase dashboard **Table Editor** to verify data was inserted
- Look at the browser console and terminal for error messages

## Production Deployment

Before deploying to production:

1. **Enable RLS** and create proper policies
2. **Secure the service role key** - never expose it to the client
3. **Add authentication** for admin panel
4. **Set up email notifications** for order updates
5. **Configure backup policies** for your database

---

Your database is now set up and ready to use! 🎉
