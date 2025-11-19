
import React from 'react';
import { User, Baby } from '../types';
import { XIcon, BabyIcon, PencilIcon } from './icons';

interface UserBabiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  babies: Baby[];
  onNavigateToBaby: (babyId: string) => void;
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

const UserBabiesModal: React.FC<UserBabiesModalProps> = ({ isOpen, onClose, user, babies, onNavigateToBaby }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all animate-fade-in-up">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-medium leading-6 text-text-primary">
              Bébés de {user.name} {user.lastname}
            </h3>
            <button type="button" onClick={onClose} className="text-text-secondary hover:text-text-primary">
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-4">
            {babies.length > 0 ? (
              <div className="overflow-x-auto border border-border-color rounded-lg">
                <table className="min-w-full divide-y divide-border-color">
                  <thead className="bg-table-header-bg">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Nom</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Genre</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Anniversaire</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border-color">
                    {babies.map((baby) => (
                      <tr key={baby._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{baby.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{baby.gender || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{formatDate(baby.birthday)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button 
                            onClick={() => onNavigateToBaby(baby._id)}
                            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-text-secondary hover:text-text-primary transition-colors"
                            aria-label={`Modifier ${baby.name}`}
                          >
                             <PencilIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 px-4 border-2 border-dashed border-border-color rounded-lg">
                <BabyIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h4 className="mt-2 text-sm font-medium text-text-primary">Aucun bébé trouvé</h4>
                <p className="mt-1 text-sm text-text-secondary">Cet utilisateur n'a pas de bébé enregistré.</p>
              </div>
            )}
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-premier sm:text-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserBabiesModal;
