const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

function getUuidRange(prefix) {
    let start = prefix.toLowerCase();
    let end = prefix.toLowerCase();

    while (start.length < 36) {
        if (start.length === 8 || start.length === 13 || start.length === 18 || start.length === 23) {
            start += '-';
            end += '-';
        } else {
            start += '0';
            end += 'f';
        }
    }
    return { start, end };
}

async function test() {
    const prefix = "fbfe552a";
    const { start, end } = getUuidRange(prefix);
    console.log("Range:", { start, end });

    const { data, error } = await supabase
        .from('orders')
        .select('id')
        .gte('id', start)
        .lte('id', end)
        .limit(1);

    console.log("Result with range:", { data, error });
}
test().catch(console.error);
