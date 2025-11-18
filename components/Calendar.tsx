
import React, { useState, useMemo } from 'react';
import { Booking, Bike } from '../types';
import { PencilIcon, TrashIcon } from './Icons';

interface CalendarProps {
  bookings: Booking[];
  bikes: Bike[];
  onEditBooking?: (booking: Booking) => void;
  onDeleteBooking?: (bookingId: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ bookings, bikes, onEditBooking, onDeleteBooking }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startOfMonth.getDay());

  const days = [];
  let day = new Date(startDate);

  for (let i = 0; i < 42; i++) {
    days.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }
   
  const getBookingsSummaryForDate = (date: Date): string => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const modelsOnDate = bookings
        .filter(booking => {
            const bookingStart = new Date(booking.start_date);
            bookingStart.setHours(0, 0, 0, 0);
            const bookingEnd = new Date(booking.end_date);
            bookingEnd.setHours(0, 0, 0, 0);
            return checkDate >= bookingStart && checkDate <= bookingEnd;
        })
        .map(booking => bikes.find(b => b.id === booking.bike_id)?.model)
        .filter((model): model is string => !!model);

    if (modelsOnDate.length === 0) {
        return '';
    }

    const modelCounts = modelsOnDate.reduce((acc, model) => {
        acc[model] = (acc[model] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(modelCounts)
        .map(([model, count]) => `${model} (${count})`)
        .join('; ');
  };


  const handleDateClick = (date: Date) => {
    if (selectedDate && selectedDate.toDateString() === date.toDateString()) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  const bookingsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const checkDate = new Date(selectedDate);
    checkDate.setHours(0, 0, 0, 0);

    return bookings.filter(booking => {
        const bookingStart = new Date(booking.start_date);
        bookingStart.setHours(0, 0, 0, 0);
        const bookingEnd = new Date(booking.end_date);
        bookingEnd.setHours(0, 0, 0, 0);
        return checkDate >= bookingStart && checkDate <= bookingEnd;
    });
  }, [selectedDate, bookings]);


  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const renderCalendarMap = () => (
    <>
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors">&lt;</button>
        <h3 className="text-lg font-semibold">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500">
        {daysOfWeek.map(day => <div key={day} className="font-medium">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-2">
        {days.map((d, index) => {
          const isCurrentMonth = d.getMonth() === currentDate.getMonth();
          const isToday = d.toDateString() === new Date().toDateString();
          const bookingsSummary = getBookingsSummaryForDate(d);
          const booked = bookingsSummary !== '';
          const isSelected = selectedDate?.toDateString() === d.toDateString();

          return (
            <div
              key={index}
              onClick={() => handleDateClick(d)}
              className={`
                w-full aspect-square rounded-lg relative transition-all duration-200 ease-in-out cursor-pointer p-1 text-left align-top
                ${isCurrentMonth ? 'text-gray-800 hover:bg-gray-100 hover:scale-105' : 'text-gray-300'}
                ${isSelected 
                    ? 'bg-brand-primary text-white font-bold ring-2 ring-brand-primary-dark' 
                    : booked 
                        ? 'bg-orange-200' 
                        : isToday 
                            ? 'bg-blue-100' 
                            : ''
                }
              `}
            >
              <span className={`text-sm ${isToday && !booked ? 'font-bold' : ''} ${isSelected ? 'font-bold' : ''}`}>{d.getDate()}</span>
                {booked && !isSelected && (
                    <div className="text-[10px] leading-tight mt-1 text-orange-900 font-semibold overflow-hidden max-h-[calc(100%-1.25rem)]">
                        {bookingsSummary}
                    </div>
                )}
            </div>
          );
        })}
      </div>
      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">Reservas para {selectedDate.toLocaleDateString('pt-PT')}</h4>
          {bookingsForSelectedDate.length > 0 ? (
            <ul className="space-y-2">
              {bookingsForSelectedDate.map(booking => (
                <li key={booking.id} className="bg-gray-50 p-3 rounded-md">
                  <p className="font-semibold text-gray-900">{booking.booking_number}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(booking.start_date).toLocaleDateString('pt-PT')} - {new Date(booking.end_date).toLocaleDateString('pt-PT')}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">Nenhuma reserva para este dia.</p>
          )}
        </div>
      )}
    </>
  );

  const renderBookingList = () => {
    const sortedBookings = [...bookings].sort((a,b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    
    return (
        <div className="space-y-3">
            {sortedBookings.length > 0 ? sortedBookings.map(booking => (
                 <div key={booking.id} className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-gray-900">{booking.booking_number}</p>
                        <p className="text-sm text-gray-600">
                        {new Date(booking.start_date).toLocaleDateString('pt-PT')} - {new Date(booking.end_date).toLocaleDateString('pt-PT')}
                        </p>
                    </div>
                    {onEditBooking && onDeleteBooking && (
                        <div className="flex items-center gap-3">
                            <button onClick={() => onEditBooking(booking)} className="text-brand-primary hover:text-brand-primary-dark"><PencilIcon className="h-5 w-5"/></button>
                            <button onClick={() => onDeleteBooking(booking.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5"/></button>
                        </div>
                    )}
                </div>
            )) : (
                <p className="text-gray-500 text-sm py-4">Nenhuma reserva agendada.</p>
            )}
        </div>
    );
  };


  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {viewMode === 'list' ? 'Próximas Reservas' : `Mapa de ${monthNames[currentDate.getMonth()]}`}
        </h3>
        <button 
          onClick={() => setViewMode(prev => prev === 'list' ? 'map' : 'list')}
          className="text-sm font-semibold text-brand-primary hover:underline"
        >
          {viewMode === 'list' ? 'Ver Mapa' : 'Ver Lista'}
        </button>
      </div>
      
      {viewMode === 'list' ? renderBookingList() : renderCalendarMap()}
    </div>
  );
};

export default Calendar;
