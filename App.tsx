
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Bike, BikeStatus, MaintenanceRecord, MaintenanceStatus, Booking } from './types';
import { PlusIcon, WrenchIcon, CalendarIcon, ArrowLeftIcon, TrashIcon, PencilIcon, BellIcon } from './components/Icons';
import Modal from './components/Modal';
import Calendar from './components/Calendar';
import { MOCK_BIKES, MOCK_MAINTENANCE_RECORDS, MOCK_BOOKINGS } from './data/mock';

const BikeStatusBadge = ({ status }: { status: BikeStatus }) => {
  const statusClasses = {
    [BikeStatus.AVAILABLE]: 'bg-status-available',
    [BikeStatus.RENTED]: 'bg-status-rented',
    [BikeStatus.MAINTENANCE]: 'bg-status-maintenance',
  };

  const statusContent = status === BikeStatus.MAINTENANCE ? (
    <div className="flex items-center gap-1">
      <WrenchIcon className="h-3 w-3" />
      <span>Em Manutenção</span>
    </div>
  ) : (
    <span>{status}</span>
  );

  return (
    <div className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-white rounded-full ${statusClasses[status]} min-w-[110px]`}>
      {statusContent}
    </div>
  );
}

// Helper para gerar IDs únicos localmente
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const App: React.FC = () => {
  // Inicialização do Estado com LocalStorage ou Mock Data
  const [bikes, setBikes] = useState<Bike[]>(() => {
    const saved = localStorage.getItem('bikes');
    return saved ? JSON.parse(saved) : MOCK_BIKES;
  });

  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() => {
    const saved = localStorage.getItem('maintenanceRecords');
    return saved ? JSON.parse(saved) : MOCK_MAINTENANCE_RECORDS;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('bookings');
    return saved ? JSON.parse(saved) : MOCK_BOOKINGS;
  });

  // Persistência dos dados sempre que mudam
  useEffect(() => {
    localStorage.setItem('bikes', JSON.stringify(bikes));
  }, [bikes]);

  useEffect(() => {
    localStorage.setItem('maintenanceRecords', JSON.stringify(maintenanceRecords));
  }, [maintenanceRecords]);

  useEffect(() => {
    localStorage.setItem('bookings', JSON.stringify(bookings));
  }, [bookings]);
  
  // State for confirmation modal
  const [confirmationModal, setConfirmationModal] = useState<{ 
    isOpen: boolean; 
    title: string; 
    message: string; 
    onConfirm: () => void; 
  } | null>(null);

  const brands = useMemo(() => [...new Set(bikes.map(b => b.brand))].sort(), [bikes]);
  const models = useMemo(() => [...new Set(bikes.map(b => b.model))].sort(), [bikes]);

  const [activeView, setActiveView] = useState<'bikes' | 'bookings'>('bikes');
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [activeModal, setActiveModal] = useState<'addBike' | 'editBike' | 'reportFault' | 'maintenanceProcess' | 'manageTaskTypes' | 'booking' | null>(null);
  const [bikeToEdit, setBikeToEdit] = useState<Bike | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // State for bike filters
  const [filterStatus, setFilterStatus] = useState<BikeStatus | ''>('');
  const [filterSize, setFilterSize] = useState<'S' | 'M' | 'L' | 'XL' | ''>('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [availabilityFilterStartDate, setAvailabilityFilterStartDate] = useState<Date | null>(null);
  const [availabilityFilterEndDate, setAvailabilityFilterEndDate] = useState<Date | null>(null);
  const [isAvailabilityCalendarOpen, setIsAvailabilityCalendarOpen] = useState(false);
  const availabilityFilterRef = useRef<HTMLDivElement>(null);

  // State for maintenance form
  const [maintenanceTaskOptions, setMaintenanceTaskOptions] = useState<string[]>([
    'Troca pneu trás',
    'Troca pneu da frente',
    'Substituição de câmara de ar',
    'Troca de corrente',
    'Afinar travões',
    'Afinar mudanças',
  ]);
  const [maintenanceRecordToProcess, setMaintenanceRecordToProcess] = useState<MaintenanceRecord | null>(null);
  const [currentEditingTasks, setCurrentEditingTasks] = useState<string[]>([]);
  const [currentWorkshopNotes, setCurrentWorkshopNotes] = useState('');
  const [newTaskType, setNewTaskType] = useState('');
  const [taskToAdd, setTaskToAdd] = useState('');

  const availableModelsForFilter = useMemo(() => {
    if (!filterBrand) return models;
    return [...new Set(bikes.filter(bike => bike.brand === filterBrand).map(bike => bike.model))].sort();
  }, [filterBrand, bikes, models]);

  // State for booking filters
  const [bookingFilterId, setBookingFilterId] = useState('');
  const [bookingFilterStartDate, setBookingFilterStartDate] = useState('');
  const [bookingFilterEndDate, setBookingFilterEndDate] = useState('');
  const [bookingFilterBrand, setBookingFilterBrand] = useState('');
  const [bookingFilterModel, setBookingFilterModel] = useState('');
  const [bookingFilterSize, setBookingFilterSize] = useState<'S' | 'M' | 'L' | 'XL' | ''>('');
  const [bookingsViewMode, setBookingsViewMode] = useState<'calendar' | 'list'>('list');
  const [currentBookingsCalendarDate, setCurrentBookingsCalendarDate] = useState(new Date());
  
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [bookingStartDate, setBookingStartDate] = useState<Date | null>(null);
  const [bookingEndDate, setBookingEndDate] = useState<Date | null>(null);
  const [bookingHoverDate, setBookingHoverDate] = useState<Date | null>(null);
  const [bookingFormCalendarDate, setBookingFormCalendarDate] = useState(new Date());


  const OVERDUE_DAYS_THRESHOLD = 7;
  
  const availableBookingModelsForFilter = useMemo(() => {
    if (!bookingFilterBrand) return models;
    return [...new Set(bikes.filter(bike => bike.brand === bookingFilterBrand).map(bike => bike.model))].sort();
  }, [bookingFilterBrand, bikes, models]);

  const overdueMaintenance = useMemo(() => {
    const now = new Date();
    return maintenanceRecords
      .filter(m => m.status === MaintenanceStatus.PENDING)
      .map(m => {
        const bike = bikes.find(b => b.id === m.bike_id);
        if (!bike) return null;
        const daysDiff = Math.floor((now.getTime() - new Date(m.reported_date).getTime()) / (1000 * 3600 * 24));
        if (daysDiff <= OVERDUE_DAYS_THRESHOLD) return null;

        return { ...m, daysOverdue: daysDiff, bike };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [maintenanceRecords, bikes]);


  const handleNotificationClick = (bike: Bike) => {
      setSelectedBike(bike);
      setActiveView('bikes');
      setIsNotificationsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
      if (availabilityFilterRef.current && !availabilityFilterRef.current.contains(event.target as Node)) setIsAvailabilityCalendarOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationRef, availabilityFilterRef]);

  const selectedBikeMaintenance = useMemo(() => maintenanceRecords.filter(m => m.bike_id === selectedBike?.id).sort((a, b) => new Date(b.reported_date).getTime() - new Date(a.reported_date).getTime()), [maintenanceRecords, selectedBike]);
  const selectedBikeBookings = useMemo(() => bookings.filter(b => b.bike_id === selectedBike?.id).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()), [bookings, selectedBike]);
  
  const filteredBikes = useMemo(() => {
    return bikes.filter(bike => {
        if (availabilityFilterStartDate && availabilityFilterEndDate) {
            if (bike.status === BikeStatus.MAINTENANCE) return false;
            const hasOverlappingBooking = bookings.some(booking => {
                if (booking.bike_id !== bike.id) return false;
                const bookingStart = new Date(booking.start_date); bookingStart.setHours(0, 0, 0, 0);
                const bookingEnd = new Date(booking.end_date); bookingEnd.setHours(0, 0, 0, 0);
                const filterStart = new Date(availabilityFilterStartDate); filterStart.setHours(0, 0, 0, 0);
                const filterEnd = new Date(availabilityFilterEndDate); filterEnd.setHours(0, 0, 0, 0);
                return bookingStart <= filterEnd && bookingEnd >= filterStart;
            });
            if (hasOverlappingBooking) return false;
        }
        if (!(availabilityFilterStartDate && availabilityFilterEndDate) && filterStatus && bike.status !== filterStatus) return false;
        if (filterSize && bike.size !== filterSize) return false;
        if (filterBrand && bike.brand !== filterBrand) return false;
        if (filterModel && bike.model !== filterModel) return false;
        return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [bikes, bookings, filterStatus, filterSize, filterBrand, filterModel, availabilityFilterStartDate, availabilityFilterEndDate]);


  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
        if (bookingFilterId && !booking.booking_number.toLowerCase().includes(bookingFilterId.toLowerCase())) return false;
        const bike = bikes.find(b => b.id === booking.bike_id);
        if (!bike) return false;
        if (bookingFilterBrand && bike.brand !== bookingFilterBrand) return false;
        if (bookingFilterModel && bike.model !== bookingFilterModel) return false;
        if (bookingFilterSize && bike.size !== bookingFilterSize) return false;
        const bookingStart = new Date(booking.start_date); bookingStart.setHours(0,0,0,0);
        const bookingEnd = new Date(booking.end_date); bookingEnd.setHours(0,0,0,0);
        if (bookingFilterStartDate) {
            const filterStart = new Date(bookingFilterStartDate);
            if (bookingEnd < filterStart) return false;
        }
        if (bookingFilterEndDate) {
            const filterEnd = new Date(bookingFilterEndDate);
            if (bookingStart > filterEnd) return false;
        }
        return true;
    }).sort((a,b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }, [bookings, bookingFilterId, bookingFilterStartDate, bookingFilterEndDate, bookingFilterBrand, bookingFilterModel, bookingFilterSize, bikes]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  
  const handleAddBike = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    let imageUrl = imagePreview || `https://picsum.photos/seed/bike${Date.now()}/400/300`;
    
    const newBike: Bike = {
      id: generateId('bike'),
      created_at: new Date().toISOString(),
      ref_no: (form.elements.namedItem('ref_no') as HTMLInputElement).value,
      brand: (form.elements.namedItem('brand') as HTMLInputElement).value.trim(),
      model: (form.elements.namedItem('model') as HTMLInputElement).value.trim(),
      size: (form.elements.namedItem('size') as HTMLSelectElement).value as 'S' | 'M' | 'L' | 'XL',
      entry_date: (form.elements.namedItem('entry_date') as HTMLInputElement).value,
      status: BikeStatus.AVAILABLE,
      image_url: imageUrl,
    };
    
    setBikes(prev => [newBike, ...prev]);
    setActiveModal(null);
  };
  
  const handleEditBike = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bikeToEdit) return;
    const form = e.currentTarget;
    
    const updatedBike: Bike = {
        ...bikeToEdit,
        ref_no: (form.elements.namedItem('ref_no') as HTMLInputElement).value,
        brand: (form.elements.namedItem('brand') as HTMLInputElement).value.trim(),
        model: (form.elements.namedItem('model') as HTMLInputElement).value.trim(),
        size: (form.elements.namedItem('size') as HTMLSelectElement).value as 'S' | 'M' | 'L' | 'XL',
        entry_date: (form.elements.namedItem('entry_date') as HTMLInputElement).value,
        status: (form.elements.namedItem('status') as HTMLSelectElement).value as BikeStatus,
        image_url: imagePreview || bikeToEdit.image_url,
    };
    
    setBikes(prev => prev.map(b => b.id === bikeToEdit.id ? updatedBike : b));
    
    if (selectedBike?.id === bikeToEdit.id) {
        setSelectedBike(updatedBike);
    }
    setActiveModal(null);
    setBikeToEdit(null);
  };

  const handleDeleteBike = (bike: Bike) => {
    setConfirmationModal({
        isOpen: true,
        title: "Confirmar Eliminação",
        message: "Tem a certeza que deseja remover esta bicicleta? Todos os registos associados (manutenção, reservas) serão também eliminados.",
        onConfirm: () => {
            setMaintenanceRecords(prev => prev.filter(r => r.bike_id !== bike.id));
            setBookings(prev => prev.filter(b => b.bike_id !== bike.id));
            setBikes(prev => prev.filter(b => b.id !== bike.id));
            
            if(selectedBike?.id === bike.id) setSelectedBike(null);
            setConfirmationModal(null);
        }
    });
  };

  const handleReportFault = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBike) return;

    const description = (e.currentTarget.elements.namedItem('faultDescription') as HTMLTextAreaElement).value;
    const newRecord: MaintenanceRecord = {
      id: generateId('maint'),
      created_at: new Date().toISOString(),
      bike_id: selectedBike.id,
      description: description,
      tasks: [],
      workshop_notes: '',
      reported_date: new Date().toISOString().split('T')[0],
      status: MaintenanceStatus.PENDING,
    };
    
    setMaintenanceRecords(prev => [newRecord, ...prev]);
    // Update bike status implicitly if needed, but report fault might not immediately ground the bike unless confirmed
    setActiveModal(null);
  };
  
  const handleStartMaintenance = () => {
      if (!selectedBike) return;
      
      const newRecord: MaintenanceRecord = {
        id: generateId('maint'),
        created_at: new Date().toISOString(),
        bike_id: selectedBike.id,
        description: "Manutenção de rotina iniciada pela oficina.",
        tasks: [],
        workshop_notes: '',
        reported_date: new Date().toISOString().split('T')[0],
        status: MaintenanceStatus.PENDING,
      };

      setMaintenanceRecords(prev => [newRecord, ...prev]);
      
      const updatedBike = { ...selectedBike, status: BikeStatus.MAINTENANCE };
      setBikes(prev => prev.map(b => b.id === selectedBike.id ? updatedBike : b));
      setSelectedBike(updatedBike);
      
      openMaintenanceProcessModal(newRecord);
  };

  const openMaintenanceProcessModal = (record: MaintenanceRecord) => {
    setMaintenanceRecordToProcess(record);
    setCurrentEditingTasks(record.tasks);
    setCurrentWorkshopNotes(record.workshop_notes || '');
    setTaskToAdd('');
    setActiveModal('maintenanceProcess');
  };
  
  const handleSaveMaintenanceProcess = (conclude: boolean) => {
    if (!maintenanceRecordToProcess) return;

    const updatedRecord: MaintenanceRecord = {
        ...maintenanceRecordToProcess,
        tasks: currentEditingTasks,
        workshop_notes: currentWorkshopNotes,
        ...(conclude && { 
            status: MaintenanceStatus.RESOLVED, 
            resolved_date: new Date().toISOString().split('T')[0] 
        })
    };
    
    setMaintenanceRecords(prev => prev.map(r => r.id === maintenanceRecordToProcess.id ? updatedRecord : r));

    if (conclude) {
        // Check if there are other pending records for this bike
        const otherPending = maintenanceRecords.filter(r => r.bike_id === maintenanceRecordToProcess.bike_id && r.id !== maintenanceRecordToProcess.id && r.status === MaintenanceStatus.PENDING);
        
        if(otherPending.length === 0) {
             const updatedBike = bikes.find(b => b.id === maintenanceRecordToProcess.bike_id);
             if (updatedBike) {
                 const newBikeState = { ...updatedBike, status: BikeStatus.AVAILABLE };
                 setBikes(prev => prev.map(b => b.id === newBikeState.id ? newBikeState : b));
                 if (selectedBike?.id === newBikeState.id) setSelectedBike(newBikeState);
             }
        }
    }
    
    setActiveModal(null);
    setMaintenanceRecordToProcess(null);
  };

  const handleAddTaskToProcess = () => { if (taskToAdd && !currentEditingTasks.includes(taskToAdd)) setCurrentEditingTasks(prev => [...prev, taskToAdd]); setTaskToAdd(''); };
  const handleRemoveTaskFromProcess = (taskToRemove: string) => setCurrentEditingTasks(prev => prev.filter(task => task !== taskToRemove));
  const handleAddNewTaskType = () => { const trimmedTask = newTaskType.trim(); if (trimmedTask && !maintenanceTaskOptions.includes(trimmedTask)) setMaintenanceTaskOptions(prev => [...prev, trimmedTask].sort()); setNewTaskType(''); };
  const handleRemoveTaskType = (taskToRemove: string) => { setMaintenanceTaskOptions(prev => prev.filter(task => task !== taskToRemove)); setCurrentEditingTasks(prev => prev.filter(task => task !== taskToRemove)); };
  const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0];

  const handleSaveBooking = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bookingStartDate || !bookingEndDate || !selectedBike) {
      alert("Por favor, selecione as datas e certifique-se que uma bicicleta está selecionada.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    
    if (bookingToEdit) {
        const updatedBooking: Booking = {
            ...bookingToEdit,
            booking_number: formData.get('bookingNumber') as string,
            notes: formData.get('notes') as string,
            start_date: toYYYYMMDD(bookingStartDate),
            end_date: toYYYYMMDD(bookingEndDate),
        };
        setBookings(prev => prev.map(b => b.id === bookingToEdit.id ? updatedBooking : b));
    } else {
        const newBooking: Booking = {
            id: generateId('bk'),
            created_at: new Date().toISOString(),
            bike_id: selectedBike.id,
            booking_number: formData.get('bookingNumber') as string,
            notes: formData.get('notes') as string,
            start_date: toYYYYMMDD(bookingStartDate),
            end_date: toYYYYMMDD(bookingEndDate),
        };
        setBookings(prev => [newBooking, ...prev]);
    }

    setActiveModal(null);
  };

  const handleDeleteBooking = (bookingId: string) => {
    setConfirmationModal({
        isOpen: true,
        title: "Confirmar Eliminação",
        message: "Tem a certeza que deseja remover esta reserva? Esta ação não pode ser desfeita.",
        onConfirm: () => {
            setBookings(prev => prev.filter(b => b.id !== bookingId));
            setConfirmationModal(null);
        }
    });
  };
  
  const openBookingModal = (booking: Booking | null) => {
    setBookingToEdit(booking);
    setBookingStartDate(booking ? new Date(booking.start_date) : null);
    setBookingEndDate(booking ? new Date(booking.end_date) : null);
    setBookingFormCalendarDate(booking ? new Date(booking.start_date) : new Date());
    setActiveModal('booking');
  };

  const handleDateRangePickerClick = (day: Date) => {
    if (!bookingStartDate || bookingEndDate) { setBookingStartDate(day); setBookingEndDate(null); } 
    else { if (day < bookingStartDate) { setBookingEndDate(bookingStartDate); setBookingStartDate(day); } else { setBookingEndDate(day); } }
  };
  const openAddModal = () => { setImagePreview(null); setActiveModal('addBike'); };
  const openEditModal = (bike: Bike) => { setBikeToEdit(bike); setImagePreview(bike.image_url); setActiveModal('editBike'); };

  const [availabilityCalendarDate, setAvailabilityCalendarDate] = useState(new Date());
  const [availabilityHoverDate, setAvailabilityHoverDate] = useState<Date | null>(null);

  const handleAvailabilityDateClick = (day: Date) => {
    if (!availabilityFilterStartDate || availabilityFilterEndDate) { setAvailabilityFilterStartDate(day); setAvailabilityFilterEndDate(null); } 
    else { if (day < availabilityFilterStartDate) { setAvailabilityFilterEndDate(availabilityFilterStartDate); setAvailabilityFilterStartDate(day); } else { setAvailabilityFilterEndDate(day); } setIsAvailabilityCalendarOpen(false); }
  };
  
  const renderAvailabilityCalendar = () => {
    const monthNames = [ 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro' ];
    const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const startOfMonth = new Date(availabilityCalendarDate.getFullYear(), availabilityCalendarDate.getMonth(), 1);
    const startDate = new Date(startOfMonth); startDate.setDate(startDate.getDate() - startOfMonth.getDay());
    const days = []; let day = new Date(startDate); for (let i = 0; i < 42; i++) { days.push(new Date(day)); day.setDate(day.getDate() + 1); }
    return (
        <div className="absolute top-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20 p-2 w-72">
            <div className="flex justify-between items-center mb-2 px-2">
                <button type="button" onClick={() => setAvailabilityCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-1 rounded-full hover:bg-gray-100">&lt;</button>
                <h4 className="text-sm font-semibold">{monthNames[availabilityCalendarDate.getMonth()]} {availabilityCalendarDate.getFullYear()}</h4>
                <button type="button" onClick={() => setAvailabilityCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-1 rounded-full hover:bg-gray-100">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">{daysOfWeek.map((day, i) => <div key={i}>{day}</div>)}</div>
            <div className="grid grid-cols-7 gap-x-0 gap-y-1 mt-1">
                {days.map((d, index) => {
                    const isCurrentMonth = d.getMonth() === availabilityCalendarDate.getMonth();
                    const dayTime = d.getTime(); const startTime = availabilityFilterStartDate?.getTime(); const endTime = availabilityFilterEndDate?.getTime(); const hoverTime = availabilityHoverDate?.getTime();
                    const isStart = startTime === dayTime; const isEnd = endTime === dayTime; const isInRange = startTime && endTime && dayTime > startTime && dayTime < endTime;
                    const isHovering = availabilityFilterStartDate && !availabilityFilterEndDate && availabilityHoverDate && ((dayTime > startTime && dayTime <= hoverTime) || (dayTime < startTime && dayTime >= hoverTime));
                    const dayIsHoverEdge = availabilityFilterStartDate && !availabilityFilterEndDate && (dayTime === hoverTime);
                    return (<div key={index} onClick={() => handleAvailabilityDateClick(d)} onMouseEnter={() => setAvailabilityHoverDate(d)} onMouseLeave={() => setAvailabilityHoverDate(null)}
                            className={`w-full aspect-square flex items-center justify-center text-xs transition-colors duration-100 cursor-pointer ${isCurrentMonth ? 'text-gray-800' : 'text-gray-300'} ${(isStart || isEnd) ? 'bg-brand-primary text-white font-bold' : (dayIsHoverEdge) ? 'bg-brand-primary/80 text-white' : (isInRange || isHovering) ? 'bg-blue-100' : 'hover:bg-gray-100'} ${(isStart && isEnd) ? 'rounded-lg' : (isStart) ? 'rounded-l-lg' : (isEnd) ? 'rounded-r-lg' : (dayIsHoverEdge) ? (hoverTime && startTime && hoverTime > startTime ? 'rounded-r-lg' : 'rounded-l-lg') : (isInRange || isHovering) ? 'rounded-none' : 'rounded-lg'}`}>
                            {d.getDate()}</div>)})}
            </div>
        </div>
    )
  }

  const renderBikeList = () => (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Parque de Bicicletas</h1>
        <div className="flex items-center gap-4">
            <button onClick={openAddModal} className="flex items-center gap-2 bg-brand-primary text-white font-bold px-4 py-2 rounded-lg shadow-md hover:bg-brand-primary-dark transition-colors">
              <PlusIcon className="h-5 w-5" /> <span>Adicionar Bicicleta</span></button>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div><label htmlFor="filterBrand" className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
            <select id="filterBrand" value={filterBrand} onChange={(e) => { setFilterBrand(e.target.value); setFilterModel(''); }} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
              <option value="">Todas</option>{brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}</select></div>
          <div><label htmlFor="filterModel" className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
            <select id="filterModel" value={filterModel} onChange={(e) => setFilterModel(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
              <option value="">Todos</option>{availableModelsForFilter.map(model => <option key={model} value={model}>{model}</option>)}</select></div>
          <div><label htmlFor="filterSize" className="block text-sm font-medium text-gray-700 mb-1">Tamanho</label>
            <select id="filterSize" value={filterSize} onChange={(e) => setFilterSize(e.target.value as 'S'|'M'|'L'|'XL'|'')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
              <option value="">Todos</option>{['S', 'M', 'L', 'XL'].map(size => <option key={size} value={size}>{size}</option>)}</select></div>
          <div><label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select id="filterStatus" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as BikeStatus|'')} disabled={!!(availabilityFilterStartDate && availabilityFilterEndDate)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary disabled:bg-gray-100 disabled:cursor-not-allowed">
              <option value="">Todos</option>{Object.values(BikeStatus).map(status => <option key={status} value={status}>{status}</option>)}</select></div>
        </div>
        <div className="border-t border-gray-200 mt-4 pt-4 flex items-end gap-4">
            <div className="relative" ref={availabilityFilterRef}><label htmlFor="filterAvailability" className="block text-sm font-medium text-gray-700 mb-1">Verificar disponibilidade para reserva</label>
                 <button id="filterAvailability" type="button" onClick={() => setIsAvailabilityCalendarOpen(!isAvailabilityCalendarOpen)} className="w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary text-left bg-white flex justify-between items-center">
                    {availabilityFilterStartDate && availabilityFilterEndDate ? <span className="text-gray-800">{`${availabilityFilterStartDate.toLocaleDateString('pt-PT')} - ${availabilityFilterEndDate.toLocaleDateString('pt-PT')}`}</span> : <span className="text-gray-500">Selecione um período...</span>}
                    <CalendarIcon className="h-5 w-5 text-gray-400" /></button>
                {isAvailabilityCalendarOpen && renderAvailabilityCalendar()}</div>
            <button onClick={() => { setFilterBrand(''); setFilterModel(''); setFilterSize(''); setFilterStatus(''); setAvailabilityFilterStartDate(null); setAvailabilityFilterEndDate(null); }} className="bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">Limpar Filtros</button>
        </div>
      </div>
      <div className="space-y-4">
        {filteredBikes.length > 0 ? filteredBikes.map(bike => (
            <div key={bike.id} onClick={() => setSelectedBike(bike)} className="bg-white rounded-lg shadow p-4 flex items-center space-x-4 hover:shadow-lg hover:ring-2 hover:ring-brand-primary transition-all duration-200 cursor-pointer">
                <img className="h-20 w-24 rounded-md object-cover flex-shrink-0" src={bike.image_url} alt={`${bike.brand} ${bike.model}`} />
                <div className="flex-1 min-w-0"><p className="text-lg font-bold text-gray-800 truncate">{bike.brand}</p><p className="text-sm text-gray-600 truncate">{bike.model}</p><p className="text-xs text-gray-400 truncate mt-1">Ref: {bike.ref_no}</p></div>
                <div className="w-24 text-center"><p className="text-xs text-gray-500">Tamanho</p><p className="font-bold text-lg">{bike.size}</p></div>
                <div className="w-32 flex justify-end"><BikeStatusBadge status={bike.status} /></div>
            </div>)) : (<div className="bg-white rounded-lg shadow p-10 text-center text-gray-500"><p>Nenhuma bicicleta encontrada com os filtros selecionados.</p></div>)}
      </div>
    </div>
  );

  const renderBikeDetails = () => (
    selectedBike && (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        <button onClick={() => setSelectedBike(null)} className="flex items-center gap-2 text-brand-primary font-semibold mb-6 hover:underline"><ArrowLeftIcon className="h-5 w-5" /><span>Voltar à lista</span></button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <img src={selectedBike.image_url} alt={`${selectedBike.brand} ${selectedBike.model}`} className="w-full h-64 object-cover rounded-lg mb-4" />
                    <div className="flex justify-between items-center"><h2 className="text-3xl font-bold text-gray-900">{selectedBike.brand} {selectedBike.model}</h2><BikeStatusBadge status={selectedBike.status} /></div>
                     <p className="text-lg text-gray-600">Tamanho: {selectedBike.size}</p><p className="text-md text-gray-500">Ref: {selectedBike.ref_no}</p><p className="text-sm text-gray-400 mt-2">Data de Entrada: {new Date(selectedBike.entry_date).toLocaleDateString()}</p>
                    <div className="flex items-center gap-2 mt-6">
                        <button onClick={() => openEditModal(selectedBike)} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"><PencilIcon className="h-5 w-5" /> Editar</button>
                         <button onClick={() => handleDeleteBike(selectedBike)} className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"><TrashIcon className="h-5 w-5" /> Remover</button>
                    </div>
                </div>
            </div>
            <div className="lg:col-span-2 space-y-8">
                <div>
                    <div className="flex justify-between items-center mb-4"><h3 className="text-2xl font-semibold text-gray-800">Calendário de Reservas</h3>
                        <button onClick={() => openBookingModal(null)} className="flex items-center gap-2 bg-brand-primary text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-brand-primary-dark transition-colors"><CalendarIcon className="h-5 w-5" /> Nova Reserva</button>
                    </div>
                    <Calendar bookings={selectedBikeBookings} bikes={bikes} onEditBooking={openBookingModal} onDeleteBooking={handleDeleteBooking}/>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-4"><h3 className="text-2xl font-semibold text-gray-800">Histórico de Manutenção</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setActiveModal('reportFault')} className="flex items-center gap-2 bg-status-rented text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-yellow-600 transition-colors"><WrenchIcon className="h-5 w-5" /> Reportar Avaria</button>
                            <button onClick={handleStartMaintenance} className="flex items-center gap-2 bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-gray-700 transition-colors"><WrenchIcon className="h-5 w-5" /> Iniciar Manutenção</button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {selectedBikeMaintenance.length > 0 ? selectedBikeMaintenance.map(m => (
                            <div key={m.id} className="bg-white p-4 rounded-lg shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1"><p className="text-sm font-medium text-gray-500">Problema Reportado:</p><p className="text-gray-800 mb-2">{m.description}</p>
                                        {m.workshop_notes && (<><p className="text-sm font-medium text-gray-500 mt-2">Trabalho Realizado:</p><p className="text-gray-800">{m.workshop_notes}</p></>)}
                                        {m.tasks && m.tasks.length > 0 && (<div className="flex flex-wrap gap-2 my-2">{m.tasks.map(task => (<span key={task} className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-700">{task}</span>))}</div>)}
                                        <p className="text-sm text-gray-500 mt-2">Reportado em: {new Date(m.reported_date).toLocaleDateString()}</p>
                                        {m.resolved_date && <p className="text-sm text-gray-500">Resolvido em: {new Date(m.resolved_date).toLocaleDateString()}</p>}
                                    </div>
                                    <div className="text-right ml-4 flex flex-col items-end">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${m.status === MaintenanceStatus.PENDING ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{m.status}</span>
                                        {m.status === MaintenanceStatus.PENDING && (<button onClick={() => openMaintenanceProcessModal(m)} className="mt-2 text-gray-600 hover:text-brand-primary p-1 rounded-full hover:bg-gray-100"><PencilIcon className="h-5 w-5"/></button>)}
                                    </div>
                                </div>
                            </div>)) : <p className="text-gray-500 bg-white p-4 rounded-lg shadow">Nenhum registo de manutenção.</p>}
                    </div>
                </div>
            </div>
        </div>
        <style>{`@keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } } .animate-fade-in { animation: fade-in 0.5s ease-in-out; }`}</style>
    </div>
    )
  );

  const renderBookingsView = () => {
    const monthNames = [ 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro' ];
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const startOfMonth = new Date(currentBookingsCalendarDate.getFullYear(), currentBookingsCalendarDate.getMonth(), 1);
    const startDate = new Date(startOfMonth); startDate.setDate(startDate.getDate() - startOfMonth.getDay());
    const daysInCalendar = []; let dayIterator = new Date(startDate); for (let i = 0; i < 42; i++) { daysInCalendar.push(new Date(dayIterator)); dayIterator.setDate(dayIterator.getDate() + 1); }
    const getBookingsSummaryForDate = (date: Date): string => {
        const checkDate = new Date(date); checkDate.setHours(0, 0, 0, 0);
        const modelsOnDate = filteredBookings.filter(booking => { const bookingStart = new Date(booking.start_date); bookingStart.setHours(0, 0, 0, 0); const bookingEnd = new Date(booking.end_date); bookingEnd.setHours(0, 0, 0, 0); return checkDate >= bookingStart && checkDate <= bookingEnd; }).map(booking => bikes.find(b => b.id === booking.bike_id)?.model).filter((model): model is string => !!model);
        if (modelsOnDate.length === 0) return '';
        const modelCounts = modelsOnDate.reduce((acc, model) => { acc[model] = (acc[model] || 0) + 1; return acc; }, {} as Record<string, number>);
        return Object.entries(modelCounts).map(([model, count]) => `${model} (${count})`).join('; ');
    };
    const prevMonth = () => setCurrentBookingsCalendarDate(new Date(currentBookingsCalendarDate.getFullYear(), currentBookingsCalendarDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentBookingsCalendarDate(new Date(currentBookingsCalendarDate.getFullYear(), currentBookingsCalendarDate.getMonth() + 1, 1));
    const renderCalendarView = () => (
        <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4"><button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors">&lt;</button><h3 className="text-lg font-semibold">{monthNames[currentBookingsCalendarDate.getMonth()]} {currentBookingsCalendarDate.getFullYear()}</h3><button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors">&gt;</button></div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500">{daysOfWeek.map(day => <div key={day} className="font-medium">{day}</div>)}</div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {daysInCalendar.map((d, index) => {
                    const isCurrentMonth = d.getMonth() === currentBookingsCalendarDate.getMonth(); const isToday = d.toDateString() === new Date().toDateString(); const bookingsSummary = getBookingsSummaryForDate(d); const isBooked = bookingsSummary !== '';
                    return (<div key={index} className={`w-full aspect-square rounded-lg p-1 text-left align-top ${isCurrentMonth ? 'text-gray-800' : 'text-gray-300'} ${isBooked ? 'bg-orange-200' : ''} ${!isBooked && isToday ? 'bg-blue-100' : ''}`}>
                            <span className={`text-xs ${isToday && !isBooked ? 'font-bold' : ''}`}>{d.getDate()}</span>
                            {isBooked && (<div className="text-[10px] leading-tight mt-1 text-orange-900 font-semibold overflow-hidden max-h-[calc(100%-1rem)]">{bookingsSummary}</div>)}</div>);})}
            </div>
             {filteredBookings.length === 0 && (<div className="text-center py-10 text-gray-500 border-t mt-4"><p>O filtro aplicado não retornou reservas.</p></div>)}
        </div>
    );
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold text-gray-800">Gestão de Aluguer</h1>
                 <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                    <button onClick={() => setBookingsViewMode('list')} className={`px-3 py-1 text-sm font-semibold rounded-md transition ${bookingsViewMode === 'list' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Lista</button>
                    <button onClick={() => setBookingsViewMode('calendar')} className={`px-3 py-1 text-sm font-semibold rounded-md transition ${bookingsViewMode === 'calendar' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Calendário</button>
                </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-col gap-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]"><label htmlFor="bookingFilterId" className="block text-sm font-medium text-gray-700 mb-1">Numero de Reserva</label><input type="text" id="bookingFilterId" value={bookingFilterId} onChange={(e) => setBookingFilterId(e.target.value)} placeholder="Buscar por nº da reserva..." className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"/></div>
                    <div className="flex-1 min-w-[150px] relative"><label htmlFor="bookingFilterStartDate" className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label><input type={bookingFilterStartDate ? "date" : "text"} onFocus={(e) => e.currentTarget.type = 'date'} onBlur={(e) => { if (!e.currentTarget.value) e.currentTarget.type = 'text'; }} id="bookingFilterStartDate" value={bookingFilterStartDate} placeholder="dd/mm/aaaa" onChange={(e) => setBookingFilterStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"/>{!bookingFilterStartDate && <CalendarIcon className="h-5 w-5 absolute right-3 top-9 text-gray-400 pointer-events-none" />}</div>
                    <div className="flex-1 min-w-[150px] relative"><label htmlFor="bookingFilterEndDate" className="block text-sm font-medium text-gray-700 mb-1">Data de Fim</label><input type={bookingFilterEndDate ? "date" : "text"} onFocus={(e) => e.currentTarget.type = 'date'} onBlur={(e) => { if (!e.currentTarget.value) e.currentTarget.type = 'text'; }} id="bookingFilterEndDate" placeholder="dd/mm/aaaa" value={bookingFilterEndDate} onChange={(e) => setBookingFilterEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"/>{!bookingFilterEndDate && <CalendarIcon className="h-5 w-5 absolute right-3 top-9 text-gray-400 pointer-events-none" />}</div>
                </div>
                 <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[150px]"><label htmlFor="bookingFilterBrand" className="block text-sm font-medium text-gray-700 mb-1">Marca</label><select id="bookingFilterBrand" value={bookingFilterBrand} onChange={(e) => { setBookingFilterBrand(e.target.value); setBookingFilterModel(''); }} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"><option value="">Todas</option>{brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}</select></div>
                     <div className="flex-1 min-w-[150px]"><label htmlFor="bookingFilterModel" className="block text-sm font-medium text-gray-700 mb-1">Modelo</label><select id="bookingFilterModel" value={bookingFilterModel} onChange={(e) => setBookingFilterModel(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"><option value="">Todos</option>{availableBookingModelsForFilter.map(model => <option key={model} value={model}>{model}</option>)}</select></div>
                     <div className="flex-1 min-w-[120px]"><label htmlFor="bookingFilterSize" className="block text-sm font-medium text-gray-700 mb-1">Tamanho</label><select id="bookingFilterSize" value={bookingFilterSize} onChange={(e) => setBookingFilterSize(e.target.value as 'S'|'M'|'L'|'XL'|'')} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"><option value="">Todos</option>{['S', 'M', 'L', 'XL'].map(size => <option key={size} value={size}>{size}</option>)}</select></div>
                    <button onClick={() => { setBookingFilterId(''); setBookingFilterStartDate(''); setBookingFilterEndDate(''); setBookingFilterBrand(''); setBookingFilterModel(''); setBookingFilterSize(''); }} className="bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">Limpar Filtros</button>
                </div>
            </div>
            {bookingsViewMode === 'list' ? (
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th scope="col" className="px-6 py-3">Nº Reserva</th><th scope="col" className="px-6 py-3">Data de Início</th><th scope="col" className="px-6 py-3">Data de Fim</th><th scope="col" className="px-6 py-3">Bicicleta</th><th scope="col" className="px-6 py-3">Ações</th></tr></thead>
                    <tbody>
                        {filteredBookings.length > 0 ? filteredBookings.map(booking => {
                            const bike = bikes.find(b => b.id === booking.bike_id);
                            return (<tr key={booking.id} className="bg-white border-b hover:bg-gray-50"><td className="px-6 py-4">{booking.booking_number}</td><td className="px-6 py-4">{new Date(booking.start_date).toLocaleDateString('pt-PT')}</td><td className="px-6 py-4">{new Date(booking.end_date).toLocaleDateString('pt-PT')}</td><td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{bike ? `${bike.brand} ${bike.model} (Ref: ${bike.ref_no})` : 'Bicicleta não encontrada'}</td><td className="px-6 py-4"><div className="flex items-center gap-3"><button onClick={() => { setSelectedBike(bike || null); openBookingModal(booking);}} className="text-brand-primary hover:text-brand-primary-dark"><PencilIcon className="h-5 w-5"/></button><button onClick={() => handleDeleteBooking(booking.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5"/></button></div></td></tr>);
                        }) : (<tr><td colSpan={5} className="text-center py-10 text-gray-500">Nenhuma reserva encontrada com os filtros selecionados.</td></tr>)}
                    </tbody></table>
                </div>) : renderCalendarView()}
        </div>
    );
  };

  const renderFormInput = (label: string, name: string, type: string, required = true, defaultValue: string | number = "") => (
    <div className="mb-4"><label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><input type="text" id={name} name={name} defaultValue={defaultValue} required={required} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"/></div>);
  const renderDatalistInput = (label: string, name: string, list: string[], required = true, defaultValue: string = "") => (
    <div className="mb-4"><label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><input type="text" id={name} name={name} list={`${name}-list`} defaultValue={defaultValue} required={required} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"/><datalist id={`${name}-list`}>{list.map(opt => <option key={opt} value={opt} />)}</datalist></div>);
  const renderFormSelect = (label: string, name: string, options: string[], required = true, defaultValue: string = "") => (
    <div className="mb-4"><label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label><select id={name} name={name} defaultValue={defaultValue} required={required} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary">{options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>);
  
  const renderBookingDateRangePicker = () => {
    const monthNames = [ 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro' ];
    const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const startOfMonth = new Date(bookingFormCalendarDate.getFullYear(), bookingFormCalendarDate.getMonth(), 1);
    const startDate = new Date(startOfMonth); startDate.setDate(startDate.getDate() - startOfMonth.getDay());
    const days = []; let day = new Date(startDate); for (let i = 0; i < 42; i++) { days.push(new Date(day)); day.setDate(day.getDate() + 1); }
    const bikeBookings = useMemo(() => { if (!selectedBike) return []; return bookings.filter(b => b.bike_id === selectedBike.id && b.id !== bookingToEdit?.id); }, [selectedBike, bookings, bookingToEdit]);
    const isDateBooked = (date: Date) => { const checkDate = new Date(date); checkDate.setHours(0, 0, 0, 0); return bikeBookings.some(booking => { const start = new Date(booking.start_date); start.setHours(0, 0, 0, 0); const end = new Date(booking.end_date); end.setHours(0, 0, 0, 0); return checkDate >= start && checkDate <= end; }); };
    return (<div className="p-2 border rounded-lg"><div className="flex justify-between items-center mb-2 px-2"><button type="button" onClick={() => setBookingFormCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-1 rounded-full hover:bg-gray-100">&lt;</button><h4 className="text-sm font-semibold">{monthNames[bookingFormCalendarDate.getMonth()]} {bookingFormCalendarDate.getFullYear()}</h4><button type="button" onClick={() => setBookingFormCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-1 rounded-full hover:bg-gray-100">&gt;</button></div><div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">{daysOfWeek.map((day, i) => <div key={i}>{day}</div>)}</div><div className="grid grid-cols-7 gap-x-0 gap-y-1 mt-1">{days.map((d, index) => {
                    const isCurrentMonth = d.getMonth() === bookingFormCalendarDate.getMonth(); const dayTime = d.getTime(); const startTime = bookingStartDate?.getTime(); const endTime = bookingEndDate?.getTime(); const hoverTime = bookingHoverDate?.getTime();
                    const isStart = startTime === dayTime; const isEnd = endTime === dayTime; const isInRange = startTime && endTime && dayTime > startTime && dayTime < endTime;
                    const isHovering = bookingStartDate && !bookingEndDate && bookingHoverDate && ((dayTime > startTime && dayTime <= hoverTime) || (dayTime < startTime && dayTime >= hoverTime));
                    const isBooked = isDateBooked(d); const dayIsHoverEdge = bookingStartDate && !bookingEndDate && (dayTime === hoverTime);
                    return (<div key={index} onClick={() => !isBooked && handleDateRangePickerClick(d)} onMouseEnter={() => setBookingHoverDate(d)} onMouseLeave={() => setBookingHoverDate(null)}
                            className={`w-full aspect-square flex items-center justify-center text-xs transition-colors duration-100 ${isCurrentMonth ? 'text-gray-800' : 'text-gray-300'} ${isBooked ? 'bg-gray-200 text-gray-400 cursor-not-allowed rounded-lg' : `cursor-pointer ${(isStart || isEnd) ? 'bg-brand-primary text-white font-bold' : (dayIsHoverEdge) ? 'bg-brand-primary/80 text-white' : (isInRange || isHovering) ? 'bg-blue-100' : 'hover:bg-gray-100'} ${(isStart && isEnd) ? 'rounded-lg' : (isStart) ? 'rounded-l-lg' : (isEnd) ? 'rounded-r-lg' : (dayIsHoverEdge) ? (hoverTime && startTime && hoverTime > startTime ? 'rounded-r-lg' : 'rounded-l-lg') : (isInRange || isHovering) ? 'rounded-none' : 'rounded-lg'}`}`}>
                            {d.getDate()}</div>)})}</div></div>)
  }

  const NavButton = ({ view, label, icon }: { view: 'bikes' | 'bookings', label: string, icon?: React.ReactNode }) => (
    <button onClick={() => { setActiveView(view); setSelectedBike(null); }} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeView === view ? 'bg-brand-primary text-white shadow' : 'text-gray-500 hover:text-brand-primary hover:bg-blue-50'}`}>
        {icon}<span>{label}</span></button>)

  return (
    <div className="bg-light-bg min-h-screen font-sans">
      <style>{`@keyframes fade-in-down { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } } .animate-fade-in-down { animation: fade-in-down 0.2s ease-out forwards; }`}</style>
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center gap-4"><h1 className="text-xl font-bold text-brand-text">Gestão de Aluguer</h1>
              <div className="relative" ref={notificationRef}>
                <button onClick={() => setIsNotificationsOpen(prev => !prev)} className="relative text-gray-500 hover:text-brand-primary transition-colors">
                  <BellIcon className="h-6 w-6" />
                  {overdueMaintenance.length > 0 && (<span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">{overdueMaintenance.length}</span></span>)}</button>
                {isNotificationsOpen && (
                  <div className="absolute top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 -right-1/2 z-20 animate-fade-in-down">
                    <div className="p-3 border-b font-semibold text-gray-700">Notificações</div>
                    <div className="max-h-96 overflow-y-auto">
                      {overdueMaintenance.length > 0 ? (<ul>{overdueMaintenance.map(item => (<li key={item.id}><button onClick={() => handleNotificationClick(item.bike)} className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"><p className="font-semibold text-gray-800">{item.bike.brand} {item.bike.model} (Ref: {item.bike.ref_no})</p><p className="text-sm text-red-600 font-medium">Manutenção pendente há {item.daysOverdue} dias.</p><p className="text-xs text-gray-500 mt-1 truncate">{item.description}</p></button></li>))}</ul>) : (<div className="p-4 text-center text-sm text-gray-500">Nenhuma notificação.</div>)}
                    </div>
                  </div>)}
              </div>
            </div>
            <nav className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                <NavButton view="bikes" label="Parque de Bicicletas" />
                <NavButton view="bookings" label="Reservas" icon={<CalendarIcon className="h-4 w-4" />} />
            </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto">
        {activeView === 'bikes' && (selectedBike ? renderBikeDetails() : renderBikeList())}
        {activeView === 'bookings' && renderBookingsView()}
      </main>

      <Modal isOpen={activeModal === 'addBike'} onClose={() => setActiveModal(null)} title="Adicionar Nova Bicicleta">
        <form onSubmit={handleAddBike}>{renderFormInput('Referência', 'ref_no', 'text')}{renderDatalistInput('Marca', 'brand', brands)}{renderDatalistInput('Modelo', 'model', models)}{renderFormSelect('Tamanho', 'size', ['S', 'M', 'L', 'XL'])}{renderFormInput('Data de Entrada', 'entry_date', 'date', true, new Date().toISOString().split('T')[0])}
          <div className="mb-4"><label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">Imagem da Bicicleta</label><input type="file" id="image" name="image" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-brand-primary hover:file:bg-blue-100"/>{imagePreview && <img src={imagePreview} alt="Pré-visualização" className="mt-4 h-32 w-auto rounded-lg"/>}</div>
          <button type="submit" className="w-full bg-brand-primary text-white font-semibold py-2 rounded-lg hover:bg-brand-primary-dark transition-colors">Adicionar Bicicleta</button></form></Modal>
      <Modal isOpen={activeModal === 'editBike'} onClose={() => setActiveModal(null)} title="Editar Bicicleta">{bikeToEdit && (<form onSubmit={handleEditBike}>{renderFormInput('Referência', 'ref_no', 'text', true, bikeToEdit.ref_no)}{renderDatalistInput('Marca', 'brand', brands, true, bikeToEdit.brand)}{renderDatalistInput('Modelo', 'model', models, true, bikeToEdit.model)}{renderFormSelect('Tamanho', 'size', ['S', 'M', 'L', 'XL'], true, bikeToEdit.size)}{renderFormInput('Data de Entrada', 'entry_date', 'date', true, bikeToEdit.entry_date)}{renderFormSelect('Status', 'status', Object.values(BikeStatus), true, bikeToEdit.status)}
                <div className="mb-4"><label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">Alterar Imagem</label><input type="file" id="image" name="image" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-brand-primary hover:file:bg-blue-100"/>{imagePreview && <img src={imagePreview} alt="Pré-visualização" className="mt-4 h-32 w-auto rounded-lg"/>}</div>
                <button type="submit" className="w-full bg-brand-primary text-white font-semibold py-2 rounded-lg hover:bg-brand-primary-dark transition-colors">Salvar Alterações</button></form>)}</Modal>
      <Modal isOpen={activeModal === 'reportFault'} onClose={() => setActiveModal(null)} title="Reportar Avaria"><form onSubmit={handleReportFault}><div className="mb-4"><label htmlFor="faultDescription" className="block text-sm font-medium text-gray-700 mb-1">Descrição da Avaria</label><textarea id="faultDescription" name="faultDescription" rows={4} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"></textarea></div><button type="submit" className="w-full bg-brand-primary text-white font-semibold py-2 rounded-lg hover:bg-brand-primary-dark transition-colors">Submeter Avaria</button></form></Modal>
      <Modal isOpen={activeModal === 'maintenanceProcess'} onClose={() => setActiveModal(null)} title="Processo de Manutenção">{maintenanceRecordToProcess && (<div><div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200"><label className="block text-sm font-medium text-gray-600 mb-1">Problema Reportado (Não Editável)</label><p className="text-sm text-gray-800">{maintenanceRecordToProcess.description}</p></div>
                <div className="mb-4"><label htmlFor="workshop_notes" className="block text-sm font-medium text-gray-700 mb-1">Notas da Oficina / Trabalho Realizado</label><textarea id="workshop_notes" rows={3} value={currentWorkshopNotes} onChange={e => setCurrentWorkshopNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" placeholder="Descreva o trabalho que foi feito..."></textarea></div>
                <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Tarefas Adicionadas</label><div className="space-y-2 p-2 border rounded-md min-h-[80px] max-h-40 overflow-y-auto">{currentEditingTasks.length > 0 ? currentEditingTasks.map((task) => (<div key={task} className="flex items-center justify-between bg-gray-100 p-2 rounded-md animate-fade-in-down"><span className="text-sm text-gray-800">{task}</span><button type="button" onClick={() => handleRemoveTaskFromProcess(task)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-4 w-4" /></button></div>)) : <p className="text-sm text-gray-400 text-center py-4">Nenhuma tarefa adicionada.</p>}</div></div>
                <div className="mb-4 flex items-end gap-2"><div className="flex-grow"><label htmlFor="taskToAdd" className="block text-sm font-medium text-gray-700 mb-1">Adicionar Tarefa Estruturada</label><select id="taskToAdd" value={taskToAdd} onChange={e => setTaskToAdd(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"><option value="">Selecione uma tarefa</option>{maintenanceTaskOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div><button type="button" onClick={handleAddTaskToProcess} className="bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap">Adicionar</button></div>
                <button type="button" onClick={() => setActiveModal('manageTaskTypes')} className="text-sm text-brand-primary hover:underline mb-6">Gerir tipos de manutenção</button>
                <div className="flex items-center gap-3"><button type="button" onClick={() => handleSaveMaintenanceProcess(false)} className="flex-1 w-full bg-gray-200 text-gray-800 font-semibold py-2 rounded-lg hover:bg-gray-300 transition-colors">Salvar Alterações</button><button type="button" onClick={() => handleSaveMaintenanceProcess(true)} className="flex-1 w-full bg-status-available text-white font-semibold py-2 rounded-lg hover:bg-green-600 transition-colors">Concluir Manutenção</button></div></div>)}</Modal>
      <Modal isOpen={activeModal === 'manageTaskTypes'} onClose={() => setActiveModal('maintenanceProcess')} title="Gerir Tipos de Manutenção"><div className="space-y-2 max-h-60 overflow-y-auto pr-2 mb-4">{maintenanceTaskOptions.map(task => (<div key={task} className="flex items-center justify-between bg-gray-50 p-2 rounded-md"><span className="text-sm text-gray-800">{task}</span><button onClick={() => handleRemoveTaskType(task)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-4 w-4" /></button></div>))}</div><div className="flex items-center gap-2 border-t pt-4"><input type="text" value={newTaskType} onChange={e => setNewTaskType(e.target.value)} placeholder="Nome do novo tipo" className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" /><button onClick={handleAddNewTaskType} className="bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">Adicionar</button></div></Modal>
      <Modal isOpen={activeModal === 'booking'} onClose={() => setActiveModal(null)} title={bookingToEdit ? "Editar Reserva" : "Nova Reserva"}>
        <form onSubmit={handleSaveBooking}>{renderFormInput('Número da Reserva', 'bookingNumber', 'text', true, bookingToEdit?.booking_number || `BK-${new Date().getFullYear()}-${String(bookings.length + 1).padStart(3, '0')}`)}
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Período da Reserva</label><div className="text-center font-semibold text-brand-primary p-2 bg-blue-50 rounded-md">{bookingStartDate ? bookingStartDate.toLocaleDateString('pt-PT') : 'Selecione a data de início'}{' - '}{bookingEndDate ? bookingEndDate.toLocaleDateString('pt-PT') : 'Selecione a data de fim'}</div></div>{renderBookingDateRangePicker()}
             <div className="my-4"><label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notas</label><textarea id="notes" name="notes" rows={3} defaultValue={bookingToEdit?.notes || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" placeholder="Adicionar notas..."></textarea></div>
            <button type="submit" className="w-full bg-brand-primary text-white font-semibold py-2 rounded-lg hover:bg-brand-primary-dark transition-colors">{bookingToEdit ? 'Salvar Alterações' : 'Criar Reserva'}</button></form></Modal>
      <Modal isOpen={confirmationModal?.isOpen ?? false} onClose={() => setConfirmationModal(null)} title={confirmationModal?.title || ''}>
        <p className="text-gray-600 mb-6">{confirmationModal?.message || ''}</p><div className="flex justify-end gap-4"><button onClick={() => setConfirmationModal(null)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors">Cancelar</button><button onClick={() => confirmationModal?.onConfirm()} className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors">Eliminar</button></div></Modal>
    </div>
  );
};
export default App;
