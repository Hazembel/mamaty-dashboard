
import React, { useState, useEffect, FormEvent } from 'react';
import { Baby } from '../types';
import { XIcon } from './icons';
import Dropdown from './Dropdown';
import DatePicker from './DatePicker';

interface BabyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (baby: Partial<Baby>) => Promise<void>;
  baby: Baby | null;
  isLoading?: boolean;
}

const genderOptions = [
    { value: '', label: 'Non spécifié' },
    { value: 'Male', label: 'Garçon' },
    { value: 'Female', label: 'Fille' },
];

const EditBabyModal: React.FC<BabyModalProps> = ({ isOpen, onClose, onSave, baby, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    birthday: '',
    disease: '',
    allergy: '',
    headSize: '',
    height: '',
    weight: '',
  });
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (isOpen) {
        setError('');
        if (baby) {
          let formattedBirthday = '';
          if (baby.birthday && !baby.birthday.startsWith('0000-00-00')) {
            try {
              let date: Date;
              const dateString = baby.birthday;
              if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
                  const parts = dateString.split('/');
                  date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
              } else {
                  date = new Date(dateString);
              }

              if (!isNaN(date.getTime())) {
                // Format to YYYY-MM-DD using local components
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                formattedBirthday = `${y}-${m}-${d}`;
              }
            } catch (e) { console.error("Could not parse birthday:", baby.birthday); }
          }

          setFormData({
            name: baby.name || '',
            gender: baby.gender || '',
            birthday: formattedBirthday,
            disease: baby.disease || '',
            allergy: baby.allergy || '',
            headSize: baby.headSize?.toString() || '',
            height: baby.height?.toString() || '',
            weight: baby.weight?.toString() || '',
          });
        }
    }
  }, [isOpen, baby]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    const dataToSave: Partial<Baby> = {
      ...formData,
      gender: formData.gender ? (formData.gender as 'Male' | 'Female') : undefined,
      headSize: formData.headSize ? parseFloat(formData.headSize) : undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
    };
    if (!dataToSave.birthday) delete dataToSave.birthday;
    if (!dataToSave.disease) dataToSave.disease = 'aucune';
    if (!dataToSave.allergy) dataToSave.allergy = 'aucune';

    try {
      await onSave(dataToSave);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Une erreur inconnue est survenue.");
      }
    }
  };

  if (!isOpen) return null;

  const inputBaseClass = "w-full bg-background rounded-lg py-2.5 px-4 text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-premier focus:bg-white transition-colors";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 overflow-y-auto p-4 sm:p-10" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl transform transition-all mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-semibold text-text-primary">Modifier le bébé</h3>
              <button type="button" onClick={onClose} className="p-1 rounded-full text-text-secondary hover:bg-gray-100">
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Prénom</label>
                  <input required type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={inputBaseClass} />
                </div>
                 <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-text-secondary mb-1">Genre</label>
                    <Dropdown
                        options={genderOptions}
                        value={formData.gender}
                        onChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                    />
                </div>
              </div>
              
              <div>
                  <label htmlFor="birthday" className="block text-sm font-medium text-text-secondary mb-1">Date de naissance</label>
                  <DatePicker 
                      id="birthday" 
                      name="birthday" 
                      value={formData.birthday} 
                      onChange={(date) => setFormData(prev => ({ ...prev, birthday: date }))} 
                  />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <label htmlFor="headSize" className="block text-sm font-medium text-text-secondary mb-1">Périmètre crânien (cm)</label>
                  <input type="number" step="0.1" name="headSize" id="headSize" value={formData.headSize} onChange={handleChange} className={inputBaseClass} />
                </div>
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-text-secondary mb-1">Poids (kg)</label>
                  <input type="number" step="0.1" name="weight" id="weight" value={formData.weight} onChange={handleChange} className={inputBaseClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-text-secondary mb-1">Taille (cm)</label>
                  <input type="number" step="0.1" name="height" id="height" value={formData.height} onChange={handleChange} className={inputBaseClass} />
                </div>
              </div>
              <div>
                <label htmlFor="disease" className="block text-sm font-medium text-text-secondary mb-1">Maladies (si aucune, laisser vide)</label>
                <input type="text" name="disease" id="disease" value={formData.disease} onChange={handleChange} placeholder="aucune" className={inputBaseClass} />
              </div>
               <div>
                <label htmlFor="allergy" className="block text-sm font-medium text-text-secondary mb-1">Allergies (si aucune, laisser vide)</label>
                <input type="text" name="allergy" id="allergy" value={formData.allergy} onChange={handleChange} placeholder="aucune" className={inputBaseClass} />
              </div>
              {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
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

export default EditBabyModal;
