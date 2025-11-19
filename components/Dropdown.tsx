
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from './icons';

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  labelPrefix?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ options, value, onChange, labelPrefix = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (newValue: string) => {
    onChange(newValue);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto flex items-center justify-between gap-2 pl-3 pr-2 py-2.5 bg-white border border-border-color rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-premier transition"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{labelPrefix}{selectedOption ? selectedOption.label : ''}</span>
        <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute top-full mt-2 w-full sm:w-56 bg-white border border-border-color rounded-lg shadow-lg z-10 py-1"
          role="listbox"
        >
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="w-full flex items-center justify-between text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
              role="option"
              aria-selected={value === option.value}
            >
              <span>{option.label}</span>
              {value === option.value && <CheckIcon className="h-4 w-4 text-premier" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
