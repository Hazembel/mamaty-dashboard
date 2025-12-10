
import React, { useState } from 'react';
import { XIcon, EyeIcon, EyeOffIcon } from './icons';
import { loginAdmin } from '../services/adminService';

interface PasswordChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  adminEmail: string;
}

const PasswordChallengeModal: React.FC<PasswordChallengeModalProps> = ({ isOpen, onClose, onSuccess, adminEmail }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Verify password by attempting a login
      // Note: In a real app, you might want a dedicated 'verify-password' endpoint
      // but re-authenticating works for verification too.
      await loginAdmin(adminEmail, password);
      onSuccess();
      setPassword(''); // Clear password on success
    } catch (err) {
      setError('Mot de passe incorrect.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium leading-6 text-text-primary">Sécurité requise</h3>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          
          <p className="text-sm text-text-secondary mb-4">
            Vous tentez de modifier un compte Administrateur. Veuillez confirmer le mot de passe de ce compte pour continuer.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                    <input 
                        type="text" 
                        value={adminEmail} 
                        disabled 
                        className="w-full bg-gray-100 border border-border-color rounded-lg py-2 px-3 text-text-secondary cursor-not-allowed"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Mot de passe</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-background border border-border-color rounded-lg py-2 px-3 pr-10 text-text-primary focus:outline-none focus:ring-2 focus:ring-premier"
                            placeholder="Entrez le mot de passe"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            <div className="mt-6 flex flex-row-reverse gap-3">
                <button
                    type="submit"
                    disabled={isLoading || !password}
                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-premier text-base font-medium text-white hover:bg-premier-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-premier sm:text-sm disabled:opacity-50"
                >
                    {isLoading ? 'Vérification...' : 'Confirmer'}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="inline-flex justify-center rounded-md border border-border-color shadow-sm px-4 py-2 bg-white text-base font-medium text-text-primary hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-premier sm:text-sm disabled:opacity-50"
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

export default PasswordChallengeModal;
