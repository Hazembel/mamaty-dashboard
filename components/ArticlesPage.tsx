
import React, { useEffect, useState, useMemo } from 'react';
import { getArticles, createArticle, updateArticle, deleteArticle, activateArticle, deactivateArticle } from '../services/articleService';
import { getCategories } from '../services/categoryService';
import { Article, Category } from '../types';
import Pagination from './Pagination';
import PageLayout from './PageLayout';
import { SearchIcon, LoadingSpinnerIcon, XIcon, PlusIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';
import EditArticleModal from './EditArticleModal';
import ArticleTable from './ArticleTable';
import Dropdown, { DropdownOption } from './Dropdown';

interface ArticlesPageProps {
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

const ArticlesPage: React.FC<ArticlesPageProps> = ({ token, onLogout }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [articleToEdit, setArticleToEdit] = useState<Article | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [sortOption, setSortOption] = useState('createdAt-desc');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };
  
  const sortOptions: DropdownOption[] = [
    { value: 'createdAt-desc', label: 'Plus récent (Création)' },
    { value: 'createdAt-asc', label: 'Plus ancien (Création)' },
    { value: 'updatedAt-desc', label: 'Dernière modification' },
    { value: 'scheduledAt-desc', label: 'Date de planification' },
    { value: 'title-asc', label: 'Titre (A-Z)' },
    { value: 'title-desc', label: 'Titre (Z-A)' },
    { value: 'viewers-desc', label: 'Vues (Décroissant)' },
  ];
  
  const statusFilterOptions: DropdownOption[] = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
  ];

  // Filter categories to only show those relevant to 'article'
  const articleCategories = useMemo(() => {
    return categories.filter(c => c.contentTypes && c.contentTypes.includes('article'));
  }, [categories]);

  const categoryFilterOptions = useMemo(() => {
      const options = [{ value: 'all', label: 'Toutes les catégories' }];
      articleCategories.forEach(c => options.push({ value: c._id, label: c.name }));
      return options;
  }, [articleCategories]);

  // Extract all unique sources from existing articles
  const allSources = useMemo(() => {
    const sourcesSet = new Set<string>();
    articles.forEach(article => {
        if (article.sources) {
            article.sources.forEach(s => {
                if (s && s.trim()) {
                    sourcesSet.add(s.trim().toUpperCase());
                }
            });
        }
    });
    return Array.from(sourcesSet).sort();
  }, [articles]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [fetchedArticles, fetchedCategories] = await Promise.all([
            getArticles(token),
            getCategories(token)
        ]);
        setArticles(fetchedArticles);
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

  const sortedAndFilteredArticles = useMemo(() => {
    let filtered = articles
      .filter(article =>
        (article.title?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      .filter(article => {
          if (categoryFilter === 'all') return true;
          const catId = typeof article.category === 'object' ? article.category._id : article.category;
          return catId === categoryFilter;
      })
      .filter(article => {
          if (statusFilter === 'all') return true;
          // Treat undefined as true (Active) to match legacy data and modal behavior
          const isActive = article.isActive !== false;
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
            } else if (aVal < bVal) {
                comparison = -1;
            } else if (aVal > bVal) {
                comparison = 1;
            }
            return direction === 'desc' ? -comparison : comparison;
        });
    }

    return filtered;
  }, [articles, searchTerm, sortOption, categoryFilter, statusFilter]);

  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredArticles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedAndFilteredArticles, currentPage]);

  const handleSaveArticle = async (articleData: Partial<Article>) => {
    setIsSubmitting(true);
    try {
      if (articleToEdit) {
        const updated = await updateArticle(token, articleToEdit._id, articleData);
        setArticles(articles.map(a => (a._id === updated._id ? { ...a, ...updated } : a)));
        showToast('Article mis à jour avec succès.', 'success');
      } else {
        const newArticle = await createArticle(token, articleData);
        // Manually populate category name for immediate display if it's returned as ID
        if (typeof newArticle.category === 'string') {
            const cat = categories.find(c => c._id === newArticle.category);
            if (cat) newArticle.category = cat;
        }
        setArticles([newArticle, ...articles]);
        showToast('Article ajouté avec succès.', 'success');
      }
      setIsModalOpen(false);
      setArticleToEdit(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "La sauvegarde a échoué.";
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (article: Article) => {
      try {
          const isActive = article.isActive !== false; // Current status (undefined = true)
          let updatedArticle;
          
          if (isActive) {
              updatedArticle = await deactivateArticle(token, article._id);
              showToast('Article désactivé.', 'success');
          } else {
              updatedArticle = await activateArticle(token, article._id);
              showToast('Article activé.', 'success');
          }
          // Update local state
          setArticles(articles.map(a => a._id === updatedArticle._id ? { ...a, ...updatedArticle } : a));
      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Impossible de modifier le statut.";
          showToast(errorMessage, 'error');
      }
  };

  const handleConfirmDelete = async () => {
    if (!articleToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteArticle(token, articleToDelete._id);
      setArticles(articles.filter(a => a._id !== articleToDelete._id));
      showToast("Article supprimé avec succès.", 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "La suppression a échoué.";
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
      setArticleToDelete(null);
    }
  };
  
  const openAddModal = () => {
    setArticleToEdit(null);
    setIsModalOpen(true);
  };
  
  const openEditModal = (article: Article) => {
    setArticleToEdit(article);
    setIsModalOpen(true);
  };

  const renderContent = () => {
    if (loading) return <div className="flex-1 flex justify-center items-center"><LoadingSpinnerIcon className="h-12 w-12 text-premier" /></div>;
    if (error) return <p className="text-red-500 text-center p-4 bg-red-50 rounded-lg m-4">{error}</p>;

    return (
        <>
            <ArticleTable
              articles={paginatedArticles}
              onEdit={openEditModal}
              onDelete={setArticleToDelete}
              onToggleStatus={handleToggleStatus}
            />
            <Pagination 
                currentPage={currentPage}
                totalItems={sortedAndFilteredArticles.length}
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
        title="Gestion des articles"
        headerContent={
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
            <div className="relative flex-grow w-full sm:w-auto">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="search"
                placeholder="Rechercher un article..."
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
      
      <EditArticleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveArticle}
        article={articleToEdit}
        categories={articleCategories}
        isLoading={isSubmitting}
        existingSources={allSources}
      />
      
      <ConfirmationModal
        isOpen={!!articleToDelete}
        onClose={() => setArticleToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer l'article"
        message={`Êtes-vous sûr de vouloir supprimer l'article "${articleToDelete?.title}" ? Cette action est irréversible.`}
        confirmButtonText="Supprimer"
        isLoading={isSubmitting}
      />
    </>
  );
};

export default ArticlesPage;
