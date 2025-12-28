import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. Auth and database sync will NOT work. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env or Vercel settings.');
}

// Create a mock or the actual client
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
