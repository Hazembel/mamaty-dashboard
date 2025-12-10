
import React from 'react';
import { Baby } from '../types';
import { TrashIcon, PencilIcon } from './icons';
import Avatar from './Avatar';

interface BabyTableProps {
  babies: Baby[];
  onEdit: (baby: Baby) => void;
  onDelete: (baby: Baby) => void;
  onGenderClick: (gender: 'Male' | 'Female') => void;
  onAuthClick: (auth: boolean) => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString || dateString.startsWith('0000-00-00')) return 'N/A';
  try {
    let date: Date;
    // Handle DD/MM/YYYY format commonly used in this backend
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      const parts = dateString.split('/');
      date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    } else {
      date = new Date(dateString);
    }
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (error) {
    return 'N/A';
  }
};

const BabyTable: React.FC<BabyTableProps> = ({ babies, onEdit, onDelete, onGenderClick, onAuthClick }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border-color">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Parent
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Bébé
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Genre
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Anniversaire
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Allergies
            </th>
             <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Maladies
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Autorisation
            </th>
            <th scope="col" className="relative px-6 py-3">
               <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-border-color">
          {babies.map((baby) => (
            <tr key={baby._id}>
              <td className="px-6 py-4 whitespace-nowrap">
                {/* Robust check for populated user object to display Parent Avatar */}
                {baby.userId && typeof baby.userId === 'object' && 'name' in baby.userId ? (
                   <div className="flex items-center">
                      <div className="flex-shrink-0">
                         <Avatar 
                            name={baby.userId.name || 'Inconnu'} 
                            lastname={baby.userId.lastname} 
                            src={baby.userId.avatar}
                         />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-text-primary">{baby.userId.name} {baby.userId.lastname}</div>
                        <div className="text-sm text-text-secondary">{baby.userId.email}</div>
                      </div>
                    </div>
                ) : (
                    <span className="text-sm text-text-secondary italic">
                        {typeof baby.userId === 'string' ? 'Utilisateur non trouvé' : 'N/A'}
                    </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                        <Avatar name={baby.name} src={baby.avatar} size="sm" className="w-8 h-8" />
                    </div>
                    {baby.name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                 {baby.gender ? (
                    <button onClick={() => baby.gender && onGenderClick(baby.gender)} className="cursor-pointer hover:text-premier transition-colors">
                      {baby.gender === 'Male' ? 'Garçon' : 'Fille'}
                    </button>
                  ) : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{formatDate(baby.birthday)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                {baby.allergy && baby.allergy.toLowerCase() !== 'aucune' ? baby.allergy : 'Aucune'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                {baby.disease && baby.disease.toLowerCase() !== 'aucune' ? baby.disease : 'Aucune'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button onClick={() => onAuthClick(!!baby.autorisation)} className="cursor-pointer">
                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ baby.autorisation ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }`}>
                      {baby.autorisation ? 'Oui' : 'Non'}
                  </span>
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button onClick={() => onEdit(baby)} className="p-2 rounded-md text-text-secondary hover:bg-gray-100 hover:text-premier transition-colors" aria-label={`Modifier ${baby.name}`}><PencilIcon className="h-5 w-5" /></button>
                  <button onClick={() => onDelete(baby)} className="p-2 rounded-md text-text-secondary hover:bg-gray-100 hover:text-red-600 transition-colors" aria-label={`Supprimer ${baby.name}`}><TrashIcon className="h-5 w-5" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BabyTable;
