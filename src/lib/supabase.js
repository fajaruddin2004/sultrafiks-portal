import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// KATA KUNCI 'export const supabase' INI YANG BIKIN ERROR KALAU HILANG
export const supabase = createClient(supabaseUrl, supabaseKey);