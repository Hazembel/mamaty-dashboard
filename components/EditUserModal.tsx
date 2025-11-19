import React, { useState, useEffect, FormEvent } from 'react';
import { User } from '../types';
import { XIcon } from './icons';
import Avatar from './Avatar';
import DatePicker from './DatePicker';
import Dropdown from './Dropdown';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Partial<User>) => Promise<void>;
  user: User | null; // If null, it's in 'add' mode. Otherwise, 'edit' mode.
  isLoading?: boolean;
}

const genderOptions = [
    { value: '', label: 'Non spécifié' },
    { value: 'Male', label: 'Homme' },
    { value: 'Female', label: 'Femme' },
    { value: 'Other', label: 'Autre' },
];

const EditUserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    email: '',
    phone: '',
    password: '',
    gender: '',
    birthday: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  const isEditMode = !!user;

  useEffect(() => {
    if (isOpen) {
        setError(''); // Reset error when modal opens
        setConfirmPassword('');
        if (isEditMode && user) {
          let formattedBirthday = '';
          if (user.birthday && !user.birthday.startsWith('0000-00-00')) {
            try {
              let date: Date;
              const dateString = user.birthday;
              // Handle DD/MM/YYYY format
              if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
                  const parts = dateString.split('/');
                  date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
              } else {
                  // Fallback for ISO strings
                  date = new Date(dateString);
              }

              if (!isNaN(date.getTime())) {
                // Format to YYYY-MM-DD for the date input element
                formattedBirthday = date.toISOString().split('T')[0];
              }
            } catch (e) {
              console.error("Could not parse birthday:", user.birthday);
            }
          }

          setFormData({
            name: user.name || '',
            lastname: user.lastname || '',
            email: user.email || '',
            phone: user.phone || '',
            password: '', // Password is blank for editing unless changed
            gender: user.gender || '',
            birthday: formattedBirthday,
          });
        } else {
          // Reset form for 'add' mode
          setFormData({ name: '', lastname: '', email: '', phone: '', password: '', gender: '', birthday: '' });
        }
    }
  }, [isOpen, user, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
        const numericValue = value.replace(/\D/g, '');
        if (numericValue.length <= 8) {
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        }
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    const dataToSave: Partial<User> = {
      ...formData,
      gender: formData.gender ? (formData.gender as 'Male' | 'Female' | 'Other') : undefined,
    };
    if (isEditMode && !dataToSave.password) {
      delete dataToSave.password;
    }
    if (!dataToSave.birthday) delete dataToSave.birthday;

    try {
      await onSave(dataToSave);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Une erreur inconnue est survenue lors de l'enregistrement.");
      }
    }
  };

  if (!isOpen) return null;
  
  const inputBaseClass = "w-full bg-background rounded-lg py-2.5 px-4 text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-premier focus:bg-white transition-colors";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl transform transition-all">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-semibold text-text-primary">
                {isEditMode ? "Modifier l'information" : "Ajouter un utilisateur"}
              </h3>
              <button type="button" onClick={onClose} className="p-1 rounded-full text-text-secondary hover:bg-gray-100">
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            
            {isEditMode && user && (
              <div className="flex items-center gap-4 py-5 border-b border-border-color mb-6">
                <Avatar name={user.name} lastname={user.lastname} src={user.avatar} size="lg" />
                <div className="flex-grow">
                    <p className="font-semibold text-text-primary">{user.name} {user.lastname}</p>
                    <p className="text-sm text-text-secondary">{user.email}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Prénom</label>
                  <input required type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={inputBaseClass} />
                </div>
                <div>
                  <label htmlFor="lastname" className="block text-sm font-medium text-text-secondary mb-1">Nom</label>
                  <input required type="text" name="lastname" id="lastname" value={formData.lastname} onChange={handleChange} className={inputBaseClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-1">Téléphone</label>
                    <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} maxLength={8} pattern="\d{8}" title="Le numéro de téléphone doit contenir exactement 8 chiffres." className={inputBaseClass} />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                    <input required type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={inputBaseClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                 <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-text-secondary mb-1">Genre</label>
                    <Dropdown
                        options={genderOptions}
                        value={formData.gender}
                        onChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                    />
                </div>
                <div>
                    <label htmlFor="birthday" className="block text-sm font-medium text-text-secondary mb-1">Date de naissance</label>
                    <DatePicker
                        id="birthday"
                        name="birthday"
                        value={formData.birthday}
                        onChange={(date) => setFormData(prev => ({...prev, birthday: date}))}
                    />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">Mot de passe</label>
                   <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required={!isEditMode} placeholder={isEditMode ? "Laisser vide pour ne pas changer" : ""} pattern="^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$" title="Doit contenir au moins 8 caractères, une lettre, un chiffre et un symbole (@$!%*?&)." className={inputBaseClass} />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-1">Confirmer le mot de passe</label>
                   <input type="password" name="confirmPassword" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required={!!formData.password} className={inputBaseClass} />
                </div>
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
          </div>
          <div className="px-6 py-4 flex flex-row-reverse items-center gap-3 border-t border-border-color mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center rounded-lg shadow-sm px-5 py-2.5 bg-premier text-base font-semibold text-white hover:bg-premier-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-premier sm:text-sm disabled:opacity-50"
            >
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="inline-flex justify-center rounded-lg border border-border-color shadow-sm px-5 py-2.5 bg-white text-base font-semibold text-text-primary hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-premier sm:text-sm disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;