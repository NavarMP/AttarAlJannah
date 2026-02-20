const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Manually parse .env.local
const envConfig = fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .reduce((acc, line) => {
        const [key, ...value] = line.split('=');
        if (key && value) acc[key.trim()] = value.join('=').trim().replace(/"/g, '');
        return acc;
    }, {});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupOrphanedAuthUsers() {
    console.log('Starting cleanup of orphaned volunteer Auth users...');

    try {
        // 1. Fetch all users from Supabase Auth
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) throw authError;

        // 2. Fetch all volunteers from the public table (including soft-deleted ones)
        const { data: volunteers, error: volError } = await supabase
            .from('volunteers')
            .select('auth_id');

        if (volError) throw volError;

        // Create a set of active auth IDs that belong to volunteers
        const validVolunteerAuthIds = new Set(
            volunteers
                .filter(v => v.auth_id !== null)
                .map(v => v.auth_id)
        );

        console.log(`Total users in Auth: ${users.length}`);
        console.log(`Total Volunteer Auth IDs in database: ${validVolunteerAuthIds.size}`);

        let deletedCount = 0;
        let failedCount = 0;

        // 3. Find and delete orphaned Auth users who have the volunteer role
        for (const user of users) {
            const isVolunteer = user.user_metadata?.role === 'volunteer';

            if (isVolunteer && !validVolunteerAuthIds.has(user.id)) {
                console.log(`Processing orphaned volunteer: ${user.email} (ID: ${user.id})`);

                const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

                if (deleteError) {
                    console.error(`❌ Failed to delete ${user.id}: ${deleteError.message}`);
                    failedCount++;
                } else {
                    console.log(`✅ Successfully deleted orphaned user: ${user.id}`);
                    deletedCount++;
                }
            }
        }

        console.log('\n--- Cleanup Summary ---');
        console.log(`Deleted: ${deletedCount}`);
        console.log(`Failed: ${failedCount}`);
        console.log('-----------------------');

    } catch (err) {
        console.error('An error occurred during cleanup:', err);
    }
}

cleanupOrphanedAuthUsers();
