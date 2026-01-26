# Admin Authentication - Supabase Auth Setup Guide

## What Changed

Admin authentication now uses **Supabase Authentication** instead of a custom table-based system.

### Before
- Admin email/password stored in `users` table
- Plain text password comparison
- No proper session management

### After
- Admin credentials managed by Supabase Authentication
- Secure password hashing (handled by Supabase)
- Proper session management
- Role verification via `users` table

---

## Setup Steps

### 1. Run the Migration

```bash
cd /Users/apple/Desktop/Web/attar-alJannah
supabase db push
```

This will:
- Remove `password_hash` column from `users` table
- Create admin role entry for `navarmp@gmail.com`

### 2. Create Admin User in Supabase Authentication

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication → Users**
4. Click **"Add user"** or **"Invite"**
5. Fill in:
   - **Email**: `navarmp@gmail.com` (must match users table)
   - **Password**: Your secure admin password
   - **Auto Confirm User**: ✅ Enable this
6. Click **"Create user"** or **"Send invitation"**

**Option B: Via SQL**

Run this in Supabase SQL Editor:
```sql
-- This uses Supabase's auth.users table
-- Password will be automatically hashed
SELECT auth.create_user(
    email := 'navarmp@gmail.com',
    password := 'YourSecurePassword123!',
    email_confirm := true
);
```

### 3. Test Login

1. Navigate to `/admin/login`
2. Enter:
   - **Email**: `navarmp@gmail.com`
   - **Password**: (the password you set in Supabase)
3. Click "Sign In"
4. ✅ Should redirect to `/admin/dashboard`

---

## How It Works

### Authentication Flow

```
1. User enters email/password
   ↓
2. API calls supabase.auth.signInWithPassword()
   ↓
3. Supabase verifies credentials
   ↓
4. API checks users table for role
   ↓
5. If role = 'admin' → Grant access
   If role ≠ 'admin' → Sign out & deny
```

### Code Changes

#### Login API ([route.ts](file:///Users/apple/Desktop/Web/attar-alJannah/app/api/admin/auth/login/route.ts))
```typescript
// Authenticate with Supabase
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
});

// Verify admin role
const { data: userRole } = await supabase
    .from("users")
    .select("user_role, name")
    .eq("email", email)
    .single();

if (userRole?.user_role !== "admin") {
    await supabase.auth.signOut(); // Deny access
}
```

#### Auth Context ([auth-context.tsx](file:///Users/apple/Desktop/Web/attar-alJannah/lib/contexts/auth-context.tsx))
- Checks for existing Supabase session on mount
- Listens to auth state changes
- Verifies admin role from `users` table
- Auto-signs out non-admins

---

## Database Structure

### Supabase Authentication (auth.users)
- Stores: email, password (hashed), metadata
- Handles: Login, sessions, password reset
- Managed by: Supabase

### Users Table (public.users)
- Stores: email, name, user_role, phone
- Purpose: Role tracking and user metadata
- No passwords stored here!

### Role Mapping
```
auth.users (navarmp@gmail.com)
    ↓ (verified via email)
public.users (email: navarmp@gmail.com, user_role: 'admin')
    ↓
Admin access granted
```

---

## Adding More Admins

To add another admin:

1. **Create Supabase Auth user**:
   - Dashboard → Authentication → Users → Add user
   - Set email and password
   - Auto-confirm

2. **Add admin role to users table**:
   ```sql
   INSERT INTO users (email, name, user_role, phone)
   VALUES ('another@admin.com', 'Admin Name', 'admin', '0000000000')
   ON CONFLICT (email) DO UPDATE SET user_role = 'admin';
   ```

3. Done! They can now login.

---

## Security Benefits

✅ **Password Security**
- Passwords hashed with bcrypt by Supabase
- No plain text storage

✅ **Session Management**
- Secure JWT-based sessions
- Automatic expiration
- Refresh token rotation

✅ **Two-Factor Auth Ready**
- Can enable 2FA in Supabase dashboard

✅ **Password Reset**
- Built-in forgot password flow
- Secure email-based reset

---

## Troubleshooting

### "Invalid email or password"
- Check email/password in Supabase Dashboard → Authentication → Users
- Ensure user is confirmed (auto-confirm enabled)

### "Access denied. Admin privileges required."
- User exists in Supabase Auth but not in `users` table
- Or `user_role` ≠ 'admin'
- Solution: Add/update entry in `users` table

### "Session expired"
- Supabase sessions expire after inactivity
- Solution: Login again

---

## Migration Checklist

- [x] Updated login API to use Supabase Auth
- [x] Updated auth context for session management  
- [x] Created migration to remove password_hash
- [ ] Run migration: `supabase db push`
- [ ] Create admin user in Supabase Authentication
- [ ] Test admin login
- [ ] Remove old admin entries from users table (if any)

---

## Next Steps (Optional)

1. **Enable 2FA**: Supabase Dashboard → Authentication → Settings
2. **Email Templates**: Customize password reset emails
3. **Rate Limiting**: Configure in Supabase settings
4. **Audit Log**: Track admin actions (separate implementation)
