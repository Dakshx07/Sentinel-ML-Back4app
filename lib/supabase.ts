// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Using fallback configuration.');
}

export const supabase = createClient(
    supabaseUrl || 'https://phudgfbgcltknmvawitc.supabase.co',
    supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBodWRnZmJnY2x0a25tdmF3aXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNDA4NTMsImV4cCI6MjA4MDkxNjg1M30.7sGUWc1zZISEMkXHt_AxbfJTju52ivc3-ptHE-R85zs',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    }
);

export default supabase;
