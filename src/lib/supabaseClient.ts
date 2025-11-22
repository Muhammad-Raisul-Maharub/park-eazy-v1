
import { createClient } from '@supabase/supabase-js';
import { Database } from './supabase.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a dummy client if keys are missing to prevent crash
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
  : createClient<Database>('https://placeholder.supabase.co', 'placeholder', { auth: { persistSession: false } }); // Dummy client


// Helper to check connection
export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase keys missing. Running in offline/mock mode.');
    return false;
  }
  try {
    console.log('🔄 Testing Supabase connection...');
    // Simple query to check connectivity
    const { count, error } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });

    if (error) {
      // If the error is because the table doesn't exist yet (404/42P01), it still means we connected to Supabase successfully
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('✅ Supabase connected successfully (Tables not yet created). Please run the SQL setup script.');
        return true;
      }
      throw error;
    }

    console.log(`✅ Supabase connected successfully. Found ${count ?? 0} users.`);
    return true;
  } catch (error: any) {
    // Improved error logging to show message instead of empty object
    console.error('❌ Supabase connection failed:', error.message || error);
    return false;
  }
};
