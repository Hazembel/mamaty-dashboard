
import React, { useState, useMemo, useEffect } from 'react';
import { getAvatars } from '../services/avatarService';
import { AvatarItem } from '../types';

interface AvatarSelectorProps {
  onSelect: (url: string) => void;
  selectedAvatar?: string;
  section: 'parent' | 'baby';
  initialGender?: 'male' | 'female';
  token: string;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({ onSelect, selectedAvatar, section, initialGender, token }) => {
  // Use local state for gender tab selection
  const [activeGender, setActiveGender] = useState<'male' | 'female'>('male');
  const [customUrl, setCustomUrl] = useState('');
  const [dynamicAvatars, setDynamicAvatars] = useState<AvatarItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialGender) {
        setActiveGender(initialGender);
    }
  }, [initialGender]);

  // Load uploaded avatars
  useEffect(() => {
      const fetchAvatars = async () => {
          setIsLoading(true);
          try {
              const fetched = await getAvatars(token);
              setDynamicAvatars(fetched);
          } catch (error) {
              console.error("Failed to load avatars", error);
          } finally {
              setIsLoading(false);
          }
      };
      if (token) {
          fetchAvatars();
      }
  }, [token]);

  const currentAvatars = useMemo(() => {
    // Filter uploaded avatars from the service
    const uploadedList = dynamicAvatars
        .filter(a => a.type === section && a.gender === activeGender)
        .map(a => a.url);

    return uploadedList;
  }, [section, activeGender, dynamicAvatars]);

  const handleCustomUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomUrl(e.target.value);
      if (e.target.value) {
          onSelect(e.target.value);
      }
  };

  return (
    <div className="space-y-4">
        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-lg w-fit">
            <button
                type="button"
                onClick={() => setActiveGender('male')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeGender === 'male' ? 'bg-white text-premier shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >
                {section === 'parent' ? 'Papa' : 'Garçon'}
            </button>
            <button
                type="button"
                onClick={() => setActiveGender('female')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeGender === 'female' ? 'bg-white text-premier shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            >
                {section === 'parent' ? 'Maman' : 'Fille'}
            </button>
        </div>

        {/* Grid */}
        <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto custom-scrollbar p-2 border border-border-color rounded-lg bg-gray-50 min-h-[80px]">
            {isLoading ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                    <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            ) : (
                currentAvatars.length > 0 ? (
                    currentAvatars.map((url, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => onSelect(url)}
                            className={`relative w-12 h-12 rounded-full overflow-hidden transition-all duration-200 ${selectedAvatar === url ? 'ring-2 ring-premier ring-offset-2 scale-110' : 'hover:scale-105 hover:opacity-80'}`}
                        >
                            <img 
                                src={url} 
                                alt="Avatar option" 
                                className="w-full h-full object-cover bg-white"
                                onError={(e) => {
                                    // Fallback for missing local assets during dev
                                    if (url && typeof url === 'string' && !url.startsWith('http')) {
                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${section.charAt(0).toUpperCase()}&background=random`;
                                    }
                                }}
                            />
                        </button>
                    ))
                ) : (
                    <div className="w-full flex items-center justify-center p-4 text-xs text-text-secondary">
                        Aucun avatar disponible.
                    </div>
                )
            )}
        </div>

        {/* Custom Input */}
        <div className="flex flex-col gap-1">
            <label className="text-xs text-text-secondary">Ou URL personnalisée</label>
            <input 
                type="text" 
                placeholder="https://..." 
                value={customUrl}
                onChange={handleCustomUrlChange}
                className="w-full bg-background rounded-lg py-2 px-3 text-sm text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-premier focus:bg-white transition-colors border border-border-color"
            />
        </div>
        
        {/* Preview Selected if it's not in the grid (e.g. custom or old value) */}
        {selectedAvatar && !currentAvatars.includes(selectedAvatar) && selectedAvatar !== customUrl && (
             <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 border border-yellow-100 rounded-lg">
                <span className="text-xs text-yellow-700 font-medium">Actuel (Hors liste):</span>
                <img src={selectedAvatar} className="w-8 h-8 rounded-full object-cover" alt="Current" />
            </div>
        )}
    </div>
  );
};

export default AvatarSelector;
