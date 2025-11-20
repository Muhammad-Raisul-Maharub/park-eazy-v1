
import { createClient } from '@supabase/supabase-js';
import { Database } from './supabase.types';

const supabaseUrl = 'https://gogjqpbykkgiokcyzybg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvZ2pxcGJ5a2tnaW9rY3l6eWJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNDQxNjMsImV4cCI6MjA3ODYyMDE2M30.LXvl-OeZfewJlI0nnK3O_AAXiLiqAB5AeFYI2NQNmCI';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper to check connection
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('🔄 Testing Supabase connection...');
    // Simple query to check connectivity
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    
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
