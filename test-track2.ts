import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const prefix = "fbfe552a";
  const start = `${prefix}-0000-0000-0000-000000000000`;
  const end = `${prefix}-ffff-ffff-ffff-ffffffffffff`;

  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .gte('id', start)
    .lte('id', end)
    .limit(1);
    
  console.log("Result with range:", { data, error });
}
test().catch(console.error);
