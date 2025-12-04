
import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { Recipe, Category, Ingredient } from '../types';
import { XIcon, PlusIcon, TrashIcon, ClockIcon, CalendarIcon, UploadIcon, LoadingSpinnerIcon } from './icons';
import Dropdown from './Dropdown';
import CreatableSelect from './CreatableSelect';
import { tunisianCities } from '../lib/tunisianCities';
import DatePicker from './DatePicker';
import { uploadImage } from '../services/adminService';

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: Partial<Recipe>) => Promise<void>;
  recipe: Recipe | null;
  categories: Category[];
  isLoading?: boolean;
  existingIngredients?: string[];
  existingSources?: string[];
  token: string;
}

const cityOptions = [
    { value: '', label: 'Non spécifiée' },
    ...tunisianCities.map(city => ({ value: city, label: city }))
];

const UNIT_OPTIONS = [
  'g', 'kg', 'ml', 'cl', 'l', 'c.à.s', 'c.à.c', 'pincée', 'pièce', 'tranche', 'tasse', 'verre', 'bol', 'botte', 'gousse', 'brin'
];

const EditRecipeModal: React.FC<RecipeModalProps> = ({ isOpen, onClose, onSave, recipe, categories, isLoading, existingIngredients = [], existingSources = [], token }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [rating, setRating] = useState('4.5');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [city, setCity] = useState('');
  const [minDay, setMinDay] = useState('270'); // 9 months
  const [maxDay, setMaxDay] = useState('720'); // 24 months
  const [isActive, setIsActive] = useState(true);

  // Scheduling
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Ingredients as structured objects
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', quantity: 0, unit: 'g' }]);
  
  // Simple string arrays
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [sources, setSources] = useState<string[]>(['']);

  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'details' | 'media'>('info');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setActiveTab('info');
      setIsUploading(false);
      if (recipe) {
        setTitle(recipe.title);
        setDescription(recipe.description || '');
        setCategoryId(typeof recipe.category === 'string' ? recipe.category : recipe.category._id);
        setRating(recipe.rating.toString());
        setImageUrl(recipe.imageUrl);
        setVideoUrl(recipe.videoUrl || '');
        setCity(recipe.city || '');
        setMinDay(recipe.minDay?.toString() || '270');
        setMaxDay(recipe.maxDay?.toString() || '720');
        setIsActive(recipe.isActive !== false);

        // Format scheduledAt
        if (recipe.scheduledAt) {
            try {
                const date = new Date(recipe.scheduledAt);
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
        
        setIngredients(recipe.ingredients && recipe.ingredients.length > 0 
            ? recipe.ingredients.map(i => ({
                name: i.name || '',
                quantity: i.quantity || 0,
                unit: i.unit || 'g'
              })) 
            : [{ name: '', quantity: 0, unit: 'g' }]
        );
        setInstructions(recipe.instructions && recipe.instructions.length > 0 ? recipe.instructions : ['']);
        setSources(recipe.sources && recipe.sources.length > 0 ? recipe.sources.map(s => s.toUpperCase()) : ['']);
      } else {
        // Defaults
        setTitle('');
        setDescription('');
        setCategoryId('');
        setRating('4.5');
        setImageUrl('');
        setVideoUrl('');
        setCity('');
        setMinDay('270');
        setMaxDay('720');
        setIsActive(true);
        setScheduledDate('');
        setScheduledTime('');
        setIngredients([{ name: '', quantity: 0, unit: 'g' }]);
        setInstructions(['']);
        setSources(['']);
      }
    }
  }, [isOpen, recipe]);

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

  const handleInstructionChange = (index: number, value: string) => {
    setInstructions(prev => {
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

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string | number) => {
    setIngredients(prev => {
        const newArr = [...prev];
        newArr[index] = { ...newArr[index], [field]: value };
        return newArr;
    });
  };

  const addInstruction = () => setInstructions(prev => [...prev, '']);
  const addSource = () => setSources(prev => [...prev, '']);
  const addIngredient = () => setIngredients(prev => [...prev, { name: '', quantity: 0, unit: 'g' }]);
  
  const removeInstruction = (index: number) => {
      setInstructions(prev => {
          if (prev.length === 1) return [''];
          return prev.filter((_, i) => i !== index);
      });
  };

  const removeSource = (index: number) => {
      setSources(prev => {
          if (prev.length === 1) return [''];
          return prev.filter((_, i) => i !== index);
      });
  };

  const removeIngredient = (index: number) => {
      setIngredients(prev => {
          if (prev.length === 1) return [{ name: '', quantity: 0, unit: 'g' }];
          return prev.filter((_, i) => i !== index);
      });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setImageUrl(uploadedUrl);
      } catch (err) {
          setError(err instanceof Error ? err.message : "Échec du téléchargement de l'image.");
          // Reset file input so user can try again
          if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleInvalid = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    (e.target as HTMLInputElement).setCustomValidity("Veuillez remplir ce champ.");
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    (e.target as HTMLInputElement).setCustomValidity('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (isUploading) return;

    // --- INFO TAB VALIDATION ---
    if (!title.trim()) {
        setActiveTab('info');
        setError("Le titre de la recette est obligatoire.");
        return;
    }
    if (!categoryId) {
        setActiveTab('info');
        setError("Veuillez sélectionner une catégorie.");
        return;
    }
    if (!description.trim()) {
        setActiveTab('info');
        setError("La description est obligatoire.");
        return;
    }

    // --- DETAILS TAB VALIDATION ---
    const cleanIngredients = ingredients.filter(i => i.name.trim() !== '');
    const cleanInstructions = instructions.filter(i => i.trim() !== '');
    
    if (cleanIngredients.length === 0) {
        setActiveTab('details');
        setError("Veuillez ajouter au moins un ingrédient avec un nom.");
        return;
    }
    if (cleanInstructions.length === 0) {
        setActiveTab('details');
        setError("Veuillez ajouter au moins une étape de préparation.");
        return;
    }

    // --- MEDIA TAB VALIDATION ---
    const cleanSources = sources.filter(s => s.trim() !== '');

    if (!imageUrl.trim()) {
        setActiveTab('media');
        setError("L'image de la recette est manquante. Veuillez ajouter une URL d'image valide.");
        return;
    }

    if (cleanSources.length === 0) {
        setActiveTab('media');
        setError("La source est manquante. Veuillez ajouter au moins une source ou un crédit.");
        return;
    }

    let finalScheduledAt = null;
    if (scheduledDate) {
        const time = scheduledTime || '00:00';
        const dateStr = `${scheduledDate}T${time}`;
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
             finalScheduledAt = dateObj.toISOString();
        }
    }

    const dataToSave: Partial<Recipe> = {
      title,
      description,
      category: categoryId,
      ingredients: cleanIngredients,
      instructions: cleanInstructions,
      imageUrl,
      videoUrl,
      city,
      sources: cleanSources,
      rating: parseFloat(rating),
      minDay: parseInt(minDay),
      maxDay: parseInt(maxDay),
      isActive,
      scheduledAt: finalScheduledAt
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

  const tabs = [
      { id: 'info', label: 'Informations', mobileLabel: 'Infos' },
      { id: 'details', label: 'Ingrédients & Préparation', mobileLabel: 'Recette' },
      { id: 'media', label: 'Média & Sources', mobileLabel: 'Média' },
  ];

  const futureSchedule = isFutureSchedule();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-2 sm:p-4" aria-modal="true" role="dialog">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[95vh] sm:max-h-[90vh] transform transition-all">
            <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            
            <div className="p-4 sm:p-6 border-b border-border-color flex justify-between items-center bg-white rounded-t-xl z-10">
                 <h3 className="text-lg sm:text-2xl font-bold text-text-primary truncate pr-2">
                    {recipe ? "Modifier la recette" : "Ajouter une recette"}
                </h3>
                <button type="button" onClick={onClose} className="p-2 rounded-full text-text-secondary hover:bg-gray-100 transition-colors flex-shrink-0">
                    <XIcon className="h-6 w-6" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border-color bg-gray-50/50 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center min-w-fit whitespace-nowrap py-3 px-3 sm:px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.id ? 'border-premier text-premier' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                    >
                        <span className="sm:hidden">{tab.mobileLabel}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="p-3 sm:p-8 overflow-y-auto flex-1 custom-scrollbar bg-white">
                {/* General Info Tab */}
                {activeTab === 'info' && (
                    <div className="space-y-6 sm:space-y-8 animate-fade-in-up">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-2">Titre de la recette</label>
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
                                <label className="block text-sm font-medium text-text-secondary mb-2">Catégorie</label>
                                <Dropdown options={categoryOptions} value={categoryId} onChange={setCategoryId} />
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-2">Description courte / Introduction</label>
                            <textarea 
                                required 
                                rows={4} 
                                id="description" 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)}
                                onInvalid={handleInvalid}
                                onInput={handleInput} 
                                className={inputBaseClass} 
                            />
                        </div>

                        {/* Scheduling & Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Statut</label>
                                <label className="flex items-center cursor-pointer w-fit select-none">
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only" 
                                            checked={isActive} 
                                            onChange={(e) => {
                                                if (futureSchedule) return;
                                                setIsActive(e.target.checked);
                                            }} 
                                            disabled={futureSchedule}
                                        />
                                        <div className={`block w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-premier' : 'bg-gray-300'} ${futureSchedule ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isActive ? 'transform translate-x-4' : ''}`}></div>
                                    </div>
                                    <div className="ml-3 text-sm font-medium text-text-secondary">
                                        {isActive ? 'Active (Visible)' : 'Inactive (Masquée)'}
                                    </div>
                                </label>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Planification (Optionnel)</label>
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
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                             <div>
                                <label htmlFor="rating" className="block text-sm font-medium text-text-secondary mb-2">Note (0 - 5)</label>
                                <input 
                                    required 
                                    type="number" 
                                    step="0.1" 
                                    min="0" 
                                    max="5" 
                                    id="rating" 
                                    value={rating} 
                                    onChange={(e) => setRating(e.target.value)} 
                                    onInvalid={handleInvalid}
                                    onInput={handleInput}
                                    className={inputBaseClass} 
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Ville / Région (Optionnel)</label>
                                <Dropdown options={cityOptions} value={city} onChange={setCity} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Tranche d'âge (Jours)</label>
                                <div className="flex items-center gap-2">
                                    <input type="number" placeholder="Min" value={minDay} onChange={(e) => setMinDay(e.target.value)} className={`${inputBaseClass} w-1/2`} />
                                    <span className="text-text-secondary">-</span>
                                    <input type="number" placeholder="Max" value={maxDay} onChange={(e) => setMaxDay(e.target.value)} className={`${inputBaseClass} w-1/2`} />
                                </div>
                                <p className="text-xs text-text-secondary mt-1.5">Ex: 270j = 9 mois, 720j = 24 mois</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Details Tab */}
                {activeTab === 'details' && (
                    <div className="space-y-8 sm:space-y-10 animate-fade-in-up">
                        {/* Ingredients */}
                        <div>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                                <label className="block text-lg font-semibold text-text-primary">Ingrédients</label>
                                <button type="button" onClick={addIngredient} className="text-white bg-premier hover:bg-premier-dark px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors w-full sm:w-auto justify-center">
                                    <PlusIcon className="h-4 w-4" /> Ajouter un ingrédient
                                </button>
                            </div>
                            <div className="space-y-3">
                                {ingredients.map((item, idx) => (
                                    <div key={idx} className="bg-white sm:bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-200 sm:border-transparent mb-3 shadow-sm sm:shadow-none">
                                        {/* Mobile Header */}
                                        <div className="flex justify-between items-center mb-2 sm:hidden pb-2 border-b border-gray-100">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ingrédient {idx + 1}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => removeIngredient(idx)} 
                                                className="text-red-500 p-1.5 rounded-md hover:bg-red-50"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 items-start sm:items-center">
                                            
                                            {/* Desktop Index */}
                                            <div className="hidden sm:flex sm:col-span-1 justify-center">
                                                <span className="text-sm font-bold text-gray-500 bg-white w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 shadow-sm">{idx + 1}</span>
                                            </div>

                                            {/* Name Section */}
                                            <div className="w-full sm:col-span-6 relative z-20" style={{ zIndex: ingredients.length - idx }}> 
                                                <CreatableSelect
                                                    options={existingIngredients}
                                                    value={item.name}
                                                    onChange={(val) => handleIngredientChange(idx, 'name', val)}
                                                    placeholder="Nom (ex: Farine)"
                                                    required
                                                />
                                            </div>

                                            {/* Quantity Section */}
                                            <div className="w-full sm:col-span-4 flex gap-3">
                                                 <div className="w-1/2">
                                                    <input 
                                                        type="number" 
                                                        step="0.1"
                                                        value={item.quantity} 
                                                        onChange={(e) => handleIngredientChange(idx, 'quantity', parseFloat(e.target.value) || 0)} 
                                                        className={inputBaseClass} 
                                                        placeholder="Qte" 
                                                        onInvalid={handleInvalid}
                                                        onInput={handleInput}
                                                        required
                                                    />
                                                 </div>
                                                 <div className="w-1/2 relative">
                                                    <select
                                                        value={item.unit}
                                                        onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                                                        className={`${inputBaseClass} appearance-none cursor-pointer pr-8`}
                                                    >
                                                        {UNIT_OPTIONS.map(u => (
                                                            <option key={u} value={u}>{u}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Desktop Delete */}
                                            <div className="hidden sm:flex sm:col-span-1 justify-end">
                                                <button type="button" onClick={() => removeIngredient(idx)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors">
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-gray-100"></div>

                        {/* Instructions */}
                        <div>
                             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                                <label className="block text-lg font-semibold text-text-primary">Instructions de préparation</label>
                                <button type="button" onClick={addInstruction} className="text-white bg-premier hover:bg-premier-dark px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors w-full sm:w-auto justify-center">
                                    <PlusIcon className="h-4 w-4" /> Ajouter une étape
                                </button>
                            </div>
                            <div className="space-y-4">
                                {instructions.map((item, idx) => (
                                    <div key={idx} className="bg-white sm:bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-200 sm:border-transparent mb-3 shadow-sm sm:shadow-none">
                                        {/* Mobile Header */}
                                        <div className="flex justify-between items-center mb-2 sm:hidden pb-2 border-b border-gray-100">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Étape {idx + 1}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => removeInstruction(idx)} 
                                                className="text-red-500 p-1.5 rounded-md hover:bg-red-50"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start">
                                            <div className="hidden sm:block pt-2">
                                                <span className="text-sm font-bold text-gray-500 w-8 text-center block">{idx + 1}</span>
                                            </div>
                                            
                                            <div className="flex-grow w-full">
                                                <textarea 
                                                    rows={3} 
                                                    value={item} 
                                                    onChange={(e) => handleInstructionChange(idx, e.target.value)} 
                                                    className={`${inputBaseClass} bg-white w-full`} 
                                                    placeholder={`Décrivez l'action à réaliser...`} 
                                                    required
                                                    onInvalid={handleInvalid}
                                                    onInput={handleInput}
                                                />
                                            </div>

                                            {/* Desktop Delete */}
                                            <button 
                                                type="button" 
                                                onClick={() => removeInstruction(idx)} 
                                                className="hidden sm:block text-gray-400 hover:text-red-500 mt-2 p-2 rounded-full hover:bg-red-50 transition-colors self-start"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Media Tab */}
                {activeTab === 'media' && (
                     <div className="space-y-8 animate-fade-in-up">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-4">
                                <label className="block text-sm font-medium text-text-secondary">Image de la recette</label>
                                
                                <div className="flex flex-col sm:flex-row gap-4 items-start">
                                    {/* Preview */}
                                    {imageUrl && (
                                        <div className="relative w-32 h-32 flex-shrink-0 mx-auto sm:mx-0 group">
                                            <img 
                                                src={imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`} 
                                                alt="Aperçu" 
                                                className="w-full h-full object-cover rounded-xl border border-border-color shadow-sm bg-gray-50"
                                                onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=Erreur'; }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageUrl('');
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition-colors border border-white shadow-sm"
                                            >
                                                <XIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Controls */}
                                    <div className="flex-1 w-full space-y-3">
                                         <div className={`flex items-center w-full bg-background rounded-lg border border-border-color focus-within:ring-2 focus-within:ring-premier focus-within:border-premier overflow-hidden transition-all ${isUploading ? 'opacity-60 bg-gray-50' : ''}`}>
                                            <span className="pl-3 pr-2 text-text-secondary text-sm border-r border-border-color bg-gray-50 h-full flex items-center">https://</span>
                                            <input 
                                                type="text" 
                                                value={imageUrl.replace(/^https?:\/\//, '')} 
                                                onChange={(e) => setImageUrl(e.target.value)} 
                                                onInvalid={handleInvalid}
                                                onInput={handleInput} 
                                                className="w-full bg-transparent py-2.5 px-3 text-text-primary placeholder:text-gray-400 focus:outline-none text-sm" 
                                                placeholder="www.exemple.com/recette.jpg" 
                                                disabled={isUploading}
                                            />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="h-px bg-border-color flex-1"></div>
                                            <span className="text-xs text-text-secondary uppercase font-medium">OU</span>
                                            <div className="h-px bg-border-color flex-1"></div>
                                        </div>

                                        <div>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="hidden" 
                                                accept="image/*" 
                                                onChange={handleFileChange}
                                                disabled={isUploading}
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => fileInputRef.current?.click()}
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

                            <div className="space-y-8">
                                <div>
                                    <label htmlFor="videoUrl" className="block text-sm font-medium text-text-secondary mb-2">Vidéo URL (Optionnel)</label>
                                    <input type="text" id="videoUrl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={inputBaseClass} placeholder="https://youtube.com/..." />
                                </div>
                                
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-sm font-medium text-text-secondary">Sources / Crédits</label>
                                        <button type="button" onClick={addSource} className="text-premier hover:text-premier-dark text-sm font-medium">
                                            + Ajouter
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {sources.map((item, idx) => (
                                            <div key={idx} className="flex gap-2 items-center relative z-10" style={{ zIndex: sources.length - idx }}>
                                                 <div className="flex-grow">
                                                    <CreatableSelect
                                                        options={existingSources}
                                                        value={item}
                                                        onChange={(val) => handleSourceChange(idx, val.toUpperCase())}
                                                        placeholder="ex: CHEF UNTEL"
                                                        required
                                                    />
                                                 </div>
                                                 <button type="button" onClick={() => removeSource(idx)} className="text-text-secondary hover:text-red-500 p-2">
                                                    <XIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                     </div>
                )}
                
                {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg mt-6 font-medium border border-red-100">{error}</p>}
            </div>

            <div className="p-4 sm:p-6 border-t border-border-color bg-gray-50 rounded-b-xl flex flex-col sm:flex-row-reverse items-center gap-3 z-10">
                <button
                    type="submit"
                    disabled={isLoading || isUploading}
                    className="w-full sm:w-auto inline-flex justify-center rounded-lg shadow-sm px-6 py-3 bg-premier text-base font-semibold text-white hover:bg-premier-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-premier sm:text-sm disabled:opacity-50 transition-all"
                >
                    {isLoading || isUploading ? 'Enregistrement...' : 'Enregistrer la recette'}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading || isUploading}
                    className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-semibold text-text-primary hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-premier sm:text-sm disabled:opacity-50 transition-all"
                >
                    Annuler
                </button>
            </div>
            </form>
        </div>
    </div>
  );
};

export default EditRecipeModal;
