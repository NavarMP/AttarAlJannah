-- =====================================================
-- Admin Security, Audit Logging & Soft-Delete Migration
-- Date: 2026-02-20
-- =====================================================

-- =====================================================
-- 1. ADMIN USERS TABLE (Role-Based Access Control)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('super_admin', 'admin', 'viewer')) DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID,  -- References admin_users(id), added as FK below
    last_login_at TIMESTAMPTZ
);

-- Self-referencing FK for created_by
ALTER TABLE admin_users
    ADD CONSTRAINT fk_admin_users_created_by
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
    ON DELETE SET NULL;

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_auth_id ON admin_users(auth_id);
CREATE INDEX idx_admin_users_role ON admin_users(role);

-- Seed the super_admin account (navarmp@gmail.com)
INSERT INTO admin_users (email, name, role)
VALUES ('navarmp@gmail.com', 'Navar MP', 'super_admin')
ON CONFLICT (email) DO UPDATE SET role = 'super_admin', name = 'Navar MP';

-- Seed existing admin accounts as regular admins
INSERT INTO admin_users (email, name, role)
VALUES ('admin@attaraljannah.com', 'Admin', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';

INSERT INTO admin_users (email, name, role)
VALUES ('minhajuljanna@gmail.com', 'Minhajul Janna', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Disable RLS for admin_users (same pattern as other tables)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;


-- =====================================================
-- 2. AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,        -- 'create', 'update', 'delete', 'restore', 'login', 'bulk_delete', 'bulk_update', etc.
    entity_type TEXT NOT NULL,   -- 'order', 'volunteer', 'customer', 'delivery_zone', 'admin_user', etc.
    entity_id TEXT,              -- ID of affected record (or comma-separated for bulk)
    details JSONB,               -- Before/after snapshot, extra context
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;


-- =====================================================
-- 3. SOFT-DELETE COLUMNS
-- =====================================================

-- Orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_by TEXT;  -- admin email for simplicity

-- Volunteers
ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS deleted_by TEXT;

-- Customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_by TEXT;

-- Indexes for efficient soft-delete filtering
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_volunteers_deleted_at ON volunteers(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at) WHERE deleted_at IS NOT NULL;
