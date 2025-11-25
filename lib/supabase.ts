import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  
  console.error(
    `❌ Missing Supabase environment variables: ${missingVars.join(', ')}\n` +
    `Please create a .env file in the project root with:\n` +
    `EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n` +
    `EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n\n` +
    `Get these from: Supabase Dashboard → Settings → API`
  );
}

// Use placeholder values if missing to prevent crashes
// Requests will fail with clear error messages
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});