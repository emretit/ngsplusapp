import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Using the provided Supabase credentials
const supabaseUrl = 'https://gjudsghhwmnsnndnswho.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdWRzZ2hod21uc25uZG5zd2hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjIzOTU1MywiZXhwIjoyMDUxODE1NTUzfQ.B0bg5m1LxgX89xeo89i82qfjvz7q_blYSRtgMBe82gI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  },
  realtime: {
    enabled: false
  }
});

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper function to get user profile data
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

// Helper function to record attendance
export const recordAttendance = async (userId: string, type: 'check-in' | 'check-out', locationId: string) => {
  const { data, error } = await supabase
    .from('attendance')
    .insert([
      {
        user_id: userId,
        type,
        location_id: locationId,
        timestamp: new Date().toISOString()
      }
    ]);

  if (error) throw error;
  return data;
};

// Helper function to get attendance history
export const getAttendanceHistory = async (userId: string, limit = 50) => {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

// Helper function to get visitors
export const getVisitors = async (limit = 50) => {
  const { data, error } = await supabase
    .from('visitors')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};