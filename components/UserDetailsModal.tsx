
import React, { useState, useEffect } from 'react';
import { User, Baby, Doctor, Recipe, Article, Category } from '../types';
import { XIcon, BabyIcon, DoctorIcon, CakeIcon, DocumentTextIcon, PencilIcon } from './icons';
import Avatar from './Avatar';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  categories: Category[];
  initialTab?: 'babies' | 'doctors' | 'recipes' | 'articles';
  onNavigateToBaby?: (babyId: string) => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString || dateString.startsWith('0000-00-00')) return 'N/A';
  try {
    let date: Date;
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      const parts = dateString.split('/');
      date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    } else {
      date = new Date(dateString);
    }
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch (error) {
    return 'N/A';
  }
};

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, onClose, user, categories, initialTab = 'babies', onNavigateToBaby }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen || !user) return null;

  const babies = user.babies || [];
  const doctors = user.doctors || [];
  const recipes = user.recipes || [];
  const articles = user.articles || [];

  const tabs = [
      { id: 'babies', label: 'Bébés', icon: BabyIcon, count: babies.length },
      { id: 'doctors', label: 'Médecins', icon: DoctorIcon, count: doctors.length },
      { id: 'recipes', label: 'Recettes', icon: CakeIcon, count: recipes.length },
      { id: 'articles', label: 'Articles', icon: DocumentTextIcon, count: articles.length },
  ];

  const getCategoryName = (category: Category | string | undefined) => {
    if (!category) return 'N/A';
    if (typeof category === 'string') {
        const found = categories.find(c => c._id === category);
        return found ? found.name : 'N/A';
    }
    return category.name || 'N/A';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col transform transition-all animate-fade-in-up">
        
        {/* Header */}
        <div className="p-6 border-b border-border-color flex justify-between items-start bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-4">
             <Avatar name={user.name} lastname={user.lastname} src={user.avatar} size="lg" />
             <div>
                <h3 className="text-lg font-bold text-text-primary">
                    {user.name} {user.lastname}
                </h3>
                <p className="text-sm text-text-secondary">{user.email}</p>
             </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full text-text-secondary hover:bg-gray-200 transition-colors">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-color px-6 overflow-x-auto">
            {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 py-4 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap
                        ${activeTab === tab.id 
                            ? 'border-premier text-premier' 
                            : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-200'}`}
                    >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                        <span className={`ml-1 py-0.5 px-2 rounded-full text-xs ${activeTab === tab.id ? 'bg-premier/10' : 'bg-gray-100'}`}>
                            {tab.count}
                        </span>
                    </button>
                );
            })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
            
            {/* Babies Tab */}
            {activeTab === 'babies' && (
                <>
                    {babies.length > 0 ? (
                        <div className="overflow-hidden border border-border-color rounded-lg bg-white shadow-sm">
                            <table className="min-w-full divide-y divide-border-color">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Nom</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Genre</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Anniversaire</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-border-color">
                                    {babies.map((baby) => (
                                        <tr key={baby._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{baby.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{baby.gender === 'Male' ? 'Garçon' : baby.gender === 'Female' ? 'Fille' : 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{formatDate(baby.birthday)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {onNavigateToBaby && (
                                                    <button 
                                                        onClick={() => onNavigateToBaby(baby._id)}
                                                        className="text-premier hover:text-premier-dark text-sm font-medium"
                                                    >
                                                        Modifier
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState icon={BabyIcon} text="Aucun bébé enregistré." />
                    )}
                </>
            )}

            {/* Doctors Tab */}
            {activeTab === 'doctors' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {doctors.length > 0 ? (
                        doctors.map((doctor: any) => (
                             // Type any casted here because sometimes it might be an ID if not populated, handled by render check
                            (typeof doctor === 'object' && doctor.name) ? (
                                <div key={doctor._id} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-border-color shadow-sm">
                                    <Avatar name={doctor.name} src={doctor.imageUrl} size="lg" />
                                    <div>
                                        <h4 className="font-semibold text-text-primary">{doctor.name}</h4>
                                        <p className="text-sm text-premier">{doctor.specialty}</p>
                                        <p className="text-xs text-text-secondary mt-1">{doctor.city || 'Ville non spécifiée'}</p>
                                    </div>
                                </div>
                            ) : null
                        ))
                    ) : (
                        <div className="col-span-full"><EmptyState icon={DoctorIcon} text="Aucun médecin favori." /></div>
                    )}
                </div>
            )}

             {/* Recipes Tab */}
             {activeTab === 'recipes' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recipes.length > 0 ? (
                        recipes.map((recipe: any) => (
                            (typeof recipe === 'object' && recipe.title) ? (
                                <div key={recipe._id} className="bg-white rounded-lg border border-border-color shadow-sm overflow-hidden flex flex-col">
                                    <div className="h-32 bg-gray-200 relative">
                                        {recipe.imageUrl ? (
                                            <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400"><CakeIcon className="h-8 w-8" /></div>
                                        )}
                                    </div>
                                    <div className="p-3 flex-1 flex flex-col">
                                        <h4 className="font-semibold text-sm text-text-primary line-clamp-2 mb-1">{recipe.title}</h4>
                                        <div className="mt-auto flex items-center justify-between">
                                            <span className="text-xs text-text-secondary bg-gray-100 px-2 py-0.5 rounded-full">
                                                {getCategoryName(recipe.category)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                             ) : null
                        ))
                    ) : (
                        <div className="col-span-full"><EmptyState icon={CakeIcon} text="Aucune recette favorite." /></div>
                    )}
                </div>
            )}

            {/* Articles Tab */}
            {activeTab === 'articles' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {articles.length > 0 ? (
                        articles.map((article: any) => (
                             (typeof article === 'object' && article.title) ? (
                                <div key={article._id} className="flex gap-3 p-3 bg-white rounded-lg border border-border-color shadow-sm items-center">
                                    <div className="h-16 w-16 rounded-md bg-gray-200 flex-shrink-0 overflow-hidden">
                                         {article.imageUrl && article.imageUrl[0] ? (
                                            <img src={article.imageUrl[0]} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400"><DocumentTextIcon className="h-6 w-6" /></div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm text-text-primary line-clamp-2">{article.title}</h4>
                                         <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                                            {getCategoryName(article.category)}
                                        </span>
                                    </div>
                                </div>
                             ) : null
                        ))
                     ) : (
                        <div className="col-span-full"><EmptyState icon={DocumentTextIcon} text="Aucun article favori." /></div>
                     )}
                </div>
            )}
            
        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ icon: any, text: string }> = ({ icon: Icon, text }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-white p-4 rounded-full shadow-sm mb-3">
            <Icon className="h-8 w-8 text-gray-300" />
        </div>
        <p className="text-text-secondary font-medium">{text}</p>
    </div>
);

export default UserDetailsModal;
