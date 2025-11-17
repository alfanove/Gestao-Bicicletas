export enum BikeStatus {
  AVAILABLE = 'Disponível',
  RENTED = 'Alugada',
  MAINTENANCE = 'Em Manutenção',
}

export interface Bike {
  id: string;
  ref_no: string;
  brand: string;
  model: string;
  size: 'S' | 'M' | 'L' | 'XL';
  status: BikeStatus;
  entryDate: Date;
  imageUrl: string;
}

export enum MaintenanceStatus {
  PENDING = 'Pendente',
  RESOLVED = 'Resolvido',
}

export interface MaintenanceRecord {
  id: string;
  bikeId: string;
  description: string;
  tasks: string[];
  reportedDate: Date;
  resolvedDate?: Date;
  status: MaintenanceStatus;
  workshopNotes?: string;
}

export interface Booking {
  id: string;
  bikeId: string;
  startDate: Date;
  endDate: Date;
  customerName: string;
}