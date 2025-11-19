import React, { useState, useEffect, FormEvent } from 'react';
import { Doctor } from '../types';
import { XIcon } from './icons';
import Avatar from './Avatar';
import Dropdown from './Dropdown';
import CreatableSelect from './CreatableSelect';
import { tunisianCities } from '../lib/tunisianCities';

interface DoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doctor: Partial<Doctor>) => Promise<void>;
  doctor: Doctor | null;
  isLoading?: boolean;
  specialties: string[];
}

const cityOptions = [
  { value: '', label: 'Sélectionner une ville' },
  ...tunisianCities.map(city => ({ value: city, label: city }))
];

const formatPhoneNumber = (phone: string | undefined): string => {
    if (!phone) return '+216 ';
    const rawValue = phone.replace('+216', '').replace(/\s/g, '');
    const numericValue = rawValue.replace(/\D/g, '').substring(0, 8);
    
    let formattedNumber = '';
    if (numericValue.length > 0) {
        formattedNumber += numericValue.substring(0, 2);
    }
    if (numericValue.length > 2) {
        formattedNumber += ' ' + numericValue.substring(2, 5);
    }
    if (numericValue.length > 5) {
        formattedNumber += ' ' + numericValue.substring(5, 8);
    }
    return `+216 ${formattedNumber}`.trim();
};


const EditDoctorModal: React.FC<DoctorModalProps> = ({ isOpen, onClose, onSave, doctor, isLoading, specialties }) => {
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    rating: '3.0',
    city: '',
    imageUrl: '',
    description: '',
    workTime: 'Lun-Ven 09:00 - 17:00',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  
  const isEditMode = !!doctor;

  useEffect(() => {
    if (isOpen) {
        setError('');
        if (isEditMode && doctor) {
          setFormData({
            name: doctor.name || '',
            specialty: doctor.specialty || '',
            rating: doctor.rating?.toString() || '3.0',
            city: doctor.city || '',
            imageUrl: doctor.imageUrl || '',
            description: doctor.description || '',
            workTime: doctor.workTime || '',
            phone: formatPhoneNumber(doctor.phone),
            address: doctor.address || '',
          });
        } else {
          setFormData({
            name: 'Dr. ',
            specialty: '',
            rating: '3.0',
            city: '',
            imageUrl: '',
            description: `Dr. [Nom du médecin] est un(e) [spécialité] reconnu(e), dédié(e) à offrir des soins médicaux de haute qualité. 
Avec une expertise approfondie dans [domaines/expertises], il/elle accompagne ses patients dans le diagnostic, 
le traitement et la prévention des maladies, en mettant l’accent sur une approche personnalisée et humaine.`,
            workTime: 'Lun-Ven 09:00 - 17:00',
            phone: '+216 ',
            address: '',
          });
        }
    }
  }, [isOpen, doctor, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({...prev, phone: formatted}));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.city) {
      setError('Veuillez sélectionner une ville.');
      return;
    }
    if (!formData.specialty) {
      setError('Veuillez sélectionner ou créer une spécialité.');
      return;
    }

    const ratingValue = parseFloat(formData.rating);
    if (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 5) {
        setError('La note doit être un nombre entre 0 et 5.');
        return;
    }
    
    const finalPhone = formData.phone.replace(/\s/g, '');
    if (finalPhone.length > 4 && finalPhone.length !== 12) { // +216 is 4 chars, +216XXXXXXXX is 12
        setError('Le numéro de téléphone doit contenir 8 chiffres après +216.');
        return;
    }

    const dataToSave: Partial<Doctor> = {
      ...formData,
      rating: ratingValue,
      phone: finalPhone === '+216' ? '' : finalPhone,
    };
     if (!dataToSave.imageUrl) delete dataToSave.imageUrl;

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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 overflow-y-auto p-4 sm:p-10" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl transform transition-all mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
             <div className="flex justify-between items-start">
              <h3 className="text-xl font-semibold text-text-primary">
                {isEditMode ? "Modifier le docteur" : "Ajouter un docteur"}
              </h3>
              <button type="button" onClick={onClose} className="p-1 rounded-full text-text-secondary hover:bg-gray-100">
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            
             {isEditMode && doctor && (
              <div className="flex items-center gap-4 py-5 border-b border-border-color mb-6">
                <Avatar name={doctor.name} src={doctor.imageUrl} size="lg" />
                <div className="flex-grow">
                    <p className="font-semibold text-text-primary">{doctor.name}</p>
                    <p className="text-sm text-text-secondary">{doctor.specialty}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Nom complet</label>
                  <input required type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={inputBaseClass} />
                </div>
                <div>
                  <label htmlFor="specialty" className="block text-sm font-medium text-text-secondary mb-1">Spécialité</label>
                  <CreatableSelect
                    options={specialties}
                    value={formData.specialty}
                    onChange={(value) => setFormData(prev => ({...prev, specialty: value}))}
                    placeholder="Choisir ou créer une spécialité"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-text-secondary mb-1">Ville</label>
                  <Dropdown
                    options={cityOptions}
                    value={formData.city}
                    onChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                  />
                </div>
                 <div>
                  <label htmlFor="rating" className="block text-sm font-medium text-text-secondary mb-1">Note (0-5)</label>
                  <input required type="number" step="0.1" min="0" max="5" name="rating" id="rating" value={formData.rating} onChange={handleChange} className={inputBaseClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-1">Téléphone</label>
                  <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handlePhoneChange} className={inputBaseClass} />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-text-secondary mb-1">Adresse</label>
                  <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className={inputBaseClass} />
                </div>
              </div>
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-text-secondary mb-1">URL de l'image</label>
                 <div className="flex items-center w-full bg-background rounded-lg focus-within:ring-2 focus-within:ring-premier focus-within:bg-white transition-colors overflow-hidden">
                    <span className="pl-4 pr-2 text-text-secondary border-r border-gray-200">https://</span>
                    <input type="text" name="imageUrl" id="imageUrl" value={formData.imageUrl.replace(/^https?:\/\//, '')} onChange={(e) => setFormData(prev => ({...prev, imageUrl: e.target.value}))} placeholder="example.com/image.png" className="w-full bg-transparent py-2.5 px-3 text-text-primary placeholder:text-gray-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label htmlFor="workTime" className="block text-sm font-medium text-text-secondary mb-1">Horaires de travail</label>
                <input type="text" name="workTime" id="workTime" value={formData.workTime} onChange={handleChange} placeholder="ex: Lun-Ven 9:00-17:00" className={inputBaseClass} />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={4} className={inputBaseClass}></textarea>
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

export default EditDoctorModal;