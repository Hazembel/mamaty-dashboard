
import React, { useState, useEffect, FormEvent, useMemo } from 'react';
import { Advice, Category } from '../types';
import { XIcon, PlusIcon, TrashIcon } from './icons';
import Dropdown from './Dropdown';
import CreatableSelect from './CreatableSelect';

interface AdviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (advice: Partial<Advice>) => Promise<void>;
  advice: Advice | null;
  categories: Category[];
  usedDays?: number[];
  isLoading?: boolean;
  existingSources?: string[];
}

const EditAdviceModal: React.FC<AdviceModalProps> = ({ isOpen, onClose, onSave, advice, categories, usedDays = [], isLoading, existingSources = [] }) => {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [day, setDay] = useState<number | null>(null);
  const [hasDayTargeting, setHasDayTargeting] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  // Fixed size arrays: exactly 2 elements
  const [descriptions, setDescriptions] = useState<string[]>(['', '']);
  const [imageUrls, setImageUrls] = useState<string[]>(['', '']);
  const [sources, setSources] = useState<string[]>(['']);
  
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (advice) {
        setTitle(advice.title);
        setCategoryId(typeof advice.category === 'string' ? advice.category : advice.category._id);
        setIsActive(advice.isActive !== false);
        
        // Timing logic
        if (advice.day !== null && advice.day !== undefined) {
            setHasDayTargeting(true);
            setDay(advice.day);
        } else {
            setHasDayTargeting(false);
            setDay(null);
        }

        // Arrays: Ensure size 2 for UI
        const desc = advice.description || [];
        setDescriptions([desc[0] || '', desc[1] || '']);
        
        const imgs = advice.imageUrl || [];
        setImageUrls([imgs[0] || '', imgs[1] || '']);

        setSources(advice.sources && advice.sources.length > 0 ? advice.sources.map(s => s.toUpperCase()) : ['']);

      } else {
        // Defaults for new advice
        setTitle('');
        setCategoryId('');
        setIsActive(true);
        setDay(null);
        setHasDayTargeting(false);
        setDescriptions(['', '']);
        setImageUrls(['', '']);
        setSources(['']);
      }
    }
  }, [isOpen, advice]);

  const handleFixedArrayChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
    setter(prev => {
        const newArr = [...prev];
        newArr[index] = value;
        return newArr;
    });
  };

  // Helper for sources (dynamic)
  const handleSourceChange = (index: number, value: string) => {
    setSources(prev => {
        const newArr = [...prev];
        newArr[index] = value.toUpperCase();
        return newArr;
    });
  };
  const addSource = () => setSources(prev => [...prev, '']);
  const removeSource = (index: number) => setSources(prev => prev.filter((_, i) => i !== index));

  const handleInvalid = (e: React.FormEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).setCustomValidity("Veuillez remplir ce champ.");
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).setCustomValidity('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!categoryId) {
        setError("Veuillez sélectionner une catégorie.");
        return;
    }
    
    const cleanDescriptions = descriptions.filter(d => d.trim() !== '');
    const cleanImages = imageUrls.filter(i => i.trim() !== '');
    const cleanSources = sources.filter(s => s.trim() !== '');

    if (cleanDescriptions.length === 0) {
        setError("Veuillez ajouter au moins un paragraphe de description.");
        return;
    }
    if (cleanImages.length === 0) {
        setError("Veuillez ajouter au moins une image.");
        return;
    }

    // Timing validation
    let finalDay = null;

    if (hasDayTargeting) {
        if (day === null) {
            setError("Veuillez sélectionner un jour spécifique dans la grille.");
            return;
        }
        if (day < 180 || day > 270) {
            setError("Le jour doit être compris entre 180 et 270 (6 - 9 mois).");
            return;
        }
        // Final Check for duplicate (redundant if UI works, but good for safety)
        // Allow if it's the same day as the current advice being edited
        if (usedDays.includes(day) && day !== advice?.day) {
            setError(`Le jour ${day} est déjà utilisé. Veuillez en choisir un autre.`);
            return;
        }
        finalDay = day;
    }

    const dataToSave: Partial<Advice> = {
      title,
      category: categoryId,
      description: cleanDescriptions,
      imageUrl: cleanImages,
      sources: cleanSources,
      day: finalDay,
      isActive,
      minDay: null, // Always clear ranges as we removed range support
      maxDay: null
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

  // Generate days 180 to 270
  const daysRange = useMemo(() => {
      return Array.from({ length: 270 - 180 + 1 }, (_, i) => 180 + i);
  }, []);

  if (!isOpen) return null;
  
  const inputBaseClass = "w-full bg-background rounded-lg py-2.5 px-4 text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-premier focus:bg-white transition-colors";
  const categoryOptions = [{ value: '', label: 'Sélectionner une catégorie' }, ...categories.map(c => ({ value: c._id, label: c.name }))];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 overflow-y-auto p-4 sm:p-6" aria-modal="true" role="dialog">
      <div className="flex min-h-full items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl transform transition-all">
            <form onSubmit={handleSubmit}>
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-semibold text-text-primary">
                        {advice ? "Modifier le conseil" : "Ajouter un conseil"}
                    </h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full text-text-secondary hover:bg-gray-100">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">Titre</label>
                            <input 
                                required 
                                type="text" 
                                id="title" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)}
                                onInvalid={handleInvalid}
                                onInput={handleInput}
                                className={inputBaseClass} 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Catégorie</label>
                            <Dropdown 
                                options={categoryOptions} 
                                value={categoryId} 
                                onChange={setCategoryId} 
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-3">Statut</label>
                        <label className="flex items-center cursor-pointer w-fit select-none">
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
                                {isActive ? 'Actif (Visible)' : 'Inactif (Masqué)'}
                            </div>
                        </label>
                    </div>

                    {/* Timing with Grid */}
                    <div className="bg-gray-50 p-5 rounded-xl border border-border-color">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-text-primary">Ciblage temporel (6-9 mois)</h4>
                            <label className="inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={hasDayTargeting}
                                    onChange={(e) => {
                                        setHasDayTargeting(e.target.checked);
                                        if (!e.target.checked) setDay(null);
                                    }}
                                />
                                <div className={`relative w-11 h-6 transition-colors rounded-full ${hasDayTargeting ? 'bg-premier' : 'bg-gray-300'}`}>
                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${hasDayTargeting ? 'translate-x-5' : ''}`}></div>
                                </div>
                                <span className="ml-3 text-sm font-medium text-text-secondary">Activer</span>
                            </label>
                        </div>
                        
                        {hasDayTargeting ? (
                            <div className="mt-4 animate-fade-in-up">
                                <div className="flex justify-between items-end mb-2">
                                    <label className="block text-xs font-medium text-text-secondary">
                                        Sélectionnez un jour disponible (180 - 270)
                                    </label>
                                    <div className="flex gap-3 text-xs">
                                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white border border-gray-300"></span><span>Libre</span></div>
                                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 border border-gray-300 opacity-50"></span><span>Pris</span></div>
                                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-premier"></span><span>Sélectionné</span></div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-10 sm:grid-cols-12 gap-1.5 p-2 bg-white border border-border-color rounded-lg max-h-48 overflow-y-auto">
                                    {daysRange.map((d) => {
                                        const isUsed = usedDays.includes(d);
                                        const isCurrent = d === advice?.day; // Allow selecting the day currently owned by this advice
                                        const isSelected = day === d;
                                        
                                        // Disabled if used by SOMEONE ELSE (isUsed) AND NOT CURRENT (isCurrent)
                                        const isDisabled = isUsed && !isCurrent;

                                        return (
                                            <button
                                                key={d}
                                                type="button"
                                                disabled={isDisabled}
                                                onClick={() => setDay(d)}
                                                className={`
                                                    h-8 w-full rounded flex items-center justify-center text-xs font-medium transition-all
                                                    ${isSelected 
                                                        ? 'bg-premier text-white shadow-md transform scale-110 z-10' 
                                                        : isDisabled 
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through' 
                                                            : 'bg-white text-text-primary hover:bg-purple-50 hover:text-premier border border-gray-100'}
                                                `}
                                                title={isDisabled ? `Jour ${d} déjà utilisé` : `Sélectionner jour ${d}`}
                                            >
                                                {d}
                                            </button>
                                        );
                                    })}
                                </div>
                                {day && (
                                     <p className="text-sm text-premier font-medium mt-2 text-right">Jour sélectionné : <span className="font-bold">{day}</span></p>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-text-secondary italic mt-1">Aucun ciblage temporel spécifique (S'affichera dans "Reset" / "Autres").</p>
                        )}
                    </div>

                    {/* Descriptions (Fixed 2) */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Description (2 paragraphes)</label>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-text-secondary mb-1">Paragraphe 1</label>
                                <textarea 
                                    rows={3}
                                    value={descriptions[0]} 
                                    onChange={(e) => handleFixedArrayChange(setDescriptions, 0, e.target.value)} 
                                    className={inputBaseClass}
                                    placeholder="Introduction ou première partie du conseil..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-text-secondary mb-1">Paragraphe 2</label>
                                <textarea 
                                    rows={3}
                                    value={descriptions[1]} 
                                    onChange={(e) => handleFixedArrayChange(setDescriptions, 1, e.target.value)} 
                                    className={inputBaseClass}
                                    placeholder="Suite ou conclusion du conseil..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Images (Fixed 2) */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-3">Images (2 obligatoires)</label>
                        <div className="space-y-6">
                            {/* Image 1 */}
                            <div className="bg-gray-50 p-3 rounded-lg border border-border-color">
                                <label className="block text-xs font-bold text-text-secondary mb-1.5">Image principale (URL)</label>
                                <input 
                                    type="text" 
                                    value={imageUrls[0]} 
                                    onChange={(e) => handleFixedArrayChange(setImageUrls, 0, e.target.value)} 
                                    className={inputBaseClass}
                                    placeholder="https://example.com/image1.jpg"
                                />
                                {imageUrls[0] && (
                                    <div className="mt-3">
                                        <img 
                                            src={imageUrls[0]} 
                                            alt="Aperçu 1" 
                                            className="w-full h-48 object-contain rounded-lg border border-border-color shadow-sm bg-white"
                                            onError={(e) => (e.currentTarget.style.display = 'none')} 
                                        />
                                        <p className="text-xs text-center text-text-secondary mt-1">Aperçu réel</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Image 2 */}
                            <div className="bg-gray-50 p-3 rounded-lg border border-border-color">
                                <label className="block text-xs font-bold text-text-secondary mb-1.5">Image secondaire (URL)</label>
                                <input 
                                    type="text" 
                                    value={imageUrls[1]} 
                                    onChange={(e) => handleFixedArrayChange(setImageUrls, 1, e.target.value)} 
                                    className={inputBaseClass}
                                    placeholder="https://example.com/image2.jpg"
                                />
                                {imageUrls[1] && (
                                    <div className="mt-3">
                                        <img 
                                            src={imageUrls[1]} 
                                            alt="Aperçu 2" 
                                            className="w-full h-48 object-contain rounded-lg border border-border-color shadow-sm bg-white"
                                            onError={(e) => (e.currentTarget.style.display = 'none')} 
                                        />
                                        <p className="text-xs text-center text-text-secondary mt-1">Aperçu réel</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                     {/* Sources (Dynamic) */}
                     <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-text-secondary">Sources</label>
                             <button type="button" onClick={addSource} className="text-premier hover:text-premier-dark text-sm font-medium flex items-center gap-1">
                                <PlusIcon className="h-4 w-4" /> Ajouter
                            </button>
                        </div>
                        <div className="space-y-3">
                            {sources.map((source, idx) => (
                                <div key={idx} className="flex gap-2 items-center relative z-10" style={{ zIndex: sources.length - idx }}>
                                    <div className="flex-grow">
                                        <CreatableSelect
                                            options={existingSources}
                                            value={source}
                                            onChange={(val) => handleSourceChange(idx, val.toUpperCase())}
                                            placeholder="ex: OMS, AFPA..."
                                        />
                                    </div>
                                    {sources.length > 1 && (
                                        <button type="button" onClick={() => removeSource(idx)} className="text-text-secondary hover:text-red-500 p-2">
                                            <XIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
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

export default EditAdviceModal;
