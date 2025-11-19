
import React, { useEffect, useState, useMemo } from 'react';
import { getUsers, updateUser, deleteUser, createUser } from '../services/userService';
import { getCategories } from '../services/categoryService';
import { User, Category } from '../types';
import UserTable from './UserTable';
import Pagination from './Pagination';
import PageLayout from './PageLayout';
import { SearchIcon, LoadingSpinnerIcon, XIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';
import EditUserModal from './EditUserModal';
import UserDetailsModal from './UserDetailsModal';
import Dropdown, { DropdownOption } from './Dropdown';

interface UsersPageProps {
  token: string;
  onLogout: () => void;
  onNavigateToBaby: (babyId: string) => void;
}

const ITEMS_PER_PAGE = 10;

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

const UsersPage: React.FC<UsersPageProps> = ({ token, onLogout, onNavigateToBaby }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Details Modal State
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [detailsTab, setDetailsTab] = useState<'babies' | 'doctors' | 'recipes' | 'articles'>('babies');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [sortOption, setSortOption] = useState('createdAt-desc');
  const [genderFilter, setGenderFilter] = useState<'all' | 'Male' | 'Female' | 'Other'>('all');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const sortOptions: DropdownOption[] = [
    { value: 'createdAt-desc', label: 'Plus récent' },
    { value: 'createdAt-asc', label: 'Plus ancien' },
    { value: 'name-asc', label: 'Nom (A-Z)' },
    { value: 'name-desc', label: 'Nom (Z-A)' },
  ];

  const genderFilterOptions: DropdownOption[] = [
    { value: 'all', label: 'Tous' },
    { value: 'Male', label: 'Homme' },
    { value: 'Female', label: 'Femme' },
    { value: 'Other', label: 'Autre' },
  ];


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch users and categories simultaneously
        const [fetchedUsers, fetchedCategories] = await Promise.all([
            getUsers(token),
            getCategories(token)
        ]);
        setUsers(fetchedUsers);
        setCategories(fetchedCategories);
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === "Session expirée. Veuillez vous reconnecter.") {
            onLogout();
          } else {
            setError(err.message);
          }
        } else {
          setError("Une erreur inconnue est survenue.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, onLogout]);

  
  const sortedAndFilteredUsers = useMemo(() => {
    const filtered = users
      .filter(user =>
        `${user.name || ''} ${user.lastname || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      .filter(user => {
        if (genderFilter === 'all') return true;
        return user.gender === genderFilter;
      });


    if (sortOption) {
      const [key, direction] = sortOption.split('-') as [keyof User, 'asc' | 'desc'];
      
      filtered.sort((a, b) => {
        const aVal = (key === 'name') ? `${a.name} ${a.lastname}`.trim() : a[key];
        const bVal = (key === 'name') ? `${b.name} ${b.lastname}`.trim() : b[key];

        if (aVal == null) return 1;
        if (bVal == null) return -1;
        
        let comparison = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal, 'fr', { sensitivity: 'base' });
        } else if (aVal < bVal) {
          comparison = -1;
        } else if (aVal > bVal) {
          comparison = 1;
        }
        
        return direction === 'desc' ? comparison * -1 : comparison;
      });
    }
    return filtered;
  }, [users, searchTerm, sortOption, genderFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedAndFilteredUsers, currentPage]);

  const handleSaveUser = async (userData: Partial<User>) => {
    setIsSubmitting(true);
    try {
      if (userToEdit) { // Edit mode
        const savedUser = await updateUser(token, userToEdit._id, userData);
        setUsers(users.map(u => (u._id === savedUser._id ? { ...u, ...savedUser } : u)));
        showToast('Utilisateur mis à jour avec succès.', 'success');
      } else { // Add mode
        const newUser = await createUser(token, userData);
        setUsers([newUser, ...users]);
        showToast('Utilisateur ajouté avec succès.', 'success');
      }
      setIsModalOpen(false);
      setUserToEdit(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "La sauvegarde a échoué.";
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteUser(token, userToDelete._id);
      setUsers(users.filter(u => u._id !== userToDelete._id));
      showToast("Utilisateur supprimé avec succès.", 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "La suppression a échoué.";
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
      setUserToDelete(null);
    }
  };
  
  const openAddModal = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };
  
  const openEditModal = (user: User) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const openViewDetailsModal = (user: User, tab: 'babies' | 'doctors' | 'recipes' | 'articles') => {
    setViewingUser(user);
    setDetailsTab(tab);
  };

  const handleGenderClick = (gender: 'Male' | 'Female' | 'Other') => {
    setGenderFilter(gender);
    setCurrentPage(1);
  };

  const renderContent = () => {
    if (loading) return <div className="flex-1 flex justify-center items-center"><LoadingSpinnerIcon className="h-12 w-12 text-premier" /></div>;
    if (error) return <p className="text-red-500 text-center p-4 bg-red-50 rounded-lg m-4">{error}</p>;

    return (
      <PageLayout
        title="Tous les utilisateurs"
        headerContent={
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
            <div className="relative flex-grow w-full sm:w-auto">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="search"
                placeholder="Rechercher un utilisateur..."
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-color rounded-lg text-sm text-text-primary focus:ring-premier focus:border-premier transition"
              />
            </div>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
              <Dropdown 
                options={genderFilterOptions}
                value={genderFilter}
                onChange={(val) => setGenderFilter(val as any)}
                labelPrefix="Genre : "
              />
              <Dropdown
                options={sortOptions}
                value={sortOption}
                onChange={setSortOption}
                labelPrefix="Trier par : "
              />
            </div>
          </div>
        }
      >
        <UserTable 
            users={paginatedUsers} 
            onEdit={openEditModal} 
            onDelete={setUserToDelete}
            onViewDetails={openViewDetailsModal}
            onGenderClick={handleGenderClick}
        />
        <Pagination 
          currentPage={currentPage}
          totalItems={sortedAndFilteredUsers.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </PageLayout>
    );
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {renderContent()}
      
      <EditUserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        user={userToEdit}
        isLoading={isSubmitting}
      />
      
      <ConfirmationModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer ${userToDelete?.name} ${userToDelete?.lastname}? Cette action est irréversible.`}
        confirmButtonText="Supprimer"
        isLoading={isSubmitting}
      />

      <UserDetailsModal
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        user={viewingUser}
        categories={categories}
        initialTab={detailsTab}
        onNavigateToBaby={onNavigateToBaby}
      />
    </>
  );
};

export default UsersPage;
