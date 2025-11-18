import { createClient } from '@supabase/supabase-js';
// FIX: Import BikeStatus and MaintenanceStatus enums.
import { Bike, MaintenanceRecord, Booking, BikeStatus, MaintenanceStatus } from '../types';

// These environment variables must be set in your hosting environment (e.g., Vercel).
// They are the Project URL and the public anon key from your Supabase project settings.
// FIX: Use process.env to access environment variables.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
// FIX: Use process.env to access environment variables.
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required. Please check your .env file or environment variables.");
}

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


export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
