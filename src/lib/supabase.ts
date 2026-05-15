import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

if (!supabaseUrl || !supabaseKey) {
  if (typeof window !== 'undefined') {
    console.warn('Supabase URL and publishable key (sb_publishable_...) are missing. Please check your .env file.');
  }
}
