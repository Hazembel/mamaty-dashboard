
import React, { useState, useEffect, FormEvent } from 'react';
import { ContactInfo, SocialItem } from '../types';
import { XIcon, PlusIcon, TrashIcon } from './icons';

interface ContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (info: Partial<ContactInfo>) => Promise<void>;
  info: ContactInfo | null;
  isLoading?: boolean;
}

const EditContactInfoModal: React.FC<ContactInfoModalProps> = ({ isOpen, onClose, onSave, info, isLoading }) => {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [socials, setSocials] = useState<SocialItem[]>([]);
  const [error, setError] = useState('');
  
  const isEditMode = !!info;

  useEffect(() => {
    if (isOpen) {
        setError('');
        if (info) {
            setPhone(info.phone || '');
            setEmail(info.email || '');
            setDescription(info.description || '');
            setSocials(info.socials && info.socials.length > 0 ? info.socials : []);
        } else {
            setPhone('');
            setEmail('');
            setDescription('');
            setSocials([]);
        }
    }
  }, [isOpen, info]);

  const handleAddSocial = () => {
    setSocials([...socials, { icon: '', title: '', subtitle: '', url: '' }]);
  };

  const handleRemoveSocial = (index: number) => {
    const newSocials = [...socials];
    newSocials.splice(index, 1);
    setSocials(newSocials);
  };

  const handleSocialChange = (index: number, field: keyof SocialItem, value: string) => {
    const newSocials = [...socials];
    newSocials[index] = { ...newSocials[index], [field]: value };
    setSocials(newSocials);
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
    
    if (!phone.trim() || !email.trim()) {
        setError("L'email et le téléphone sont requis.");
        return;
    }

    // Validate Socials
    for (const s of socials) {
        if (!s.title || !s.url || !s.icon) {
            setError("Tous les champs des réseaux sociaux (Titre, URL, Icône) sont requis.");
            return;
        }
    }

    try {
      await onSave({ phone, email, description, socials });
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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl transform transition-all max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-border-color flex justify-between items-center">
              <h3 className="text-xl font-semibold text-text-primary">
                {isEditMode ? "Modifier l'info de contact" : "Ajouter une info de contact"}
              </h3>
              <button type="button" onClick={onClose} className="p-1 rounded-full text-text-secondary hover:bg-gray-100">
                <XIcon className="h-6 w-6" />
              </button>
          </div>
            
          <div className="p-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                    <input 
                        required 
                        type="email" 
                        id="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Veuillez saisir une adresse e-mail valide.")}
                        onInput={handleInput} 
                        className={inputBaseClass} 
                        placeholder="contact@mamaty.tn" 
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-1">Téléphone</label>
                    <input 
                        required 
                        type="tel" 
                        id="phone" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)}
                        onInvalid={handleInvalid}
                        onInput={handleInput} 
                        className={inputBaseClass} 
                        placeholder="+216 71 000 000" 
                    />
                  </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputBaseClass} placeholder="Description brève..." />
              </div>

              {/* Socials Section */}
              <div className="border-t border-border-color pt-4">
                  <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-text-primary">Réseaux Sociaux</h4>
                      <button type="button" onClick={handleAddSocial} className="text-sm text-premier hover:text-premier-dark font-medium flex items-center gap-1">
                          <PlusIcon className="h-4 w-4" /> Ajouter
                      </button>
                  </div>
                  
                  {socials.length === 0 ? (
                      <p className="text-sm text-text-secondary italic text-center py-4 bg-gray-50 rounded-lg">Aucun réseau social ajouté.</p>
                  ) : (
                      <div className="space-y-4">
                          {socials.map((social, idx) => (
                              <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-border-color relative group">
                                  <button 
                                    type="button" 
                                    onClick={() => handleRemoveSocial(idx)}
                                    className="absolute top-2 right-2 p-1 text-text-secondary hover:text-red-500 rounded-full hover:bg-white transition-colors"
                                  >
                                      <XIcon className="h-4 w-4" />
                                  </button>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-xs font-medium text-text-secondary mb-1">Titre</label>
                                          <input 
                                            type="text" 
                                            value={social.title} 
                                            onChange={(e) => handleSocialChange(idx, 'title', e.target.value)} 
                                            className={`${inputBaseClass} py-1.5 text-sm`} 
                                            placeholder="ex: Facebook" 
                                          />
                                      </div>
                                       <div>
                                          <label className="block text-xs font-medium text-text-secondary mb-1">Sous-titre (Optionnel)</label>
                                          <input 
                                            type="text" 
                                            value={social.subtitle} 
                                            onChange={(e) => handleSocialChange(idx, 'subtitle', e.target.value)} 
                                            className={`${inputBaseClass} py-1.5 text-sm`} 
                                            placeholder="ex: @mamaty_officiel" 
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-medium text-text-secondary mb-1">URL</label>
                                          <input 
                                            type="text" 
                                            value={social.url} 
                                            onChange={(e) => handleSocialChange(idx, 'url', e.target.value)} 
                                            className={`${inputBaseClass} py-1.5 text-sm`} 
                                            placeholder="https://..." 
                                          />
                                      </div>
                                       <div>
                                          <label className="block text-xs font-medium text-text-secondary mb-1">Icône (Code ou URL)</label>
                                          <input 
                                            type="text" 
                                            value={social.icon} 
                                            onChange={(e) => handleSocialChange(idx, 'icon', e.target.value)} 
                                            className={`${inputBaseClass} py-1.5 text-sm`} 
                                            placeholder="ex: facebook OU https://..." 
                                          />
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
          </div>
          
           <div className="p-6 border-t border-border-color bg-gray-50 flex flex-row-reverse items-center gap-3">
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

export default EditContactInfoModal;
