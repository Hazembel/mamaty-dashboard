
import React, { useState, useEffect, FormEvent } from 'react';
import { Recipe, Category, Ingredient } from '../types';
import { XIcon, PlusIcon, TrashIcon } from './icons';
import Dropdown from './Dropdown';
import CreatableSelect from './CreatableSelect';
import { tunisianCities } from '../lib/tunisianCities';

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: Partial<Recipe>) => Promise<void>;
  recipe: Recipe | null;
  categories: Category[];
  isLoading?: boolean;
  existingIngredients?: string[];
  existingSources?: string[];
}

const cityOptions = [
    { value: '', label: 'Non spécifiée' },
    ...tunisianCities.map(city => ({ value: city, label: city }))
];

const UNIT_OPTIONS = [
  'g', 'kg', 'ml', 'cl', 'l', 'c.à.s', 'c.à.c', 'pincée', 'pièce', 'tranche', 'tasse', 'verre', 'bol', 'botte', 'gousse', 'brin'
];

const EditRecipeModal: React.FC<RecipeModalProps> = ({ isOpen, onClose, onSave, recipe, categories, isLoading, existingIngredients = [], existingSources = [] }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [rating, setRating] = useState('4.5');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [city, setCity] = useState('');
  const [minDay, setMinDay] = useState('270'); // 9 months
  const [maxDay, setMaxDay] = useState('720'); // 24 months
  
  // Ingredients as structured objects
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', quantity: 0, unit: 'g' }]);
  
  // Simple string arrays
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [sources, setSources] = useState<string[]>(['']);

  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'details' | 'media'>('info');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setActiveTab('info');
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
        setIngredients([{ name: '', quantity: 0, unit: 'g' }]);
        setInstructions(['']);
        setSources(['']);
      }
    }
  }, [isOpen, recipe]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!categoryId) {
        setError("Veuillez sélectionner une catégorie.");
        return;
    }
    
    const cleanIngredients = ingredients.filter(i => i.name.trim() !== '');
    const cleanInstructions = instructions.filter(i => i.trim() !== '');
    const cleanSources = sources.filter(s => s.trim() !== '');

    if (cleanIngredients.length === 0) {
        setError("Veuillez ajouter au moins un ingrédient avec un nom.");
        return;
    }
    if (cleanInstructions.length === 0) {
        setError("Veuillez ajouter au moins une étape de préparation.");
        return;
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
      { id: 'info', label: 'Informations' },
      { id: 'details', label: 'Ingrédients & Préparation' },
      { id: 'media', label: 'Média & Sources' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4" aria-modal="true" role="dialog">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[90vh] transform transition-all">
            <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            
            <div className="p-6 border-b border-border-color flex justify-between items-center bg-white rounded-t-xl z-10">
                 <h3 className="text-2xl font-bold text-text-primary">
                    {recipe ? "Modifier la recette" : "Ajouter une recette"}
                </h3>
                <button type="button" onClick={onClose} className="p-2 rounded-full text-text-secondary hover:bg-gray-100 transition-colors">
                    <XIcon className="h-6 w-6" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border-color px-8 bg-gray-50/50">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.id ? 'border-premier text-premier' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-white">
                {/* General Info Tab */}
                {activeTab === 'info' && (
                    <div className="space-y-8 animate-fade-in-up">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-2">Titre de la recette</label>
                                <input required type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputBaseClass} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">Catégorie</label>
                                <Dropdown options={categoryOptions} value={categoryId} onChange={setCategoryId} />
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-2">Description courte / Introduction</label>
                            <textarea required rows={4} id="description" value={description} onChange={(e) => setDescription(e.target.value)} className={inputBaseClass} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                             <div>
                                <label htmlFor="rating" className="block text-sm font-medium text-text-secondary mb-2">Note (0 - 5)</label>
                                <input type="number" step="0.1" min="0" max="5" id="rating" value={rating} onChange={(e) => setRating(e.target.value)} className={inputBaseClass} />
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
                    <div className="space-y-10 animate-fade-in-up">
                        {/* Ingredients */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label className="block text-lg font-semibold text-text-primary">Ingrédients</label>
                                <button type="button" onClick={addIngredient} className="text-white bg-premier hover:bg-premier-dark px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
                                    <PlusIcon className="h-4 w-4" /> Ajouter un ingrédient
                                </button>
                            </div>
                            <div className="space-y-3">
                                {ingredients.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-gray-50 p-4 rounded-xl border border-border-color hover:border-gray-300 transition-colors">
                                        <div className="sm:col-span-6 flex items-center gap-3">
                                            <span className="text-sm font-bold text-text-primary bg-white w-8 h-8 flex items-center justify-center rounded-full shadow-sm border border-gray-200 shrink-0">{idx + 1}</span>
                                            
                                            <div className="flex-grow relative z-20" style={{ zIndex: ingredients.length - idx }}> 
                                                <CreatableSelect
                                                    options={existingIngredients}
                                                    value={item.name}
                                                    onChange={(val) => handleIngredientChange(idx, 'name', val)}
                                                    placeholder="Nom de l'ingrédient (ex: Farine)"
                                                />
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <input 
                                                type="number" 
                                                step="0.1"
                                                value={item.quantity} 
                                                onChange={(e) => handleIngredientChange(idx, 'quantity', parseFloat(e.target.value) || 0)} 
                                                className={inputBaseClass} 
                                                placeholder="Quantité" 
                                            />
                                        </div>
                                        <div className="sm:col-span-3">
                                            <select
                                                value={item.unit}
                                                onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                                                className={`${inputBaseClass} appearance-none cursor-pointer`}
                                                style={{ backgroundImage: 'none' }}
                                            >
                                                {UNIT_OPTIONS.map(u => (
                                                    <option key={u} value={u}>{u}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div className="sm:col-span-1 flex justify-end">
                                            <button type="button" onClick={() => removeIngredient(idx)} className="text-text-secondary hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-gray-100"></div>

                        {/* Instructions */}
                        <div>
                             <div className="flex justify-between items-center mb-4">
                                <label className="block text-lg font-semibold text-text-primary">Instructions de préparation</label>
                                <button type="button" onClick={addInstruction} className="text-white bg-premier hover:bg-premier-dark px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
                                    <PlusIcon className="h-4 w-4" /> Ajouter une étape
                                </button>
                            </div>
                            <div className="space-y-4">
                                {instructions.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-start bg-gray-50 p-4 rounded-xl border border-border-color">
                                        <span className="text-sm font-bold text-premier bg-purple-50 w-8 h-8 flex items-center justify-center rounded-full border border-purple-100 shrink-0 mt-1">{idx + 1}</span>
                                        <textarea rows={2} value={item} onChange={(e) => handleInstructionChange(idx, e.target.value)} className={`${inputBaseClass} bg-white`} placeholder={`Étape ${idx + 1} : Décrivez l'action à réaliser...`} />
                                        <button type="button" onClick={() => removeInstruction(idx)} className="text-text-secondary hover:text-red-500 p-2 mt-1 rounded-full hover:bg-red-50 transition-colors">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
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
                                <label htmlFor="imageUrl" className="block text-sm font-medium text-text-secondary">Image URL</label>
                                <input required type="text" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={inputBaseClass} placeholder="https://example.com/recipe.jpg" />
                                <div className="border-2 border-dashed border-border-color rounded-xl h-64 flex items-center justify-center bg-gray-50 overflow-hidden relative">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-gray-100'); }} />
                                    ) : (
                                        <span className="text-text-secondary text-sm">Aperçu de l'image</span>
                                    )}
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

            <div className="p-6 border-t border-border-color bg-gray-50 rounded-b-xl flex flex-row-reverse items-center gap-3 z-10">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex justify-center rounded-lg shadow-sm px-6 py-3 bg-premier text-base font-semibold text-white hover:bg-premier-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-premier sm:text-sm disabled:opacity-50 transition-all"
                >
                    {isLoading ? 'Enregistrement...' : 'Enregistrer la recette'}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-semibold text-text-primary hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-premier sm:text-sm disabled:opacity-50 transition-all"
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
