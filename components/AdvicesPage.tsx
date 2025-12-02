
import React, { useEffect, useState, useMemo } from 'react';
import { getAdvices, createAdvice, updateAdvice, deleteAdvice, activateAdvice, deactivateAdvice } from '../services/adviceService';
import { getCategories } from '../services/categoryService';
import { Advice, Category } from '../types';
import Pagination from './Pagination';
import PageLayout from './PageLayout';
import { SearchIcon, LoadingSpinnerIcon, XIcon, PlusIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';
import EditAdviceModal from './EditAdviceModal';
import AdviceTable from './AdviceTable';
import Dropdown, { DropdownOption } from './Dropdown';

interface AdvicesPageProps {
  token: string;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 10;

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

const AGE_TABS = [
    { id: 'all', label: 'Les restes', min: -1, max: -1 },
    { id: '6-9', label: '6 - 9 mois (180 - 270 j)', min: 180, max: 270 },
];

const AdvicesPage: React.FC<AdvicesPageProps> = ({ token, onLogout }) => {
  const [advices, setAdvices] = useState<Advice[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [adviceToEdit, setAdviceToEdit] = useState<Advice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adviceToDelete, setAdviceToDelete] = useState<Advice | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [sortOption, setSortOption] = useState('day-asc');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };
  
  const sortOptions: DropdownOption[] = [
    { value: 'day-asc', label: 'Ciblage (Croissant)' },
    { value: 'day-desc', label: 'Ciblage (Décroissant)' },
    { value: 'title-asc', label: 'Titre (A-Z)' },
    { value: 'title-desc', label: 'Titre (Z-A)' },
    { value: 'createdAt-desc', label: 'Plus récent' },
    { value: 'createdAt-asc', label: 'Plus ancien' },
    { value: 'viewers-desc', label: 'Vues (Décroissant)' },
  ];

  const statusFilterOptions: DropdownOption[] = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
  ];

  // Filter categories to only show those relevant to 'advice'
  const adviceCategories = useMemo(() => {
    return categories.filter(c => c.contentTypes && c.contentTypes.includes('advice'));
  }, [categories]);

  const categoryFilterOptions = useMemo(() => {
      const options = [{ value: 'all', label: 'Toutes les catégories' }];
      adviceCategories.forEach(c => options.push({ value: c._id, label: c.name }));
      return options;
  }, [adviceCategories]);

  // Calculate used days across all advices to pass to modal for validation
  const usedDays = useMemo(() => {
    return advices
        .map(a => a.day)
        .filter((d): d is number => typeof d === 'number' && d !== null);
  }, [advices]);

  // Extract all unique sources from existing advices
  const allSources = useMemo(() => {
    const sourcesSet = new Set<string>();
    advices.forEach(advice => {
        if (advice.sources) {
            advice.sources.forEach(s => {
                if (s && s.trim()) {
                    sourcesSet.add(s.trim().toUpperCase());
                }
            });
        }
    });
    return Array.from(sourcesSet).sort();
  }, [advices]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [fetchedAdvices, fetchedCategories] = await Promise.all([
            getAdvices(token),
            getCategories(token)
        ]);
        setAdvices(fetchedAdvices);
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

  const sortedAndFilteredAdvices = useMemo(() => {
    let filtered = advices
      .filter(advice =>
        (advice.title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      .filter(advice => {
          if (categoryFilter === 'all') return true;
          const catId = typeof advice.category === 'object' ? advice.category._id : advice.category;
          return catId === categoryFilter;
      })
      .filter(advice => {
          if (statusFilter === 'all') return true;
          const isActive = advice.isActive !== false; // default true
          return statusFilter === 'active' ? isActive : !isActive;
      });

    // Tab Logic
    const isSixToNine = (a: Advice) => {
        const day = a.day !== null && a.day !== undefined ? Number(a.day) : null;
        const min = a.minDay !== null && a.minDay !== undefined ? Number(a.minDay) : null;
        const max = a.maxDay !== null && a.maxDay !== undefined ? Number(a.maxDay) : null;
        
        const start = 180;
        const end = 270;

        if (day !== null && !isNaN(day) && day >= start && day <= end) return true;
        if (min !== null && max !== null && !isNaN(min) && !isNaN(max) && min >= start && max <= end) return true;
        
        return false;
    };

    if (activeTab === 'all') {
        filtered = filtered.filter(a => !isSixToNine(a));
    } else if (activeTab === '6-9') {
        filtered = filtered.filter(a => isSixToNine(a));
    }

    if (sortOption) {
        const [key, direction] = sortOption.split('-') as [string, 'asc' | 'desc'];
        
        filtered.sort((a: any, b: any) => {
            if (key === 'day') {
                const getStartDay = (item: Advice) => {
                    if (item.minDay !== null && item.minDay !== undefined) return item.minDay;
                    if (item.day !== null && item.day !== undefined) return item.day;
                    return Infinity; 
                };
                const aVal = getStartDay(a);
                const bVal = getStartDay(b);
                return direction === 'asc' ? aVal - bVal : bVal - aVal;
            }
            if (key === 'viewers') {
                 const aVal = a.viewers?.length || 0;
                 const bVal = b.viewers?.length || 0;
                 return direction === 'desc' ? bVal - aVal : aVal - bVal;
            }

            const aVal = a[key];
            const bVal = b[key];
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
            return direction === 'desc' ? -comparison : comparison;
        });
    }

    return filtered;
  }, [advices, searchTerm, sortOption, categoryFilter, statusFilter, activeTab]);

  const paginatedAdvices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredAdvices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedAndFilteredAdvices, currentPage]);

  const handleSaveAdvice = async (adviceData: Partial<Advice>) => {
    setIsSubmitting(true);
    try {
      if (adviceToEdit) {
        const updated = await updateAdvice(token, adviceToEdit._id, adviceData);
        setAdvices(advices.map(a => (a._id === updated._id ? { ...a, ...updated } : a)));
        showToast('Conseil mis à jour avec succès.', 'success');
      } else {
        const newAdvice = await createAdvice(token, adviceData);
        if (typeof newAdvice.category === 'string') {
            const cat = categories.find(c => c._id === newAdvice.category);
            if (cat) newAdvice.category = cat;
        }
        setAdvices([newAdvice, ...advices]);
        showToast('Conseil ajouté avec succès.', 'success');
      }
      setIsModalOpen(false);
      setAdviceToEdit(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "La sauvegarde a échoué.";
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (advice: Advice) => {
    try {
        const isActive = advice.isActive !== false;
        let updatedAdvice;
        
        if (isActive) {
            updatedAdvice = await deactivateAdvice(token, advice._id);
            showToast('Conseil désactivé.', 'success');
        } else {
            updatedAdvice = await activateAdvice(token, advice._id);
            showToast('Conseil activé.', 'success');
        }
        setAdvices(advices.map(a => a._id === updatedAdvice._id ? { ...a, ...updatedAdvice } : a));
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Impossible de modifier le statut.";
        showToast(errorMessage, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!adviceToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteAdvice(token, adviceToDelete._id);
      setAdvices(advices.filter(a => a._id !== adviceToDelete._id));
      showToast("Conseil supprimé avec succès.", 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "La suppression a échoué.";
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
      setAdviceToDelete(null);
    }
  };
  
  const openAddModal = () => {
    setAdviceToEdit(null);
    setIsModalOpen(true);
  };
  
  const openEditModal = (advice: Advice) => {
    setAdviceToEdit(advice);
    setIsModalOpen(true);
  };

  const renderContent = () => {
    if (loading) return <div className="flex-1 flex justify-center items-center"><LoadingSpinnerIcon className="h-12 w-12 text-premier" /></div>;
    if (error) return <p className="text-red-500 text-center p-4 bg-red-50 rounded-lg m-4">{error}</p>;

    return (
        <>
            <div className="border-b border-border-color mb-0 bg-white">
                <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
                    {AGE_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                            className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                                ${activeTab === tab.id
                                    ? 'border-premier text-premier'
                                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'}
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <AdviceTable
              advices={paginatedAdvices}
              onEdit={openEditModal}
              onDelete={setAdviceToDelete}
              onToggleStatus={handleToggleStatus}
            />
            <Pagination 
                currentPage={currentPage}
                totalItems={sortedAndFilteredAdvices.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
            />
        </>
    );
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <PageLayout
        title="Gestion des conseils"
        headerContent={
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
            <div className="relative flex-grow w-full sm:w-auto">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="search"
                placeholder="Rechercher un conseil..."
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-color rounded-lg text-sm text-text-primary focus:ring-premier focus:border-premier transition"
              />
            </div>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
              <Dropdown 
                options={categoryFilterOptions}
                value={categoryFilter}
                onChange={(val) => { setCategoryFilter(val); setCurrentPage(1); }}
                labelPrefix="Catégorie : "
              />
              <Dropdown 
                options={statusFilterOptions}
                value={statusFilter}
                onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
              />
              <Dropdown
                options={sortOptions}
                value={sortOption}
                onChange={setSortOption}
                labelPrefix="Trier par : "
              />
            </div>

            <button 
              onClick={openAddModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-premier hover:bg-premier-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-premier transition-colors"
            >
                <PlusIcon className="h-5 w-5" />
                <span>Ajouter</span>
            </button>
          </div>
        }
      >
        {renderContent()}
      </PageLayout>
      
      <EditAdviceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAdvice}
        advice={adviceToEdit}
        categories={adviceCategories}
        usedDays={usedDays}
        isLoading={isSubmitting}
        existingSources={allSources}
      />
      
      <ConfirmationModal
        isOpen={!!adviceToDelete}
        onClose={() => setAdviceToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer le conseil"
        message={`Êtes-vous sûr de vouloir supprimer le conseil "${adviceToDelete?.title}" ? Cette action est irréversible.`}
        confirmButtonText="Supprimer"
        isLoading={isSubmitting}
      />
    </>
  );
};

export default AdvicesPage;
