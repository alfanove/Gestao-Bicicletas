export enum BikeStatus {
  AVAILABLE = 'Disponível',
  RENTED = 'Alugada',
  MAINTENANCE = 'Em Manutenção',
}

export interface Bike {
  id: string;
  created_at: string;
  ref_no: string;
  brand: string;
  model: string;
  size: 'S' | 'M' | 'L' | 'XL';
  status: BikeStatus;
  entry_date: string; // Changed from Date to string to match DB format 'YYYY-MM-DD'
  image_url: string;
}

export enum MaintenanceStatus {
  PENDING = 'Pendente',
  RESOLVED = 'Resolvido',
}

export interface MaintenanceRecord {
  id: string;
  created_at: string;
  bike_id: string;
  description: string;
  tasks: string[];
  reported_date: string; // Consistent with other date types
  resolved_date?: string; // Consistent with other date types
  status: MaintenanceStatus;
  workshop_notes?: string;
}

export interface Booking {
  id: string;
  created_at: string;
  bike_id: string;
  start_date: string; // Changed from Date to string
  end_date: string; // Changed from Date to string
  booking_number: string;
  notes?: string;
}