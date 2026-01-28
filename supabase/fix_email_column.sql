-- Add missing email column to customers logic (if we wanted to persist it)
-- BUT since orders table expects it, we should add it there or remove the constraint? 
-- The user said "Failed to submit order". The API change I made fixed the code side.
-- Ideally we add the column back.

-- 1. Add email to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- 2. Add email to customers (optional for future)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;
