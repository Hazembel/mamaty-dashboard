
import React from 'react';
import { Category } from '../types';
import { TrashIcon, PencilIcon } from './icons';

interface CategoryTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

const CategoryTable: React.FC<CategoryTableProps> = ({ categories, onEdit, onDelete }) => {
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'article': return 'bg-blue-100 text-blue-800';
      case 'advice': return 'bg-purple-100 text-purple-800';
      case 'recipe': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const translateType = (type: string) => {
      switch (type) {
          case 'advice': return 'Conseil';
          case 'recipe': return 'Recette';
          default: return 'Article';
      }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border-color">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Nom
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Types de contenu
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Tranches d'âge (Jours)
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Statut
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-border-color">
          {categories.map((category) => (
            <tr key={category._id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-text-primary">{category.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-wrap gap-1">
                    {category.contentTypes.map((type) => (
                        <span key={type} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getBadgeColor(type)}`}>
                            {translateType(type)}
                        </span>
                    ))}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                <div className="flex flex-col gap-0.5">
                    {category.ageRanges && category.ageRanges.length > 0 ? (
                        category.ageRanges.map((range, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full w-fit border border-gray-200">
                                {range.minDay} - {range.maxDay} j
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-400 italic">Aucune</span>
                    )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {category.isActive ? 'Actif' : 'Inactif'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => onEdit(category)}
                    className="p-2 rounded-md text-text-secondary hover:bg-gray-100 hover:text-premier transition-colors"
                    aria-label={`Modifier ${category.name}`}
                  >
                     <PencilIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => onDelete(category)}
                    className="p-2 rounded-md text-text-secondary hover:bg-gray-100 hover:text-red-600 transition-colors"
                    aria-label={`Supprimer ${category.name}`}
                  >
                     <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CategoryTable;
