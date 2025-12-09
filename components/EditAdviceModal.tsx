
import React, { useState, useEffect, FormEvent, useMemo, useRef } from 'react';
import { Advice, Category } from '../types';
import { XIcon, PlusIcon, TrashIcon, UploadIcon, LoadingSpinnerIcon } from './icons';
import Dropdown from './Dropdown';
import CreatableSelect from './CreatableSelect';
import { uploadImage } from '../services/adminService';

interface AdviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (advice: Partial<Advice>) => Promise<void>;
  advice: Advice | null;
  categories: Category[];
  usedDays?: number[];
  isLoading?: boolean;
  existingSources?: string[];
  token: string;
}

const EditAdviceModal: React.FC<AdviceModalProps> = ({ isOpen, onClose, onSave, advice, categories, usedDays = [], isLoading, existingSources = [], token }) => {
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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setIsUploading(false);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
          setError("L'image est trop volumineuse (max 5MB).");
          return;
      }
      
      setIsUploading(true);
      setError('');

      try {
          // Upload to backend
          const uploadedUrl = await uploadImage(token, file);
          handleFixedArrayChange(setImageUrls, index, uploadedUrl);
      } catch (err) {
          setError(err instanceof Error ? err.message : "Échec du téléchargement de l'image.");
          // Reset file input so user can try again
          if (fileInputRefs.current[index]) fileInputRefs.current[index]!.value = '';
      } finally {
          setIsUploading(false);
      }
    }
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

    if (isUploading) return;

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
                    <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-border-color transition-all duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div>
                                <h4 className="text-sm font-bold text-text-primary">Ciblage temporel (6-9 mois)</h4>
                                <p className="text-xs text-text-secondary mt-0.5">Assigner ce conseil à un jour précis du programme.</p>
                            </div>
                            <label className="inline-flex items-center cursor-pointer select-none self-start sm:self-auto">
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
                                <span className="ml-3 text-sm font-medium text-text-secondary">
                                    {hasDayTargeting ? 'Activé' : 'Désactivé'}
                                </span>
                            </label>
                        </div>
                        
                        {hasDayTargeting ? (
                            <div className="mt-4 animate-fade-in-up">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-3 gap-2">
                                    <div className="flex gap-4 text-xs font-medium text-text-secondary">
                                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-white border border-gray-300 shadow-sm"></span><span>Libre</span></div>
                                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-100 border border-gray-200"></span><span>Pris</span></div>
                                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-premier border border-premier"></span><span>Sélectionné</span></div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 p-3 bg-white border border-border-color rounded-xl max-h-64 overflow-y-auto custom-scrollbar shadow-inner">
                                    {daysRange.map((d) => {
                                        const isUsed = usedDays.includes(d);
                                        const isCurrent = d === advice?.day; 
                                        const isSelected = day === d;
                                        const isDisabled = isUsed && !isCurrent;

                                        return (
                                            <button
                                                key={d}
                                                type="button"
                                                disabled={isDisabled}
                                                onClick={() => setDay(d)}
                                                className={`
                                                    relative h-10 rounded-lg flex items-center justify-center text-xs font-semibold transition-all duration-200
                                                    ${isSelected 
                                                        ? 'bg-premier text-white shadow-md scale-105 ring-2 ring-premier ring-offset-1 z-10' 
                                                        : isDisabled 
                                                            ? 'bg-gray-50 text-gray-300 cursor-not-allowed' 
                                                            : 'bg-white text-text-secondary hover:text-premier hover:bg-premier/5 border border-gray-100 hover:border-premier/30'}
                                                `}
                                                title={isDisabled ? `Jour ${d} déjà utilisé` : `Sélectionner jour ${d}`}
                                            >
                                                {d}
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                {day && (
                                     <div className="mt-4 p-3 bg-premier/5 border border-premier/10 rounded-lg flex justify-between items-center animate-fade-in-up">
                                        <span className="text-sm text-text-secondary">Jour sélectionné :</span>
                                        <span className="text-sm font-bold text-premier bg-white px-3 py-1 rounded shadow-sm">
                                            Jour {day}
                                        </span>
                                     </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-gray-100 rounded-lg text-sm text-text-secondary text-center border-2 border-dashed border-gray-200">
                                Ce conseil sera visible dans la catégorie "Autres".
                            </div>
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
                            {[0, 1].map((index) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-border-color">
                                    <label className="block text-xs font-bold text-text-secondary mb-2">Image {index === 0 ? 'principale' : 'secondaire'}</label>
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                                        {/* Preview Area */}
                                        {imageUrls[index] && (
                                            <div className="relative w-32 h-32 flex-shrink-0 mx-auto sm:mx-0 group">
                                                <img 
                                                    src={imageUrls[index].startsWith('http') ? imageUrls[index] : `https://${imageUrls[index]}`} 
                                                    alt={`Aperçu ${index + 1}`} 
                                                    className="w-full h-full object-cover rounded-xl border border-border-color shadow-sm bg-white"
                                                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=Erreur'; }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        handleFixedArrayChange(setImageUrls, index, '');
                                                        if (fileInputRefs.current[index]) fileInputRefs.current[index]!.value = '';
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition-colors border border-white shadow-sm"
                                                    title="Supprimer l'image"
                                                >
                                                    <XIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Controls */}
                                        <div className="flex-1 w-full space-y-3">
                                            {/* URL Input */}
                                            <div className="w-full">
                                                <input 
                                                    type="text" 
                                                    value={imageUrls[index]} 
                                                    onChange={(e) => handleFixedArrayChange(setImageUrls, index, e.target.value)} 
                                                    placeholder="https://exemple.com/photo.jpg" 
                                                    className={inputBaseClass} 
                                                    disabled={isUploading}
                                                />
                                            </div>

                                            {/* OR separator */}
                                            <div className="flex items-center gap-2">
                                                <div className="h-px bg-border-color flex-1"></div>
                                                <span className="text-xs text-text-secondary uppercase font-medium">OU</span>
                                                <div className="h-px bg-border-color flex-1"></div>
                                            </div>

                                            {/* Upload Button */}
                                            <div>
                                                <input 
                                                    type="file" 
                                                    ref={el => { fileInputRefs.current[index] = el }} 
                                                    className="hidden" 
                                                    accept="image/*" 
                                                    onChange={(e) => handleFileChange(e, index)}
                                                    disabled={isUploading}
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => fileInputRefs.current[index]?.click()}
                                                    disabled={isUploading}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-text-secondary hover:text-premier hover:border-premier hover:bg-premier/5 transition-all bg-gray-50/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isUploading ? (
                                                        <>
                                                            <LoadingSpinnerIcon className="h-5 w-5 text-premier" />
                                                            <span>Téléchargement...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UploadIcon className="h-5 w-5" />
                                                            <span>Choisir une image depuis l'appareil</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                    disabled={isLoading || isUploading}
                    className="inline-flex justify-center rounded-lg shadow-sm px-5 py-2.5 bg-premier text-base font-semibold text-white hover:bg-premier-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-premier sm:text-sm disabled:opacity-50"
                >
                    {isLoading || isUploading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading || isUploading}
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
