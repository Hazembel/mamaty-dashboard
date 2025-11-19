
import React, { useEffect, useState, useMemo } from 'react';
import { getBabies, updateBaby, deleteBaby } from '../services/babyService';
import { Baby } from '../types';
import BabyTable from './BabyTable';
import Pagination from './Pagination';
import PageLayout from './PageLayout';
import { SearchIcon, LoadingSpinnerIcon, XIcon, FilterIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';
import EditBabyModal from './EditBabyModal';
import Dropdown, { DropdownOption } from './Dropdown';

interface BabiesPageProps {
  token: string;
  onLogout: () => void;
  initialBabyId: string | null;
  onClearInitialBabyId: () => void;
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

const BabiesPage: React.FC<BabiesPageProps> = ({ token, onLogout, initialBabyId, onClearInitialBabyId }) => {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [babyToEdit, setBabyToEdit] = useState<Baby | null>(null);
  const [babyToDelete, setBabyToDelete] = useState<Baby | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [sortOption, setSortOption] = useState('createdAt-desc');
  const [authFilter, setAuthFilter] = useState<'all' | 'true' | 'false'>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'Male' | 'Female'>('all');
  const [healthFilter, setHealthFilter] = useState('all');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const sortOptions: DropdownOption[] = [
    { value: 'createdAt-desc', label: 'Plus récent' },
    { value: 'createdAt-asc', label: 'Plus ancien' },
    { value: 'name-asc', label: 'Nom (A-Z)' },
    { value: 'name-desc', label: 'Nom (Z-A)' },
  ];
  const authFilterOptions: DropdownOption[] = [
    { value: 'all', label: 'Toutes' },
    { value: 'true', label: 'Oui' },
    { value: 'false', label: 'Non' },
  ];
  const genderFilterOptions: DropdownOption[] = [
    { value: 'all', label: 'Tous' },
    { value: 'Male', label: 'Garçon' },
    { value: 'Female', label: 'Fille' },
  ];

  const healthFilterOptions = useMemo(() => {
    const healthIssues = new Set<string>();
    babies.forEach(baby => {
        if (baby.allergy && baby.allergy.toLowerCase() !== 'aucune' && baby.allergy.trim() !== '') {
            healthIssues.add(baby.allergy.trim());
        }
        if (baby.disease && baby.disease.toLowerCase() !== 'aucune' && baby.disease.trim() !== '') {
            healthIssues.add(baby.disease.trim());
        }
    });

    const options: DropdownOption[] = [{ value: 'all', label: 'Toutes' }];
    Array.from(healthIssues).sort().forEach(issue => {
        options.push({ value: issue, label: issue });
    });

    return options;
  }, [babies]);

  useEffect(() => {
    const fetchBabies = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedBabies = await getBabies(token);
        setBabies(fetchedBabies);
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

    fetchBabies();
  }, [token, onLogout]);

  useEffect(() => {
    if (initialBabyId && babies.length > 0) {
      const babyToOpen = babies.find(b => b._id === initialBabyId);
      if (babyToOpen) {
        setBabyToEdit(babyToOpen);
        onClearInitialBabyId(); // Clear the ID so it doesn't re-trigger
      }
    }
  }, [initialBabyId, babies, onClearInitialBabyId]);
  
  const sortedAndFilteredBabies = useMemo(() => {
    let filtered = babies
      .filter(baby =>
        (baby.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (baby.userId?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (baby.userId?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      .filter(baby => {
        if (authFilter === 'all') return true;
        return baby.autorisation === (authFilter === 'true');
      })
      .filter(baby => {
        if (genderFilter === 'all') return true;
        return baby.gender === genderFilter;
      })
      .filter(baby => {
        if (healthFilter === 'all') return true;
        const filterTerm = healthFilter.toLowerCase();
        const allergyMatch = (baby.allergy || '').toLowerCase() === filterTerm;
        const diseaseMatch = (baby.disease || '').toLowerCase() === filterTerm;
        return allergyMatch || diseaseMatch;
      });

    if (sortOption) {
      const [key, direction] = sortOption.split('-') as [keyof Baby | string, 'asc' | 'desc'];
      
      filtered.sort((a, b) => {
        const aVal = key === 'userId.name' ? a.userId?.name : a[key as keyof Baby];
        const bVal = key === 'userId.name' ? b.userId?.name : b[key as keyof Baby];
        
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        
        let comparison = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal, 'fr', { sensitivity: 'base' });
        } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
          comparison = aVal === bVal ? 0 : aVal ? -1 : 1;
        } else if (aVal < bVal) {
          comparison = -1;
        } else if (aVal > bVal) {
          comparison = 1;
        }
        
        return direction === 'desc' ? comparison * -1 : comparison;
      });
    }
    return filtered;
  }, [babies, searchTerm, sortOption, authFilter, genderFilter, healthFilter]);

  const paginatedBabies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredBabies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedAndFilteredBabies, currentPage]);

  const handleSaveBaby = async (babyData: Partial<Baby>) => {
    if (!babyToEdit) return;
    setIsSubmitting(true);
    try {
      const savedBaby = await updateBaby(token, babyToEdit._id, babyData);
      setBabies(babies.map(b => (b._id === savedBaby._id ? { ...b, ...savedBaby } : b)));
      showToast('Bébé mis à jour avec succès.', 'success');
      setBabyToEdit(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "La sauvegarde a échoué.";
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!babyToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteBaby(token, babyToDelete._id);
      setBabies(babies.filter(b => b._id !== babyToDelete._id));
      showToast("Bébé supprimé avec succès.", 'success');
      setBabyToDelete(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "La suppression a échoué.";
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
      setBabyToDelete(null);
    }
  };

  const handleGenderClick = (gender: 'Male' | 'Female') => {
    setGenderFilter(gender);
    setCurrentPage(1);
  };

  const handleAuthClick = (auth: boolean) => {
    setAuthFilter(auth ? 'true' : 'false');
    setCurrentPage(1);
  };

  const renderContent = () => {
    if (loading) return <div className="flex-1 flex justify-center items-center"><LoadingSpinnerIcon className="h-12 w-12 text-premier" /></div>;
    if (error) return <p className="text-red-500 text-center p-4 bg-red-50 rounded-lg m-4">{error}</p>;

    return (
      <PageLayout
        title="Tous les bébés"
        headerContent={
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
            <div className="relative flex-grow w-full sm:w-auto">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="search"
                placeholder="Rechercher par nom..."
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-color rounded-lg text-sm text-text-primary focus:ring-premier focus:border-premier transition"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
               <Dropdown 
                  options={healthFilterOptions}
                  value={healthFilter}
                  onChange={(val) => { setHealthFilter(val); setCurrentPage(1); }}
                  labelPrefix="Santé : "
               />
               <Dropdown 
                  options={genderFilterOptions}
                  value={genderFilter}
                  onChange={(val) => setGenderFilter(val as any)}
                  labelPrefix="Genre : "
               />
               <Dropdown 
                  options={authFilterOptions}
                  value={authFilter}
                  onChange={(val) => setAuthFilter(val as any)}
                  labelPrefix="Autorisation : "
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
        <BabyTable 
            babies={paginatedBabies} 
            onEdit={setBabyToEdit} 
            onDelete={setBabyToDelete}
            onGenderClick={handleGenderClick}
            onAuthClick={handleAuthClick}
        />
        <Pagination 
          currentPage={currentPage}
          totalItems={sortedAndFilteredBabies.length}
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
      
      <EditBabyModal 
        isOpen={!!babyToEdit}
        onClose={() => setBabyToEdit(null)}
        onSave={handleSaveBaby}
        baby={babyToEdit}
        isLoading={isSubmitting}
      />
      
      <ConfirmationModal
        isOpen={!!babyToDelete}
        onClose={() => setBabyToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer le bébé"
        message={`Êtes-vous sûr de vouloir supprimer ${babyToDelete?.name} ? Cette action est irréversible.`}
        confirmButtonText="Supprimer"
        isLoading={isSubmitting}
      />
    </>
  );
};

export default BabiesPage;
