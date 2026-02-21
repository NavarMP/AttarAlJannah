const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const SUPABASE_URL = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  console.log("Starting test...");
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .filter('id::text', 'ilike', 'fbfe552a%')
    .limit(1);

  console.log("Result with id::text", { data, error });

  if (error) {
    const { data: d2, error: e2 } = await supabase
      .from('orders')
      .select('id')
      .like('id', 'fbfe552a%')
      .limit(1);
    console.log("Result with simple like", { data: d2, error: e2 });
  }
}
test().catch(console.error);
