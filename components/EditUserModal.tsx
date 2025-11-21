
import React, { useState, useEffect, FormEvent, useMemo } from 'react';
import { User } from '../types';
import { XIcon } from './icons';
import Avatar from './Avatar';
import Dropdown from './Dropdown';
import DatePicker from './DatePicker';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Partial<User>) => Promise<void>;
  user: User | null; // If null, it's in 'add' mode. Otherwise, 'edit' mode.
  isLoading?: boolean;
  hideRole?: boolean;
}

const genderOptions = [
    { value: '', label: 'Non spécifié' },
    { value: 'male', label: 'Homme' },
    { value: 'female', label: 'Femme' },
    { value: 'other', label: 'Autre' },
];

const roleOptions = [
    { value: 'user', label: 'Utilisateur' },
    { value: 'admin', label: 'Administrateur' },
];

const MOM_AVATARS = [
  "assets/images/avatars/mom1.jpg",
  "assets/images/avatars/mom2.jpg",
  "assets/images/avatars/mom3.jpg",
  "assets/images/avatars/mom4.jpg",
];

const DAD_AVATARS = [
  "assets/images/avatars/dad1.jpg",
  "assets/images/avatars/dad2.jpg",
  "assets/images/avatars/dad3.jpg",
  "assets/images/avatars/dad4.jpg",
];

const EditUserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user, isLoading, hideRole }) => {
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    email: '',
    phone: '',
    password: '',
    gender: '',
    birthday: '',
    role: 'user',
    avatar: '',
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
                // Format to YYYY-MM-DD for the date input element using local time components
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                formattedBirthday = `${y}-${m}-${d}`;
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
            role: user.role || 'user',
            avatar: user.avatar || '',
          });
        } else {
          // Reset form for 'add' mode
          setFormData({ name: '', lastname: '', email: '', phone: '', password: '', gender: '', birthday: '', role: 'user', avatar: '' });
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

  const availableAvatars = useMemo(() => {
    if (formData.gender === 'female') return MOM_AVATARS;
    if (formData.gender === 'male') return DAD_AVATARS;
    // If other or not specified, show both
    return [...MOM_AVATARS, ...DAD_AVATARS];
  }, [formData.gender]);

  const calculateAge = (birthdayString: string) => {
    const today = new Date();
    const birthDate = new Date(birthdayString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate Password
    if (!isEditMode && !formData.password) {
        setError('Le mot de passe est requis pour un nouvel utilisateur.');
        return;
    }

    if (formData.password) {
        if (formData.password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        // Password Complexity Check: 1 letter, 1 number, 1 special char
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&+]).{6,}$/;
        if (!passwordRegex.test(formData.password)) {
            setError('Le mot de passe doit contenir au moins une lettre, un chiffre et un symbole (@, +, !, etc.).');
            return;
        }
    }

    // Validate Age (Birthday)
    if (formData.birthday) {
        const age = calculateAge(formData.birthday);
        if (age < 18) {
            setError("L'utilisateur doit avoir au moins 18 ans.");
            return;
        }
    }

    const dataToSave: Partial<User> = {
      ...formData,
      gender: formData.gender ? (formData.gender as 'male' | 'female' | 'other') : undefined,
      role: formData.role as 'user' | 'admin',
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
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl transform transition-all max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-semibold text-text-primary">
                {isEditMode ? "Modifier le profil" : "Ajouter un utilisateur"}
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
            
            <div className="space-y-5 mt-6">
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
                  <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                  <input required type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={inputBaseClass} />
                </div>
                 <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-text-secondary mb-1">Genre</label>
                  <Dropdown 
                    options={genderOptions} 
                    value={formData.gender} 
                    onChange={(val) => setFormData(prev => ({ ...prev, gender: val }))} 
                  />
                </div>
              </div>

              {/* Avatar Selection */}
              <div className="col-span-full">
                <label className="block text-sm font-medium text-text-secondary mb-3">Choisir un Avatar</label>
                <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border border-border-color max-h-40 overflow-y-auto custom-scrollbar">
                  {availableAvatars.map((avatarSrc) => (
                    <button
                      key={avatarSrc}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, avatar: avatarSrc }))}
                      className={`relative rounded-full p-1 transition-all ${formData.avatar === avatarSrc ? 'ring-2 ring-premier ring-offset-2 bg-white' : 'hover:bg-gray-200'}`}
                    >
                      <img 
                        src={avatarSrc} 
                        alt="Avatar option" 
                        className="w-12 h-12 rounded-full object-cover bg-gray-200"
                        // Fallback in case local asset is missing during dev
                        onError={(e) => e.currentTarget.src = `https://ui-avatars.com/api/?name=${avatarSrc.split('/').pop()}&background=random`} 
                      />
                    </button>
                  ))}
                </div>
                {!availableAvatars.includes(formData.avatar) && formData.avatar && (
                   <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
                      <span>Actuel (Personnalisé) :</span>
                      <span className="font-mono bg-gray-100 px-1 rounded truncate max-w-xs">{formData.avatar}</span>
                   </div>
                )}
              </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                 <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-1">Téléphone</label>
                  <input type="text" name="phone" id="phone" value={formData.phone} onChange={handleChange} className={inputBaseClass} placeholder="ex: 50123456" />
                </div>
                 <div>
                  <label htmlFor="birthday" className="block text-sm font-medium text-text-secondary mb-1">Date de naissance</label>
                  <DatePicker 
                    id="birthday"
                    name="birthday"
                    value={formData.birthday} 
                    onChange={(date) => setFormData(prev => ({ ...prev, birthday: date }))} 
                  />
                  {formData.birthday && calculateAge(formData.birthday) < 18 && (
                     <p className="text-xs text-red-500 mt-1">Âge: {calculateAge(formData.birthday)} ans (Doit être 18+)</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                 {!hideRole && (
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-text-secondary mb-1">Rôle</label>
                      <Dropdown 
                        options={roleOptions} 
                        value={formData.role} 
                        onChange={(val) => setFormData(prev => ({ ...prev, role: val }))} 
                      />
                    </div>
                 )}
              </div>

              <div className="border-t border-border-color pt-4 mt-2">
                 <p className="text-sm font-medium text-text-primary mb-3">{isEditMode ? "Changer le mot de passe (laisser vide pour conserver)" : "Définir le mot de passe"}</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">Mot de passe</label>
                        <input 
                            type="password" 
                            name="password" 
                            id="password" 
                            value={formData.password} 
                            onChange={handleChange} 
                            className={inputBaseClass} 
                            placeholder={isEditMode ? "" : "Lettre, chiffre, symbole (@,+,...)"}
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-1">Confirmer le mot de passe</label>
                        <input type="password" name="confirmPassword" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputBaseClass} />
                    </div>
                 </div>
              </div>
            
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
          </div>
          
           <div className="px-6 py-4 flex flex-row-reverse items-center gap-3 border-t border-border-color bg-gray-50 rounded-b-lg">
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
