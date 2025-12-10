
import React from 'react';
import { DocumentTextIcon, UsersIcon, BabyIcon, DoctorIcon, ViewGridIcon, LightBulbIcon, CakeIcon, HomeIcon, InformationCircleIcon, PhotoIcon } from './icons';

interface NavLinkProps {
  href: string;
  icon: React.ReactElement<{ className: string }>;
  active?: boolean;
  onClick: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ href, icon, active, onClick }) => (
  <a
    href={href}
    onClick={(e) => { e.preventDefault(); onClick(); }}
    className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors duration-200 ${
      active ? 'bg-premier text-white' : 'text-text-secondary hover:bg-gray-100 hover:text-premier'
    }`}
    title="Navigation"
  >
    {React.cloneElement(icon, { className: 'h-6 w-6' })}
  </a>
);

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const SidebarContent: React.FC<{ currentPage: string; onNavigate: (page: string) => void; }> = ({ currentPage, onNavigate }) => (
  <>
    <div className="w-12 h-12 flex items-center justify-center">
      <svg className="h-8 w-8 text-premier" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM5 10a5 5 0 1110 0 5 5 0 01-10 0z" />
      </svg>
    </div>
    <nav className="flex flex-col items-center space-y-4">
      <NavLink href="#" icon={<HomeIcon className="h-6 w-6" />} onClick={() => onNavigate('dashboard')} active={currentPage === 'dashboard'} />
      <NavLink href="#" icon={<UsersIcon className="h-6 w-6" />} onClick={() => onNavigate('users')} active={currentPage === 'users'} />
      <NavLink href="#" icon={<BabyIcon className="h-6 w-6" />} onClick={() => onNavigate('babies')} active={currentPage === 'babies'} />
      <NavLink href="#" icon={<DoctorIcon className="h-6 w-6" />} onClick={() => onNavigate('doctors')} active={currentPage === 'doctors'} />
      <NavLink href="#" icon={<ViewGridIcon className="h-6 w-6" />} onClick={() => onNavigate('categories')} active={currentPage === 'categories'} />
      <NavLink href="#" icon={<LightBulbIcon className="h-6 w-6" />} onClick={() => onNavigate('advices')} active={currentPage === 'advices'} />
      <NavLink href="#" icon={<DocumentTextIcon className="h-6 w-6" />} onClick={() => onNavigate('articles')} active={currentPage === 'articles'} />
      <NavLink href="#" icon={<CakeIcon className="h-6 w-6" />} onClick={() => onNavigate('recipes')} active={currentPage === 'recipes'} />
      <NavLink href="#" icon={<PhotoIcon className="h-6 w-6" />} onClick={() => onNavigate('avatars')} active={currentPage === 'avatars'} />
      <NavLink href="#" icon={<InformationCircleIcon className="h-6 w-6" />} onClick={() => onNavigate('infos')} active={currentPage === 'infos'} />
    </nav>
  </>
);


const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentPage, onNavigate }) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-20 bg-white border-r border-border-color flex-col flex-shrink-0 hidden md:flex items-center py-6 space-y-6">
        <SidebarContent currentPage={currentPage} onNavigate={onNavigate} />
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <div className={`fixed inset-0 z-30 md:hidden ${isOpen ? 'block' : 'hidden'}`}>
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={onClose}
          aria-hidden="true"
        ></div>
        
        {/* Content */}
        <aside 
          className={`absolute top-0 left-0 h-full w-20 bg-white border-r border-border-color flex flex-col items-center py-6 space-y-6 transform transition-transform ease-in-out duration-300 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarContent currentPage={currentPage} onNavigate={onNavigate} />
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
