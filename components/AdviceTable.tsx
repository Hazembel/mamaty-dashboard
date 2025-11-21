
import React from 'react';
import { Advice } from '../types';
import { TrashIcon, PencilIcon, ThumbUpIcon, ThumbDownIcon, EyeIcon } from './icons';

interface AdviceTableProps {
  advices: Advice[];
  onEdit: (advice: Advice) => void;
  onDelete: (advice: Advice) => void;
  onToggleStatus: (advice: Advice) => void;
}

const AdviceTable: React.FC<AdviceTableProps> = ({ advices, onEdit, onDelete, onToggleStatus }) => {
  
  const isValidNumber = (val: any): boolean => {
    return val !== null && val !== undefined && !isNaN(Number(val));
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border-color">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Aperçu
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Titre
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Catégorie
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Ciblage (Jours)
            </th>
             <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Statistiques
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
          {advices.map((advice) => {
            const isActive = advice.isActive !== false; // Default to active

            return (
            <tr key={advice._id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-12 w-12 rounded-lg bg-gray-200 overflow-hidden">
                    {advice.imageUrl && advice.imageUrl.length > 0 ? (
                        <img src={advice.imageUrl[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">No IMG</div>
                    )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-text-primary">{advice.title}</div>
                <div className="text-xs text-text-secondary truncate max-w-xs">
                    {advice.description && advice.description[0]}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                 {typeof advice.category === 'object' && advice.category ? (
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                         {advice.category.name}
                     </span>
                 ) : (
                     <span className="text-gray-400 italic">N/A</span>
                 )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                {isValidNumber(advice.minDay) && isValidNumber(advice.maxDay) ? (
                     <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                         {advice.minDay} - {advice.maxDay} j
                     </span>
                ) : isValidNumber(advice.day) ? (
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                        Jour {advice.day}
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-green-600" title="J'aime">
                            <ThumbUpIcon className="h-4 w-4" />
                            <span className="font-medium">{advice.likes ? advice.likes.length : 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-500" title="Je n'aime pas">
                            <ThumbDownIcon className="h-4 w-4" />
                            <span className="font-medium">{advice.dislikes ? advice.dislikes.length : 0}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500" title="Vues">
                          <EyeIcon className="h-4 w-4" />
                          <span className="font-medium">{advice.viewers ? advice.viewers.length : 0}</span>
                    </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                   <button 
                      onClick={() => onToggleStatus(advice)}
                      className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full cursor-pointer transition-colors ${isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                      title="Cliquez pour changer le statut"
                    >
                      {isActive ? 'Actif' : 'Inactif'}
                    </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => onEdit(advice)}
                    className="p-2 rounded-md text-text-secondary hover:bg-gray-100 hover:text-premier transition-colors"
                    aria-label={`Modifier ${advice.title}`}
                  >
                     <PencilIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => onDelete(advice)}
                    className="p-2 rounded-md text-text-secondary hover:bg-gray-100 hover:text-red-600 transition-colors"
                    aria-label={`Supprimer ${advice.title}`}
                  >
                     <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AdviceTable;
