
import React, { useState, useEffect, FormEvent } from 'react';
import { Category, AgeRange } from '../types';
import { XIcon } from './icons';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Partial<Category>) => Promise<void>;
  category: Category | null;
  isLoading?: boolean;
}

const PREDEFINED_RANGES = [
    { min: 0, max: 179, label: '0 - 6 mois (0 - 179 jours)' },
    { min: 180, max: 270, label: '6 - 9 mois (180 - 270 jours)' },
    { min: 271, max: 720, label: '9 - 24 mois (271 - 720 jours)' },
];

const EditCategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, onSave, category, isLoading }) => {
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [contentTypes, setContentTypes] = useState<('article' | 'advice' | 'recipe')[]>([]);
  const [ageRanges, setAgeRanges] = useState<AgeRange[]>([]);
  
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (category) {
        setName(category.name);
        setIsActive(category.isActive);
        setContentTypes(category.contentTypes);
        setAgeRanges(category.ageRanges || []);
      } else {
        setName('');
        setIsActive(true);
        setContentTypes(['article', 'advice', 'recipe']);
        setAgeRanges([]); // Start empty
      }
    }
  }, [isOpen, category]);

  const handleContentTypeChange = (type: 'article' | 'advice' | 'recipe') => {
    setContentTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  const toggleAgeRange = (min: number, max: number) => {
    setAgeRanges(prev => {
        const exists = prev.some(r => r.minDay === min && r.maxDay === max);
        if (exists) {
            return prev.filter(r => !(r.minDay === min && r.maxDay === max));
        } else {
            return [...prev, { minDay: min, maxDay: max }];
        }
    });
  };

  const handleInvalid = (e: React.FormEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).setCustomValidity("Veuillez remplir ce champ.");
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).setCustomValidity('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (contentTypes.length === 0) {
      setError("Veuillez sélectionner au moins un type de contenu.");
      return;
    }

    if (ageRanges.length === 0) {
        setError("Veuillez sélectionner au moins une tranche d'âge.");
        return;
    }

    const dataToSave: Partial<Category> = {
      name,
      isActive,
      contentTypes,
      ageRanges
    };

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 overflow-y-auto p-4" aria-modal="true" role="dialog">
      <div className="flex min-h-full items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg transform transition-all">
            <form onSubmit={handleSubmit}>
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-semibold text-text-primary">
                        {category ? "Modifier la catégorie" : "Ajouter une catégorie"}
                    </h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full text-text-secondary hover:bg-gray-100">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Nom de la catégorie</label>
                        <input 
                            required 
                            type="text" 
                            id="name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            onInvalid={handleInvalid}
                            onInput={handleInput} 
                            className="w-full bg-background rounded-lg py-2.5 px-4 text-text-primary border border-transparent focus:border-premier focus:outline-none focus:ring-2 focus:ring-premier focus:bg-white transition-colors" 
                        />
                    </div>

                    {/* Content Types */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Types de contenu autorisés</label>
                        <div className="flex gap-4">
                            {['article', 'advice', 'recipe'].map((type) => (
                                <label key={type} className="inline-flex items-center cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox h-4 w-4 text-premier border-gray-300 rounded focus:ring-premier"
                                        checked={contentTypes.includes(type as any)}
                                        onChange={() => handleContentTypeChange(type as any)}
                                    />
                                    <span className="ml-2 text-sm text-text-primary capitalize">
                                        {type === 'advice' ? 'Conseil' : type === 'recipe' ? 'Recette' : 'Article'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Age Ranges */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-3">Tranches d'âge</label>
                        <div className="grid gap-3">
                            {PREDEFINED_RANGES.map((range) => {
                                const isChecked = ageRanges.some(r => r.minDay === range.min && r.maxDay === range.max);
                                return (
                                    <label key={range.min} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${isChecked ? 'border-premier bg-premier/5' : 'border-border-color hover:bg-gray-50'}`}>
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-5 w-5 text-premier border-gray-300 rounded focus:ring-premier"
                                            checked={isChecked}
                                            onChange={() => toggleAgeRange(range.min, range.max)}
                                        />
                                        <span className="ml-3 text-sm font-medium text-text-primary">
                                            {range.label}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                     {/* Status */}
                     <div>
                        <label className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={isActive} 
                                    onChange={(e) => setIsActive(e.target.checked)} 
                                />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-premier' : 'bg-gray-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isActive ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                            <div className="ml-3 text-sm font-medium text-text-secondary">
                                {isActive ? 'Actif' : 'Inactif'}
                            </div>
                        </label>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}
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
    </div>
  );
};

export default EditCategoryModal;
