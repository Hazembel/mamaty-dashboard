
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './icons';

const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const monthNames = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

interface DatePickerProps {
  value: string; // Expects 'YYYY-MM-DD'
  onChange: (date: string) => void;
  id?: string;
  name?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, id, name }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const pickerRef = useRef<HTMLDivElement>(null);

  // Generate years (1900 to Current Year + 5)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 6 }, (_, i) => 1900 + i).reverse();

  const parseDateString = (dateString: string) => {
    if (!dateString) return new Date();
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date();
  };

  useEffect(() => {
    if (value) {
      const date = parseDateString(value);
      if (!isNaN(date.getTime())) {
        setCurrentDate(date);
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeMonth = (amount: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + amount);
      return newDate;
    });
  };

  const handleYearSelect = (year: number) => {
    setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setFullYear(year);
        return newDate;
    });
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(monthIndex);
        return newDate;
    });
  };

  const handleDayClick = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Construct string directly to avoid timezone shifts
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const formattedDate = `${year}-${m}-${d}`;
    
    onChange(formattedDate);
    setIsOpen(false);
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = parseDateString(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const selectedDate = value ? parseDateString(value) : null;
    const today = new Date();

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(<div key={`prev-${i}`} className="w-8 h-8"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year;
      
      const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

      calendarDays.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDayClick(day)}
          className={`p-2 text-center text-sm rounded-full w-8 h-8 flex items-center justify-center transition-colors
            ${isSelected ? 'bg-premier text-white font-semibold' : ''}
            ${!isSelected && isToday ? 'bg-premier/10 text-premier font-semibold' : ''}
            ${!isSelected ? 'text-text-primary hover:bg-gray-100' : ''}
          `}
        >
          {day}
        </button>
      );
    }
    return calendarDays;
  };

  const inputBaseClass = "w-full bg-background rounded-lg py-2.5 px-4 text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-premier focus:bg-white transition-colors";

  return (
    <div className="relative" ref={pickerRef}>
      <input
        type="text"
        id={id}
        name={name}
        readOnly
        value={formatDateForDisplay(value)}
        onClick={() => setIsOpen(!isOpen)}
        placeholder="JJ/MM/AAAA"
        className={`${inputBaseClass} cursor-pointer`}
        aria-label="Sélectionner une date"
      />
      {isOpen && (
        <div className="absolute top-full mt-2 w-72 bg-white border border-border-color rounded-lg shadow-lg z-20 p-4 animate-fade-in-up" role="dialog">
          
          {/* Custom Header with Selects */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded-full text-text-secondary hover:bg-gray-100 flex-shrink-0" aria-label="Mois précédent">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            <div className="flex gap-1 flex-grow justify-center">
                {/* Month Select */}
                <div className="relative">
                    <select 
                        value={currentDate.getMonth()} 
                        onChange={(e) => handleMonthSelect(parseInt(e.target.value))}
                        className="appearance-none bg-transparent font-semibold text-text-primary text-sm py-1 pr-4 cursor-pointer focus:outline-none text-center"
                    >
                        {monthNames.map((m, idx) => (
                            <option key={m} value={idx}>{m}</option>
                        ))}
                    </select>
                </div>

                {/* Year Select */}
                <div className="relative">
                    <select 
                        value={currentDate.getFullYear()} 
                        onChange={(e) => handleYearSelect(parseInt(e.target.value))}
                        className="appearance-none bg-transparent font-semibold text-text-primary text-sm py-1 pr-4 cursor-pointer focus:outline-none text-center"
                    >
                        {years.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded-full text-text-secondary hover:bg-gray-100 flex-shrink-0" aria-label="Mois suivant">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-text-secondary mb-2 font-medium">
            {daysOfWeek.map(day => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 justify-items-center">
            {renderCalendar()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
