
import React, { useState, useEffect, useRef } from 'react';
import PageLayout from './PageLayout';
import { AvatarItem } from '../types';
import { getAvatars, saveAvatar, deleteAvatar } from '../services/avatarService';
import { UploadIcon, TrashIcon, XIcon, LoadingSpinnerIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';

interface AvatarsPageProps {
  token: string;
  onLogout: () => void;
}

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void; }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const baseClasses = "fixed top-5 right-5 z-50 p-4 rounded-md shadow-lg text-white flex items-center animate-fade-in-up";
  const typeClasses = type === 'success' ? 'bg-green-500' : 'bg-red-600';

  return (
    <div className={`${baseClasses} ${typeClasses}`} role="alert">
      <span className="flex-grow">{message}</span>
      <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white/20">
        <XIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

const AvatarsPage: React.FC<AvatarsPageProps> = ({ token, onLogout }) => {
  const [avatars, setAvatars] = useState<AvatarItem[]>([]);
  const [activeType, setActiveType] = useState<'parent' | 'baby'>('parent');
  const [activeGender, setActiveGender] = useState<'male' | 'female'>('male');
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [avatarToDelete, setAvatarToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadAvatars = async () => {
        setLoading(true);
        try {
            const fetched = await getAvatars(token);
            setAvatars(fetched);
        } catch (err: any) {
            console.error(err);
            if (err.message && err.message.includes("Session expirée")) {
                onLogout();
            } else {
                showToast("Impossible de charger les avatars.", 'error');
            }
        } finally {
            setLoading(false);
        }
    };
    loadAvatars();
  }, [token, onLogout]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showToast("L'image est trop volumineuse (max 5MB).", 'error');
        return;
    }

    setIsUploading(true);
    try {
        const newAvatar = await saveAvatar(token, file, activeType, activeGender);
        setAvatars(prev => [newAvatar, ...prev]); // Prepend new avatar
        showToast('Avatar téléchargé avec succès.', 'success');
    } catch (error: any) {
        console.error(error);
        showToast(error.message || "Échec du téléchargement de l'avatar.", 'error');
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); // Prevent triggering any parent click events
      setAvatarToDelete(id);
  };

  const handleConfirmDelete = async () => {
      if (!avatarToDelete) return;
      setIsDeleting(true);
      try {
          await deleteAvatar(token, avatarToDelete);
          setAvatars(prev => prev.filter(a => a._id !== avatarToDelete));
          showToast('Avatar supprimé.', 'success');
      } catch (error: any) {
          console.error("Delete failed", error);
          showToast(error.message || 'Erreur lors de la suppression.', 'error');
      } finally {
          setIsDeleting(false);
          setAvatarToDelete(null);
      }
  };

  const filteredAvatars = avatars.filter(a => a.type === activeType && a.gender === activeGender);

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <PageLayout
        title="Gestion des Avatars"
        headerContent={
            <div className="flex gap-2">
               {/* Controls in header if needed */}
            </div>
        }
      >
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Controls Area */}
            <div className="p-6 bg-white border-b border-border-color space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    
                    {/* Filters */}
                    <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
                        <button
                            onClick={() => { setActiveType('parent'); setActiveGender('male'); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeType === 'parent' && activeGender === 'male' ? 'bg-white shadow-sm text-premier' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Papa (Homme)
                        </button>
                        <button
                            onClick={() => { setActiveType('parent'); setActiveGender('female'); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeType === 'parent' && activeGender === 'female' ? 'bg-white shadow-sm text-premier' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Maman (Femme)
                        </button>
                        <button
                            onClick={() => { setActiveType('baby'); setActiveGender('male'); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeType === 'baby' && activeGender === 'male' ? 'bg-white shadow-sm text-premier' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Bébé (Garçon)
                        </button>
                        <button
                            onClick={() => { setActiveType('baby'); setActiveGender('female'); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeType === 'baby' && activeGender === 'female' ? 'bg-white shadow-sm text-premier' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Bébé (Fille)
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 p-6 overflow-y-auto">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <LoadingSpinnerIcon className="h-12 w-12 text-premier" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                        
                        {/* Upload Card */}
                        <div 
                            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-premier hover:bg-premier/5 transition-all flex flex-col items-center justify-center cursor-pointer group bg-white"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                            {isUploading ? (
                                <LoadingSpinnerIcon className="h-8 w-8 text-premier" />
                            ) : (
                                <>
                                    <div className="p-3 rounded-full bg-gray-50 group-hover:bg-white transition-colors mb-2">
                                        <UploadIcon className="h-6 w-6 text-gray-400 group-hover:text-premier" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500 group-hover:text-premier">Ajouter</span>
                                </>
                            )}
                        </div>

                        {/* Avatar Cards */}
                        {filteredAvatars.map((avatar) => (
                            <div key={avatar._id} className="group relative aspect-square rounded-xl overflow-hidden border border-border-color bg-white shadow-sm hover:shadow-md transition-all">
                                <img 
                                    src={avatar.url} 
                                    alt="Avatar" 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                        onClick={(e) => handleDeleteClick(e, avatar._id)}
                                        className="p-2 bg-white rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors shadow-lg"
                                        title="Supprimer"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {!loading && filteredAvatars.length === 0 && (
                    <div className="text-center py-10 text-text-secondary">
                        Aucun avatar téléchargé pour cette catégorie. Commencez par en ajouter un !
                    </div>
                )}
            </div>
        </div>
      </PageLayout>

      <ConfirmationModal
        isOpen={!!avatarToDelete}
        onClose={() => setAvatarToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer l'avatar"
        message="Êtes-vous sûr de vouloir supprimer cet avatar ? Cette action est irréversible."
        confirmButtonText="Supprimer"
        isLoading={isDeleting}
      />
    </>
  );
};

export default AvatarsPage;
