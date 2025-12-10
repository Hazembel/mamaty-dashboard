
import React, { useState, FormEvent } from 'react';
import { loginAdmin } from '../services/adminService';
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon } from './icons';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = await loginAdmin(email, password);
      onLoginSuccess(token);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Impossible de se connecter au serveur. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvalid = (e: React.FormEvent<HTMLInputElement>, message: string) => {
    const target = e.target as HTMLInputElement;
    target.setCustomValidity(message);
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    target.setCustomValidity('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-default rounded-2xl p-8 space-y-6 border border-border-color">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-premier">Mamaty</h1>
            <p className="text-text-secondary mt-2">Connectez-vous à votre tableau de bord</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onInvalid={(e) => handleInvalid(e, "Veuillez saisir une adresse e-mail valide.")}
                onInput={handleInput}
                placeholder="Adresse e-mail"
                className="w-full pl-10 pr-4 py-3 border border-border-color rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-premier transition-shadow"
                required
              />
            </div>

            <div className="relative">
               <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <LockIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onInvalid={(e) => handleInvalid(e, "Veuillez saisir votre mot de passe.")}
                onInput={handleInput}
                placeholder="Mot de passe"
                className="w-full pl-10 pr-12 py-3 border border-border-color rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-premier transition-shadow"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-premier hover:bg-premier-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-premier disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
