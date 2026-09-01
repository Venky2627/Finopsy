import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rzjuliwodvqrirowywcx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_kD0A4LnjXqZjiXOSlPiZ7w_7DU2AWXZ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
