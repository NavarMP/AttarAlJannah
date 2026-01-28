const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local manually
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        console.log('📄 Loading .env.local...');
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    }
} catch (e) {
    console.warn('⚠️ Could not load .env.local:', e.message);
}

// Config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = 'admin@attaraljannah.com';
const DEFAULT_PASSWORD = 'admin'; // Simple password for dev

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing Environment Variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function setupAdmin() {
    console.log('🔄 Checking Admin User Status...');

    // 1. Check if user exists (by listing users - requires service role)
    // Supabase Auth doesn't have a simple "get by email" for admin without using listUsers or getUserById
    // We can try to signIn? No, creating is safer check.

    // List users to find admin
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('❌ Failed to list users:', listError.message);
        return;
    }

    const adminUser = users.find(u => u.email === ADMIN_EMAIL);

    if (adminUser) {
        console.log('✅ Admin user already exists:', adminUser.id);
        console.log('ℹ️  If you cannot login, you may need to reset the password.');
        console.log('   Do you want to reset password to "admin"? (y/n)');

        // In a script we can't interact easily, so we'll just update it forcefully for now since this is a "Fix" script
        console.log('🔄 Resetting Admin Password to:', DEFAULT_PASSWORD);
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            adminUser.id,
            { password: DEFAULT_PASSWORD }
        );

        if (updateError) {
            console.error('❌ Failed to update password:', updateError.message);
        } else {
            console.log('✅ Password updated successfully!');
        }
    } else {
        console.log('⚠️ Admin user does not exist. Creating...');

        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: DEFAULT_PASSWORD,
            email_confirm: true
        });

        if (createError) {
            console.error('❌ Failed to create admin user:', createError.message);
        } else {
            console.log('✅ Admin user created successfully!');
            console.log('📧 Email:', ADMIN_EMAIL);
            console.log('🔑 Password:', DEFAULT_PASSWORD);
        }
    }
}

setupAdmin();
