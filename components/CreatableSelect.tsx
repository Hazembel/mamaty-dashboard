
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDownIcon } from './icons';

interface CreatableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const CreatableSelect: React.FC<CreatableSelectProps> = ({ options, value, onChange, placeholder, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (isOpen) {
          onChange(searchTerm); 
        }
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, searchTerm, onChange]);

  const filteredOptions = useMemo(() => {
    return options.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);
  
  const handleSelect = (option: string) => {
    onChange(option);
    setSearchTerm(option);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleInvalid = (e: React.FormEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).setCustomValidity("Veuillez remplir ce champ.");
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).setCustomValidity('');
  };

  const showAddNew = searchTerm && !options.some(opt => opt.toLowerCase() === searchTerm.toLowerCase());
  const inputBaseClass = "w-full bg-background rounded-lg py-2.5 px-4 text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-premier focus:bg-white transition-colors";


  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={inputBaseClass}
          required={required && !value}
          onInvalid={handleInvalid}
          onInput={handleInput}
        />
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            inputRef.current?.focus();
          }}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400"
        >
          <ChevronDownIcon className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white border border-border-color rounded-lg shadow-lg z-10 py-1 max-h-60 overflow-y-auto">
          {filteredOptions.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-50"
            >
              {option}
            </button>
          ))}
          {showAddNew && (
             <button
              type="button"
              onClick={() => handleSelect(searchTerm)}
              className="w-full text-left px-4 py-2 text-sm text-premier hover:bg-gray-50"
            >
              Ajouter "{searchTerm}"
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CreatableSelect;
