
import React, { useEffect, useState, useMemo } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';
import { Category } from '../types';
import Pagination from './Pagination';
import PageLayout from './PageLayout';
import { SearchIcon, LoadingSpinnerIcon, XIcon, PlusIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';
import EditCategoryModal from './EditCategoryModal';
import CategoryTable from './CategoryTable';
import Dropdown, { DropdownOption } from './Dropdown';

interface CategoriesPageProps {
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

const CategoriesPage: React.FC<CategoriesPageProps> = ({ token, onLogout }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [sortOption, setSortOption] = useState('name-asc');
  const [statusFilter, setStatusFilter] = useState('all');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };
  
  const sortOptions: DropdownOption[] = [
    { value: 'name-asc', label: 'Nom (A-Z)' },
    { value: 'name-desc', label: 'Nom (Z-A)' },
    { value: 'createdAt-desc', label: 'Plus récent' },
    { value: 'createdAt-asc', label: 'Plus ancien' },
  ];

  const statusFilterOptions: DropdownOption[] = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedCategories = await getCategories(token);
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

  const sortedAndFilteredCategories = useMemo(() => {
    let filtered = categories
      .filter(category =>
        (category.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      .filter(category => {
          if (statusFilter === 'all') return true;
          return statusFilter === 'active' ? category.isActive : !category.isActive;
      });

    if (sortOption) {
        const [key, direction] = sortOption.split('-') as [keyof Category, 'asc' | 'desc'];
        filtered.sort((a: any, b: any) => {
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
  }, [categories, searchTerm, sortOption, statusFilter]);

  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredCategories.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedAndFilteredCategories, currentPage]);

  const handleSaveCategory = async (categoryData: Partial<Category>) => {
    setIsSubmitting(true);
    try {
      if (categoryToEdit) {
        const updated = await updateCategory(token, categoryToEdit._id, categoryData);
        setCategories(categories.map(c => (c._id === updated._id ? { ...c, ...updated } : c)));
        showToast('Catégorie mise à jour avec succès.', 'success');
      } else {
        const newCategory = await createCategory(token, categoryData);
        setCategories([newCategory, ...categories]);
        showToast('Catégorie ajoutée avec succès.', 'success');
      }
      setIsModalOpen(false);
      setCategoryToEdit(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "La sauvegarde a échoué.";
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteCategory(token, categoryToDelete._id);
      setCategories(categories.filter(c => c._id !== categoryToDelete._id));
      showToast("Catégorie supprimée avec succès.", 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "La suppression a échoué.";
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
      setCategoryToDelete(null);
    }
  };
  
  const openAddModal = () => {
    setCategoryToEdit(null);
    setIsModalOpen(true);
  };
  
  const openEditModal = (category: Category) => {
    setCategoryToEdit(category);
    setIsModalOpen(true);
  };

  const renderContent = () => {
    if (loading) return <div className="flex-1 flex justify-center items-center"><LoadingSpinnerIcon className="h-12 w-12 text-premier" /></div>;
    if (error) return <p className="text-red-500 text-center p-4 bg-red-50 rounded-lg m-4">{error}</p>;

    return (
        <>
            <CategoryTable
              categories={paginatedCategories}
              onEdit={openEditModal}
              onDelete={setCategoryToDelete}
            />
            <Pagination 
                currentPage={currentPage}
                totalItems={sortedAndFilteredCategories.length}
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
        title="Gestion des catégories"
        headerContent={
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
            <div className="relative flex-grow w-full sm:w-auto">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="search"
                placeholder="Rechercher une catégorie..."
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-color rounded-lg text-sm text-text-primary focus:ring-premier focus:border-premier transition"
              />
            </div>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
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
      
      <EditCategoryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCategory}
        category={categoryToEdit}
        isLoading={isSubmitting}
      />
      
      <ConfirmationModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer la catégorie"
        message={`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryToDelete?.name}" ? Cette action est irréversible.`}
        confirmButtonText="Supprimer"
        isLoading={isSubmitting}
      />
    </>
  );
};

export default CategoriesPage;
