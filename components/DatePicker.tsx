import React, { useState, useRef, useEffect } from 'react';

const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

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

  const handleDateParsing = (dateString: string) => {
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset);
  };

  useEffect(() => {
    if (value && !isNaN(handleDateParsing(value).getTime())) {
      setCurrentDate(handleDateParsing(value));
    } else {
      setCurrentDate(new Date());
    }
  }, [value, isOpen]);

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

  const handleDayClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const formattedDate = newDate.toISOString().split('T')[0];
    onChange(formattedDate);
    setIsOpen(false);
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = handleDateParsing(dateString);
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

    const selectedDate = value ? handleDateParsing(value) : null;
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
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => changeMonth(-1)} className="p-2 rounded-full text-text-secondary hover:bg-gray-100" aria-label="Mois précédent">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="font-semibold text-text-primary capitalize">
              {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
            <button type="button" onClick={() => changeMonth(1)} className="p-2 rounded-full text-text-secondary hover:bg-gray-100" aria-label="Mois suivant">
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
