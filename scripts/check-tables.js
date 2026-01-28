const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local manually
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    }
} catch (e) { }

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
    console.log("Checking tables...");

    // Check users
    const { data: users, error: usersError } = await supabase.from('users').select('count').limit(1);
    console.log("Users table:", usersError ? "MISSING (" + usersError.message + ")" : "EXISTS");

    // Check admins
    const { data: admins, error: adminsError } = await supabase.from('admins').select('count').limit(1);
    console.log("Admins table:", adminsError ? "MISSING (" + adminsError.message + ")" : "EXISTS");
}

checkTables();
