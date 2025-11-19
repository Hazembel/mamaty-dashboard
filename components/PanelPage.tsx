
import React, { useState } from 'react';
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

interface PanelPageProps {
  token: string;
  onLogout: () => void;
}

const PanelPage: React.FC<PanelPageProps> = ({ token, onLogout }) => {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [initialBabyId, setInitialBabyId] = useState<string | null>(null);

    const handleNavigation = (page: string) => {
        setInitialBabyId(null); // Reset on any manual navigation
        setCurrentPage(page);
    };

    const handleNavigateToBaby = (babyId: string) => {
        setInitialBabyId(babyId);
        setCurrentPage('babies');
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
                <Header onLogout={onLogout} onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                    {currentPage === 'dashboard' && <HomePage token={token} />}
                    {currentPage === 'users' && <UsersPage token={token} onLogout={onLogout} onNavigateToBaby={handleNavigateToBaby} />}
                    {currentPage === 'babies' && <BabiesPage token={token} onLogout={onLogout} initialBabyId={initialBabyId} onClearInitialBabyId={() => setInitialBabyId(null)} />}
                    {currentPage === 'doctors' && <DoctorsPage token={token} onLogout={onLogout} />}
                    {currentPage === 'categories' && <CategoriesPage token={token} onLogout={onLogout} />}
                    {currentPage === 'advices' && <AdvicesPage token={token} onLogout={onLogout} />}
                    {currentPage === 'articles' && <ArticlesPage token={token} onLogout={onLogout} />}
                    {currentPage === 'recipes' && <RecipesPage token={token} onLogout={onLogout} />}
                </main>
            </div>
        </div>
    );
};

export default PanelPage;
