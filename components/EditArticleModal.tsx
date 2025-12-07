
import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { Article, Category } from '../types';
import { XIcon, PlusIcon, TrashIcon, ClockIcon, CalendarIcon, UploadIcon, LoadingSpinnerIcon } from './icons';
import Dropdown from './Dropdown';
import CreatableSelect from './CreatableSelect';
import DatePicker from './DatePicker';
import { uploadImage } from '../services/adminService';

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (article: Partial<Article>) => Promise<void>;
  article: Article | null;
  categories: Category[];
  isLoading?: boolean;
  existingSources?: string[];
  token: string;
}

const EditArticleModal: React.FC<ArticleModalProps> = ({ isOpen, onClose, onSave, article, categories, isLoading, existingSources = [], token }) => {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // Split schedule into date and time
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Fixed size arrays: exactly 2 elements for description and images
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
      if (article) {
        setTitle(article.title);
        setCategoryId(typeof article.category === 'string' ? article.category : article.category._id);
        
        // Treat undefined as true (Active) to prevent accidental deactivation of legacy articles
        setIsActive(article.isActive !== false);
        
        // Format scheduledAt for separate inputs
        if (article.scheduledAt) {
            try {
                const date = new Date(article.scheduledAt);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                
                setScheduledDate(`${year}-${month}-${day}`);
                setScheduledTime(`${hours}:${minutes}`);
            } catch (e) {
                setScheduledDate('');
                setScheduledTime('');
            }
        } else {
            setScheduledDate('');
            setScheduledTime('');
        }
        
        const desc = article.description || [];
        setDescriptions([desc[0] || '', desc[1] || '']);
        
        const imgs = article.imageUrl || [];
        setImageUrls([imgs[0] || '', imgs[1] || '']);

        setSources(article.sources && article.sources.length > 0 ? article.sources.map(s => s.toUpperCase()) : ['']);

      } else {
        // Defaults for new article
        setTitle('');
        setCategoryId('');
        setIsActive(true); // Default to active for new articles
        setScheduledDate('');
        setScheduledTime('');
        setDescriptions(['', '']);
        setImageUrls(['', '']);
        setSources(['']);
      }
    }
  }, [isOpen, article]);

  // Auto-update isActive when scheduling changes
  useEffect(() => {
    if (scheduledDate) {
        const time = scheduledTime || '00:00';
        const scheduleDate = new Date(`${scheduledDate}T${time}`);
        const now = new Date();
        if (!isNaN(scheduleDate.getTime()) && scheduleDate > now) {
            setIsActive(false);
        } else if (!isNaN(scheduleDate.getTime()) && scheduleDate <= now) {
            setIsActive(true);
        }
    }
  }, [scheduledDate, scheduledTime]);

  const handleFixedArrayChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
    setter(prev => {
        const newArr = [...prev];
        newArr[index] = value;
        return newArr;
    });
  };

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

  const isFutureSchedule = () => {
    if (!scheduledDate) return false;
    const time = scheduledTime || '00:00';
    const d = new Date(`${scheduledDate}T${time}`);
    return !isNaN(d.getTime()) && d > new Date();
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

    let finalScheduledAt = null;
    if (scheduledDate) {
        const time = scheduledTime || '00:00';
        // Ensure we create a valid date string
        const dateStr = `${scheduledDate}T${time}`;
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
             finalScheduledAt = dateObj.toISOString();
        }
    }

    const dataToSave: Partial<Article> = {
      title,
      category: categoryId,
      description: cleanDescriptions,
      imageUrl: cleanImages,
      sources: cleanSources,
      isActive, 
      scheduledAt: finalScheduledAt, 
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
  
  const inputBaseClass = "w-full bg-background rounded-lg py-2.5 px-4 text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-premier focus:bg-white transition-colors";
  const categoryOptions = [{ value: '', label: 'Sélectionner une catégorie' }, ...categories.map(c => ({ value: c._id, label: c.name }))];

  const futureSchedule = isFutureSchedule();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 overflow-y-auto p-4 sm:p-6" aria-modal="true" role="dialog">
      <div className="flex min-h-full items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl transform transition-all">
            <form onSubmit={handleSubmit}>
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-semibold text-text-primary">
                        {article ? "Modifier l'article" : "Ajouter un article"}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-3">Statut</label>
                            <label className="flex items-center cursor-pointer w-fit select-none">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only" 
                                        checked={isActive} 
                                        onChange={(e) => {
                                            // Only allow manual toggle if no future schedule is set
                                            if (futureSchedule) {
                                                return; // Locked
                                            }
                                            setIsActive(e.target.checked);
                                        }} 
                                        disabled={futureSchedule}
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-premier' : 'bg-gray-300'} ${futureSchedule ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isActive ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <div className="ml-3 text-sm font-medium text-text-secondary">
                                    {isActive ? 'Actif (Visible)' : 'Inactif (Masqué)'}
                                </div>
                            </label>
                        </div>

                        {/* Scheduling */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-3">Planification (Optionnel)</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-text-secondary mb-1">Date</label>
                                    <div className="relative">
                                        <DatePicker 
                                            value={scheduledDate} 
                                            onChange={setScheduledDate} 
                                        />
                                        <div className="absolute right-3 top-2.5 pointer-events-none text-gray-400">
                                            <CalendarIcon className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-text-secondary mb-1">Heure</label>
                                    <div className="relative">
                                        <input 
                                            type="time" 
                                            value={scheduledTime} 
                                            onChange={(e) => setScheduledTime(e.target.value)} 
                                            className={inputBaseClass} 
                                        />
                                        <div className="absolute right-3 top-2.5 pointer-events-none text-gray-400">
                                            <ClockIcon className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                             <p className="text-xs text-text-secondary mt-2">
                                Si une date future est sélectionnée, le statut passera automatiquement à "Inactif".
                            </p>
                        </div>
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
                                    placeholder="Introduction..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-text-secondary mb-1">Paragraphe 2</label>
                                <textarea 
                                    rows={3}
                                    value={descriptions[1]} 
                                    onChange={(e) => handleFixedArrayChange(setDescriptions, 1, e.target.value)} 
                                    className={inputBaseClass}
                                    placeholder="Contenu suite..."
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

export default EditArticleModal;
