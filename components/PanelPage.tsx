
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import HomePage from './HomePage';
import UsersPage from './UsersPage';
import BabiesPage from './BabiesPage';
import DoctorsPage from './DoctorsPage';
import CategoriesPage from './CategoriesPage';
import AdvicesPage from './AdvicesPage';
import ArticlesPage from './ArticlesPage';
import RecipesPage from './RecipesPage';
import SettingsPage from './SettingsPage';
import InfosPage from './InfosPage';
import EditUserModal from './EditUserModal';
import { User } from '../types';
import { getProfile } from '../services/adminService';
import { updateUser } from '../services/userService';
import { XIcon } from './icons';

interface PanelPageProps {
  token: string;
  onLogout: () => void;
}

// Toast Component
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void; }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const baseClasses = "fixed top-5 right-5 z-50 p-4 rounded-md shadow-lg text-white flex items-center animate-fade-in-up";
  const typeClasses = type === 'success' ? 'bg-green-500' : 'bg-red-600';

  return (
    <div className={`${baseClasses} ${typeClasses}`} role="alert">
      <span className="flex-grow">{message}</span>
      <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white/20">
        <XIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

const PanelPage: React.FC<PanelPageProps> = ({ token, onLogout }) => {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [initialBabyId, setInitialBabyId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // Current User State - Initialize from localStorage if available
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    });
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const user = await getProfile(token);
                setCurrentUser(user);
            } catch (error) {
                console.error("Failed to fetch profile", error);
            }
        };
        fetchProfile();
    }, [token]);

    const handleNavigation = (page: string) => {
        setInitialBabyId(null); // Reset on any manual navigation
        setCurrentPage(page);
    };

    const handleNavigateToBaby = (babyId: string) => {
        setInitialBabyId(babyId);
        setCurrentPage('babies');
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
    };

    const handleSaveProfile = async (userData: Partial<User>) => {
        try {
            if (currentUser && currentUser._id) {
                // Use updateUser from userService which targets /admin/users/:id
                // This aligns with the verified backend route
                const updatedUser = await updateUser(token, currentUser._id, userData);
                setCurrentUser(updatedUser);
                localStorage.setItem('currentUser', JSON.stringify(updatedUser)); // Update cache
                setIsProfileModalOpen(false);
                showToast('Profil mis à jour avec succès !', 'success');
            }
        } catch (error) {
            console.error("Failed to update profile", error);
            showToast('Erreur lors de la mise à jour du profil.', 'error');
            throw error; 
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
                currentPage={currentPage}
                onNavigate={handleNavigation}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <Header 
                    onLogout={onLogout} 
                    onMenuClick={() => setIsSidebarOpen(true)} 
                    user={currentUser}
                    onEditProfile={() => setIsProfileModalOpen(true)}
                />
                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                    {currentPage === 'dashboard' && <HomePage token={token} />}
                    {currentPage === 'users' && <UsersPage token={token} onLogout={onLogout} onNavigateToBaby={handleNavigateToBaby} />}
                    {currentPage === 'babies' && <BabiesPage token={token} onLogout={onLogout} initialBabyId={initialBabyId} onClearInitialBabyId={() => setInitialBabyId(null)} />}
                    {currentPage === 'doctors' && <DoctorsPage token={token} onLogout={onLogout} />}
                    {currentPage === 'categories' && <CategoriesPage token={token} onLogout={onLogout} />}
                    {currentPage === 'advices' && <AdvicesPage token={token} onLogout={onLogout} />}
                    {currentPage === 'articles' && <ArticlesPage token={token} onLogout={onLogout} />}
                    {currentPage === 'recipes' && <RecipesPage token={token} onLogout={onLogout} />}
                    {currentPage === 'settings' && <SettingsPage token={token} onLogout={onLogout} />}
                    {currentPage === 'infos' && <InfosPage token={token} onLogout={onLogout} />}
                </main>
            </div>

             {/* Edit Profile Modal */}
             <EditUserModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onSave={handleSaveProfile}
                user={currentUser}
                hideRole={true}
            />
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default PanelPage;
