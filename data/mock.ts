import { Bike, BikeStatus, MaintenanceRecord, MaintenanceStatus, Booking } from '../types';

const today = new Date();
const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0];
const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const MOCK_BIKES: Bike[] = [
  {
    id: 'b1',
    created_at: toYYYYMMDD(addDays(today, -30)),
    ref_no: 'SCO-001',
    brand: 'Scott',
    model: 'Spark RC',
    size: 'M',
    status: BikeStatus.AVAILABLE,
    entry_date: toYYYYMMDD(addDays(today, -30)),
    image_url: 'https://picsum.photos/seed/bike1/400/300',
  },
  {
    id: 'b2',
    created_at: toYYYYMMDD(addDays(today, -60)),
    ref_no: 'TRE-001',
    brand: 'Trek',
    model: 'Marlin 5',
    size: 'L',
    status: BikeStatus.RENTED,
    entry_date: toYYYYMMDD(addDays(today, -60)),
    image_url: 'https://picsum.photos/seed/bike2/400/300',
  },
  {
    id: 'b3',
    created_at: toYYYYMMDD(addDays(today, -90)),
    ref_no: 'SPE-001',
    brand: 'Specialized',
    model: 'Stumpjumper',
    size: 'M',
    status: BikeStatus.MAINTENANCE,
    entry_date: toYYYYMMDD(addDays(today, -90)),
    image_url: 'https://picsum.photos/seed/bike3/400/300',
  },
    {
    id: 'b4',
    created_at: toYYYYMMDD(addDays(today, -15)),
    ref_no: 'CAN-001',
    brand: 'Cannondale',
    model: 'Topstone',
    size: 'S',
    status: BikeStatus.AVAILABLE,
    entry_date: toYYYYMMDD(addDays(today, -15)),
    image_url: 'https://picsum.photos/seed/bike4/400/300',
  },
   {
    id: 'b5',
    created_at: toYYYYMMDD(addDays(today, -120)),
    ref_no: 'SCO-002',
    brand: 'Scott',
    model: 'Genius',
    size: 'L',
    status: BikeStatus.AVAILABLE,
    entry_date: toYYYYMMDD(addDays(today, -120)),
    image_url: 'https://picsum.photos/seed/bike5/400/300',
  },
];

export const MOCK_MAINTENANCE_RECORDS: MaintenanceRecord[] = [
  {
    id: 'm1',
    created_at: toYYYYMMDD(addDays(today, -10)),
    bike_id: 'b3',
    description: 'Travão de trás não está a funcionar corretamente.',
    tasks: ['Afinar travões'],
    reported_date: toYYYYMMDD(addDays(today, -10)),
    status: MaintenanceStatus.PENDING,
    workshop_notes: 'Pendente de peça para substituição.',
  },
   {
    id: 'm2',
    created_at: toYYYYMMDD(addDays(today, -45)),
    bike_id: 'b2',
    description: 'Revisão geral.',
    tasks: ['Afinar travões', 'Afinar mudanças', 'Troca de corrente'],
    reported_date: toYYYYMMDD(addDays(today, -45)),
    resolved_date: toYYYYMMDD(addDays(today, -43)),
    status: MaintenanceStatus.RESOLVED,
    workshop_notes: 'Revisão completa efetuada. Corrente nova instalada.',
  },
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'bk1',
    created_at: toYYYYMMDD(addDays(today, -5)),
    bike_id: 'b2',
    start_date: toYYYYMMDD(addDays(today, -1)),
    end_date: toYYYYMMDD(addDays(today, 3)),
    booking_number: 'BK-2024-001',
    notes: 'Cliente pediu pedais de encaixe.',
  },
  {
    id: 'bk2',
    created_at: toYYYYMMDD(addDays(today, -20)),
    bike_id: 'b1',
    start_date: toYYYYMMDD(addDays(today, 5)),
    end_date: toYYYYMMDD(addDays(today, 8)),
    booking_number: 'BK-2024-002',
  },
  {
    id: 'bk3',
    created_at: toYYYYMMDD(addDays(today, -1)),
    bike_id: 'b4',
    start_date: toYYYYMMDD(addDays(today, 10)),
    end_date: toYYYYMMDD(addDays(today, 12)),
    booking_number: 'BK-2024-003',
    notes: 'Vai precisar de cadeira de criança.',
  },
];
