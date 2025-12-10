
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, LogoutIcon, PlusIcon, MenuIcon, PencilIcon } from './icons';
import { User } from '../types';
import Avatar from './Avatar';

interface HeaderProps {
    onLogout: () => void;
    onMenuClick: () => void;
    user: User | null;
    onEditProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout, onMenuClick, user, onEditProfile }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDisplayName = () => {
      if (!user) return 'Admin';
      if (user.name) return `${user.name} ${user.lastname || ''}`;
      // Safe check before split
      if (user.email && typeof user.email === 'string') return user.email.split('@')[0];
      return 'Admin';
  };

  const displayName = getDisplayName();

  return (
    <header className="bg-white h-16 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 border-b border-border-color">
      <div className="flex items-center space-x-4">
        <button className="text-text-secondary hover:text-text-primary md:hidden" onClick={onMenuClick}>
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>
      
      <div className="relative" ref={dropdownRef}>
        <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
        >
            <span className="text-sm font-medium text-text-primary hidden sm:inline">Bonjour, {displayName}</span>
             <Avatar 
                name={user?.name || 'Admin'} 
                lastname={user?.lastname}
                src={user?.avatar} 
                size="md"
            />
        </div>
        {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 text-text-primary border border-border-color">
                <button
                    onClick={() => {
                        setDropdownOpen(false);
                        onEditProfile();
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-text-secondary hover:bg-gray-100"
                >
                    <PencilIcon className="h-5 w-5 mr-3" />
                    Modifier profil
                </button>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-text-secondary hover:bg-gray-100 border-t border-gray-100"
                >
                    <LogoutIcon className="h-5 w-5 mr-3" />
                    Se déconnecter
                </button>
            </div>
        )}
      </div>
    </header>
  );
};

export default Header;
