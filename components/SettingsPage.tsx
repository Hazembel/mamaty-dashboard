
import React, { useState } from 'react';
import PageLayout from './PageLayout';
import { changePassword } from '../services/settingsService';
import { ShieldCheckIcon, BellIcon, DownloadIcon, SaveIcon, EyeIcon, EyeOffIcon } from './icons';
import { THEME_PRESETS, applyTheme } from '../lib/theme';

interface SettingsPageProps {
  token: string;
  onLogout: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ token }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'appearance' | 'data'>('general');
  
  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password Visibility State
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [securityMessage, setSecurityMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // General Prefs State (Mock)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Theme State
  const [selectedThemeId, setSelectedThemeId] = useState<string>('violet');

  const handleInvalid = (e: React.FormEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).setCustomValidity("Veuillez remplir ce champ.");
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).setCustomValidity('');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

    if (newPassword !== confirmPassword) {
      setSecurityMessage({ text: "Les nouveaux mots de passe ne correspondent pas.", type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setSecurityMessage({ text: "Le mot de passe doit contenir au moins 6 caractères.", type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(token, currentPassword, newPassword);
      setSecurityMessage({ text: "Mot de passe modifié avec succès.", type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur lors du changement de mot de passe.";
        setSecurityMessage({ text: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportData = () => {
    // Real export functionality
    const data = {
      exportDate: new Date().toISOString(),
      app: "Mamaty Dashboard",
      note: "This is a client-side export of available cached data context."
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mamaty_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleThemeChange = (preset: typeof THEME_PRESETS[0]) => {
    setSelectedThemeId(preset.id);
    applyTheme(preset.primary, preset.dark);
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: BellIcon },
    { id: 'security', label: 'Sécurité', icon: ShieldCheckIcon },
    { id: 'appearance', label: 'Apparence', icon: EyeIcon },
    { id: 'data', label: 'Données', icon: DownloadIcon },
  ];

  return (
    <PageLayout title="Paramètres">
      <div className="max-w-4xl mx-auto">
        
        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-border-color overflow-hidden mb-6">
            <div className="flex overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                                flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2
                                ${activeTab === tab.id 
                                    ? 'border-premier text-premier bg-premier/5' 
                                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-gray-50'}
                            `}
                        >
                            <Icon className="h-5 w-5" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-border-color p-6 sm:p-8 min-h-[400px]">
            
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
                <div className="space-y-8 animate-fade-in-up">
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-4">Préférences de l'application</h3>
                        <div className="space-y-4">
                             <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-border-color">
                                <div>
                                    <p className="font-medium text-text-primary">Mode Maintenance</p>
                                    <p className="text-sm text-text-secondary">Empêcher l'accès aux utilisateurs (hors admin).</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-premier/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-premier"></div>
                                </label>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-border-color">
                                <div>
                                    <p className="font-medium text-text-primary">Notifications Email</p>
                                    <p className="text-sm text-text-secondary">Recevoir des alertes pour les nouvelles inscriptions.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-premier/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-premier"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
                <div className="max-w-md animate-fade-in-up">
                    <h3 className="text-lg font-semibold text-text-primary mb-6">Changer le mot de passe</h3>
                    <form onSubmit={handlePasswordChange} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Mot de passe actuel</label>
                            <div className="relative">
                                <input 
                                    type={showCurrentPassword ? "text" : "password"} 
                                    required 
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    onInvalid={handleInvalid}
                                    onInput={handleInput}
                                    className="w-full rounded-lg border-border-color bg-background py-2.5 px-4 pr-10 text-text-primary focus:ring-2 focus:ring-premier focus:bg-white transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showCurrentPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Nouveau mot de passe</label>
                            <div className="relative">
                                <input 
                                    type={showNewPassword ? "text" : "password"} 
                                    required 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    onInvalid={handleInvalid}
                                    onInput={handleInput}
                                    className="w-full rounded-lg border-border-color bg-background py-2.5 px-4 pr-10 text-text-primary focus:ring-2 focus:ring-premier focus:bg-white transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showNewPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Confirmer le nouveau mot de passe</label>
                            <div className="relative">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    required 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    onInvalid={handleInvalid}
                                    onInput={handleInput}
                                    className="w-full rounded-lg border-border-color bg-background py-2.5 px-4 pr-10 text-text-primary focus:ring-2 focus:ring-premier focus:bg-white transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {securityMessage && (
                            <div className={`p-3 rounded-lg text-sm ${securityMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {securityMessage.text}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-premier hover:bg-premier-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Traitement...' : (
                                <>
                                    <SaveIcon className="h-4 w-4" />
                                    Mettre à jour
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
                <div className="animate-fade-in-up">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Thème de l'interface</h3>
                    <p className="text-text-secondary mb-6 text-sm">Personnalisez la couleur principale de votre tableau de bord.</p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {THEME_PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => handleThemeChange(preset)}
                                className={`
                                    group relative flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-200
                                    ${selectedThemeId === preset.id 
                                        ? 'border-premier bg-premier/5 ring-1 ring-premier' 
                                        : 'border-border-color hover:border-gray-300 hover:bg-gray-50'}
                                `}
                            >
                                <div 
                                    className="w-12 h-12 rounded-full shadow-sm flex items-center justify-center transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: preset.primary }}
                                >
                                    {selectedThemeId === preset.id && (
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className={`text-sm font-medium ${selectedThemeId === preset.id ? 'text-premier' : 'text-text-primary'}`}>
                                    {preset.name}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-10 p-6 bg-gray-50 rounded-xl border border-border-color">
                        <h4 className="text-sm font-bold text-text-primary mb-4">Aperçu des composants</h4>
                        <div className="flex flex-wrap gap-4 items-center">
                            <button className="px-4 py-2 bg-premier text-white rounded-lg shadow-sm">Bouton Principal</button>
                            <button className="px-4 py-2 bg-white border border-premier text-premier rounded-lg shadow-sm">Bouton Secondaire</button>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked readOnly className="text-premier focus:ring-premier rounded" />
                                <span className="text-sm">Case à cocher</span>
                            </div>
                            <span className="px-2 py-1 bg-premier/10 text-premier text-xs rounded-full font-medium">Badge</span>
                        </div>
                    </div>
                </div>
            )}

            {/* DATA TAB */}
            {activeTab === 'data' && (
                <div className="animate-fade-in-up">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Exportation des données</h3>
                    <p className="text-text-secondary text-sm mb-6">
                        Téléchargez une copie de vos données actuelles (JSON) pour effectuer des sauvegardes manuelles.
                    </p>
                    
                    <div className="p-6 border border-border-color rounded-xl bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                <DownloadIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-medium text-text-primary">Sauvegarde complète</h4>
                                <p className="text-xs text-text-secondary">Utilisateurs, Recettes, Conseils, etc.</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleExportData}
                            className="px-4 py-2 bg-white border border-border-color text-text-primary hover:text-premier hover:border-premier rounded-lg shadow-sm transition-colors font-medium text-sm"
                        >
                            Télécharger JSON
                        </button>
                    </div>
                </div>
            )}

        </div>
      </div>
    </PageLayout>
  );
};

export default SettingsPage;
