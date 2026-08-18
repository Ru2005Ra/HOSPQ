const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to your backend .env file.');
  }
  return supabase;
}

function requireSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase service role key is not configured. Add SUPABASE_SERVICE_ROLE_KEY to your backend .env file.');
  }
  return supabaseAdmin;
}

module.exports = { supabase, supabaseAdmin, requireSupabase, requireSupabaseAdmin };
