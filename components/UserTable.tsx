
import React from 'react';
import { User } from '../types';
import { TrashIcon, PencilIcon, BabyIcon, DoctorIcon, CakeIcon, DocumentTextIcon } from './icons';
import Avatar from './Avatar';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onViewDetails: (user: User, tab: 'babies' | 'doctors' | 'recipes' | 'articles') => void;
  onGenderClick: (gender: 'Male' | 'Female' | 'Other') => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString || dateString.startsWith('0000-00-00')) return 'N/A';
  try {
    let date: Date;
    // Handle DD/MM/YYYY format from the backend
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      const parts = dateString.split('/');
      // new Date(year, monthIndex, day)
      date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    } else {
      // Fallback for ISO strings or other formats
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return 'N/A';
  }
};

const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete, onViewDetails, onGenderClick }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border-color">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Client
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Téléphone
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Genre
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Relations / Favoris
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Inscrit le
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-border-color">
          {users.map((user) => (
            <tr key={user._id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Avatar 
                      name={user.name} 
                      lastname={user.lastname}
                      src={user.avatar} 
                    />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-text-primary">{user.name} {user.lastname}</div>
                    <div className="text-sm text-text-secondary">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                {user.phone || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                {user.gender ? (
                  <button
                    onClick={() => user.gender && onGenderClick(user.gender)}
                    className="cursor-pointer hover:text-premier transition-colors"
                  >
                    {user.gender === 'Male' ? 'Homme' : user.gender === 'Female' ? 'Femme' : 'Autre'}
                  </button>
                ) : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex items-center gap-2">
                    {/* Babies */}
                    <button 
                        onClick={() => onViewDetails(user, 'babies')}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${ (user.babies?.length || 0) > 0 ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                        title="Bébés"
                    >
                        <BabyIcon className="h-3.5 w-3.5" />
                        <span>{user.babies?.length || 0}</span>
                    </button>

                    {/* Doctors */}
                    <button 
                        onClick={() => onViewDetails(user, 'doctors')}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${ (user.doctors?.length || 0) > 0 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                        title="Médecins favoris"
                    >
                        <DoctorIcon className="h-3.5 w-3.5" />
                        <span>{user.doctors?.length || 0}</span>
                    </button>

                    {/* Recipes */}
                    <button 
                        onClick={() => onViewDetails(user, 'recipes')}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${ (user.recipes?.length || 0) > 0 ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                        title="Recettes favorites"
                    >
                        <CakeIcon className="h-3.5 w-3.5" />
                        <span>{user.recipes?.length || 0}</span>
                    </button>

                    {/* Articles */}
                    <button 
                        onClick={() => onViewDetails(user, 'articles')}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${ (user.articles?.length || 0) > 0 ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                        title="Articles favoris"
                    >
                        <DocumentTextIcon className="h-3.5 w-3.5" />
                        <span>{user.articles?.length || 0}</span>
                    </button>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                {formatDate(user.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-md text-text-secondary hover:bg-gray-100 hover:text-premier transition-colors"
                    aria-label={`Modifier ${user.name}`}
                  >
                     <PencilIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => onDelete(user)}
                    className="p-2 rounded-md text-text-secondary hover:bg-gray-100 hover:text-red-600 transition-colors"
                    aria-label={`Supprimer ${user.name}`}
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

export default UserTable;
