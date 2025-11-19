
import React from 'react';
import { Recipe, Category } from '../types';
import { TrashIcon, PencilIcon, ThumbUpIcon, ThumbDownIcon } from './icons';

interface RecipeTableProps {
  recipes: Recipe[];
  categories: Category[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
}

const RecipeTable: React.FC<RecipeTableProps> = ({ recipes, categories, onEdit, onDelete }) => {
  const getCategoryName = (recipe: Recipe) => {
    if (typeof recipe.category === 'object' && recipe.category) {
      return recipe.category.name;
    }
    if (typeof recipe.category === 'string') {
      const cat = categories.find(c => c._id === recipe.category);
      return cat ? cat.name : 'N/A';
    }
    return 'N/A';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border-color">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Image
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Titre
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Catégorie
            </th>
             <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Note
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Age (Jours)
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Sources
            </th>
             <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Réactions
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-border-color">
          {recipes.map((recipe) => {
             const categoryName = getCategoryName(recipe);
             
             return (
              <tr key={recipe._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-12 w-12 rounded-lg bg-gray-200 overflow-hidden">
                      {recipe.imageUrl ? (
                          <img src={recipe.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">No IMG</div>
                      )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-text-primary">{recipe.title}</div>
                  {recipe.city && (
                      <div className="text-xs text-text-secondary">{recipe.city}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                   {categoryName !== 'N/A' ? (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                           {categoryName}
                       </span>
                   ) : (
                       <span className="text-gray-400 italic">N/A</span>
                   )}
                </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  <div className="flex items-center">
                      <svg className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      {recipe.rating}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                  {recipe.minDay} - {recipe.maxDay}
                </td>
                <td className="px-6 py-4 text-sm text-text-secondary">
                    {recipe.sources && recipe.sources.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {recipe.sources.map((source, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                {source.toUpperCase()}
                            </span>
                        ))}
                    </div>
                    ) : (
                        <span className="text-gray-400 italic">Aucune</span>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-green-600">
                            <ThumbUpIcon className="h-4 w-4" />
                            <span className="font-medium">{recipe.likes ? recipe.likes.length : 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-500">
                            <ThumbDownIcon className="h-4 w-4" />
                            <span className="font-medium">{recipe.dislikes ? recipe.dislikes.length : 0}</span>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => onEdit(recipe)}
                      className="p-2 rounded-md text-text-secondary hover:bg-gray-100 hover:text-premier transition-colors"
                      aria-label={`Modifier ${recipe.title}`}
                    >
                       <PencilIcon className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => onDelete(recipe)}
                      className="p-2 rounded-md text-text-secondary hover:bg-gray-100 hover:text-red-600 transition-colors"
                      aria-label={`Supprimer ${recipe.title}`}
                    >
                       <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RecipeTable;
