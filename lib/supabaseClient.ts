
import { createClient, Session, User } from '@supabase/supabase-js';
import { Bike, MaintenanceRecord, Booking, BikeStatus, MaintenanceStatus } from '../types';

// Helper to try finding environment variables in different ways (Vite vs Node/Standard)
const getEnvVar = (key: string, viteKey: string): string | undefined => {
  // Check standard process.env
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // Check import.meta.env for Vite environments
  try {
    // @ts-ignore
    if (import.meta && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || import.meta.env[viteKey];
    }
  } catch (e) {
    // Ignore errors accessing import.meta
  }
  return undefined;
};

const supabaseUrl = getEnvVar('SUPABASE_URL', 'VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

interface Database {
  public: {
    Tables: {
      bikes: {
        Row: Bike;
        Insert: Omit<Bike, 'id' | 'created_at'>;
        Update: Partial<Omit<Bike, 'id' | 'created_at'>>;
      };
      maintenance_records: {
        Row: MaintenanceRecord;
        Insert: Omit<MaintenanceRecord, 'id' | 'created_at'>;
        Update: Partial<Omit<MaintenanceRecord, 'id' | 'created_at'>>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, 'id' | 'created_at'>;
        Update: Partial<Omit<Booking, 'id' | 'created_at'>>;
      };
    };
    Enums: {
      bike_status: BikeStatus;
      maintenance_status: MaintenanceStatus;
    };
  };
}

// We cast to any here to allow the app to load even if config is missing.
// Checks for 'isSupabaseConfigured' should be done before using the client.
export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : (null as unknown as ReturnType<typeof createClient<Database>>);

export type { Session, User };
