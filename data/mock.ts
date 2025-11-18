import { Bike, BikeStatus, MaintenanceRecord, MaintenanceStatus, Booking } from '../types';

// Fix: Use Date objects for entryDate to match the Bike type and ensure data consistency.
export const initialBikes: Bike[] = [
  { id: 'bike-1', ref_no: 'M42', brand: 'Caloi', model: 'Explorer', size: 'M', status: BikeStatus.AVAILABLE, entryDate: new Date('2023-01-15'), imageUrl: 'https://images.unsplash.com/photo-1576426863848-c21f68c6aa98?w=400&q=80' },
  { id: 'bike-2', ref_no: 'L16', brand: 'Specialized', model: 'Rockhopper', size: 'L', status: BikeStatus.RENTED, entryDate: new Date('2023-02-20'), imageUrl: 'https://images.unsplash.com/photo-1559348344-3e9d36a62319?w=400&q=80' },
  { id: 'bike-3', ref_no: 'M88', brand: 'Trek', model: 'Marlin 5', size: 'M', status: BikeStatus.MAINTENANCE, entryDate: new Date('2023-03-10'), imageUrl: 'https://images.unsplash.com/photo-1575585252969-fe85b6513514?w=400&q=80' },
  { id: 'bike-4', ref_no: 'S05', brand: 'Scott', model: 'Aspect 960', size: 'S', status: BikeStatus.AVAILABLE, entryDate: new Date('2023-04-01'), imageUrl: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400&q=80' },
];

export const initialMaintenance: MaintenanceRecord[] = [
  { id: 'maint-1', bikeId: 'bike-3', description: 'Freio traseiro com problema.', tasks: ['Afinar travões'], reportedDate: new Date('2023-10-20'), status: MaintenanceStatus.PENDING, workshopNotes: 'Pastilhas gastas, foi feita a substituição.' },
  { id: 'maint-2', bikeId: 'bike-2', description: 'Pneu furado.', tasks: ['Troca pneu da frente', 'Substituição de câmara de ar'], reportedDate: new Date('2023-10-15'), resolvedDate: new Date('2023-10-16'), status: MaintenanceStatus.RESOLVED, workshopNotes: 'Pneu dianteiro substituído e câmara de ar trocada.' },
];

export const initialBookings: Booking[] = [
    { id: 'book-1', bikeId: 'bike-2', bookingNumber: 'R-001', startDate: new Date('2025-11-17'), endDate: new Date('2025-11-19'), notes: 'Cliente frequente.'},
    { id: 'book-2', bikeId: 'bike-1', bookingNumber: 'R-002', startDate: new Date('2025-11-22'), endDate: new Date('2025-11-24'), notes: '' },
    { id: 'book-3', bikeId: 'bike-4', bookingNumber: 'R-003', startDate: new Date('2025-11-07'), endDate: new Date('2025-11-09'), notes: 'Pedido de selim de gel.' },
    { id: 'book-4', bikeId: 'bike-1', bookingNumber: 'R-004', startDate: new Date('2025-11-27'), endDate: new Date('2025-11-29'), notes: '' },
];