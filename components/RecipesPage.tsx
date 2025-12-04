
import React, { useEffect, useState, useMemo } from 'react';
import { getRecipes, createRecipe, updateRecipe, deleteRecipe, activateRecipe, deactivateRecipe } from '../services/recipeService';
import { getCategories } from '../services/categoryService';
import { Recipe, Category } from '../types';
import Pagination from './Pagination';
import PageLayout from './PageLayout';
import { SearchIcon, LoadingSpinnerIcon, XIcon, PlusIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';
import EditRecipeModal from './EditRecipeModal';
import RecipeTable from './RecipeTable';
import Dropdown, { DropdownOption } from './Dropdown';

interface RecipesPageProps {
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

const RecipesPage: React.FC<RecipesPageProps> = ({ token, onLogout }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [sortOption, setSortOption] = useState('createdAt-desc');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };
  
  const sortOptions: DropdownOption[] = [
    { value: 'createdAt-desc', label: 'Plus récent' },
    { value: 'createdAt-asc', label: 'Plus ancien' },
    { value: 'title-asc', label: 'Titre (A-Z)' },
    { value: 'title-desc', label: 'Titre (Z-A)' },
    { value: 'rating-desc', label: 'Mieux notés' },
    { value: 'updatedAt-desc', label: 'Dernière modification' },
    { value: 'scheduledAt-desc', label: 'Date de planification' },
    { value: 'viewers-desc', label: 'Vues (Décroissant)' },
  ];

  const statusFilterOptions: DropdownOption[] = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  // Filter categories for 'recipe' type
  const recipeCategories = useMemo(() => {
    return categories.filter(c => c.contentTypes && c.contentTypes.includes('recipe'));
  }, [categories]);

  const categoryFilterOptions = useMemo(() => {
      const options = [{ value: 'all', label: 'Toutes les catégories' }];
      recipeCategories.forEach(c => options.push({ value: c._id, label: c.name }));
      return options;
  }, [recipeCategories]);

  // Extract all unique ingredients from existing recipes
  const allIngredients = useMemo(() => {
    const ingredientsSet = new Set<string>();
    recipes.forEach(recipe => {
        if (recipe.ingredients) {
            recipe.ingredients.forEach(ing => {
                if (ing.name && ing.name.trim()) {
                    ingredientsSet.add(ing.name.trim());
                }
            });
        }
    });
    return Array.from(ingredientsSet).sort();
  }, [recipes]);

  // Extract all unique sources from existing recipes
  const allSources = useMemo(() => {
    const sourcesSet = new Set<string>();
    recipes.forEach(recipe => {
        if (recipe.sources) {
            recipe.sources.forEach(s => {
                if (s && s.trim()) {
                    sourcesSet.add(s.trim().toUpperCase());
                }
            });
        }
    });
    return Array.from(sourcesSet).sort();
  }, [recipes]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [fetchedRecipes, fetchedCategories] = await Promise.all([
            getRecipes(token),
            getCategories(token)
        ]);
        setRecipes(fetchedRecipes);
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

  const sortedAndFilteredRecipes = useMemo(() => {
    let filtered = recipes
      .filter(recipe =>
        (recipe.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (recipe.city?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      .filter(recipe => {
          if (categoryFilter === 'all') return true;
          const catId = typeof recipe.category === 'object' ? recipe.category._id : recipe.category;
          return catId === categoryFilter;
      })
      .filter(recipe => {
          if (statusFilter === 'all') return true;
          const isActive = recipe.isActive !== false;
          return statusFilter === 'active' ? isActive : !isActive;
      });

    if (sortOption) {
        const [key, direction] = sortOption.split('-') as [string, 'asc' | 'desc'];
        
        filtered.sort((a: any, b: any) => {
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
            } else if (typeof aVal === 'number' && typeof bVal === 'number') {
                comparison = aVal - bVal;
            } else if (aVal < bVal) {
                comparison = -1;
            } else if (aVal > bVal) {
                comparison = 1;
            }
            return direction === 'desc' ? -comparison : comparison;
        });
    }

    return filtered;
  }, [recipes, searchTerm, sortOption, categoryFilter, statusFilter]);

  const paginatedRecipes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredRecipes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedAndFilteredRecipes, currentPage]);

  const handleSaveRecipe = async (recipeData: Partial<Recipe>) => {
    setIsSubmitting(true);
    try {
      if (recipeToEdit) {
        const updated = await updateRecipe(token, recipeToEdit._id, recipeData);
        setRecipes(recipes.map(r => (r._id === updated._id ? { ...r, ...updated } : r)));
        showToast('Recette mise à jour avec succès.', 'success');
      } else {
        const newRecipe = await createRecipe(token, recipeData);
        // Manually populate category for immediate display
        if (typeof newRecipe.category === 'string') {
            const cat = categories.find(c => c._id === newRecipe.category);
            if (cat) newRecipe.category = cat;
        }
        setRecipes([newRecipe, ...recipes]);
        showToast('Recette ajoutée avec succès.', 'success');
      }
      setIsModalOpen(false);
      setRecipeToEdit(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "La sauvegarde a échoué.";
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (recipe: Recipe) => {
    try {
        const isActive = recipe.isActive !== false;
        let updatedRecipe;
        
        if (isActive) {
            updatedRecipe = await deactivateRecipe(token, recipe._id);
            showToast('Recette désactivée.', 'success');
        } else {
            updatedRecipe = await activateRecipe(token, recipe._id);
            showToast('Recette activée.', 'success');
        }
        setRecipes(recipes.map(r => r._id === updatedRecipe._id ? { ...r, ...updatedRecipe } : r));
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Impossible de modifier le statut.";
        showToast(errorMessage, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!recipeToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteRecipe(token, recipeToDelete._id);
      setRecipes(recipes.filter(r => r._id !== recipeToDelete._id));
      showToast("Recette supprimée avec succès.", 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "La suppression a échoué.";
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
      setRecipeToDelete(null);
    }
  };
  
  const openAddModal = () => {
    setRecipeToEdit(null);
    setIsModalOpen(true);
  };
  
  const openEditModal = (recipe: Recipe) => {
    setRecipeToEdit(recipe);
    setIsModalOpen(true);
  };

  const renderContent = () => {
    if (loading) return <div className="flex-1 flex justify-center items-center"><LoadingSpinnerIcon className="h-12 w-12 text-premier" /></div>;
    if (error) return <p className="text-red-500 text-center p-4 bg-red-50 rounded-lg m-4">{error}</p>;

    return (
        <>
            <RecipeTable
              recipes={paginatedRecipes}
              categories={categories}
              onEdit={openEditModal}
              onDelete={setRecipeToDelete}
              onToggleStatus={handleToggleStatus}
            />
            <Pagination 
                currentPage={currentPage}
                totalItems={sortedAndFilteredRecipes.length}
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
        title="Gestion des recettes"
        headerContent={
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
            <div className="relative flex-grow w-full sm:w-auto">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="search"
                placeholder="Rechercher une recette..."
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
      
      <EditRecipeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecipe}
        recipe={recipeToEdit}
        categories={recipeCategories}
        isLoading={isSubmitting}
        existingIngredients={allIngredients}
        existingSources={allSources}
        token={token}
      />
      
      <ConfirmationModal
        isOpen={!!recipeToDelete}
        onClose={() => setRecipeToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer la recette"
        message={`Êtes-vous sûr de vouloir supprimer la recette "${recipeToDelete?.title}" ? Cette action est irréversible.`}
        confirmButtonText="Supprimer"
        isLoading={isSubmitting}
      />
    </>
  );
};

export default RecipesPage;
