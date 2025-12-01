
import React, { useEffect, useState } from 'react';
import PageLayout from './PageLayout';
import { 
    getFaqs, createFaq, updateFaq, deleteFaq,
    getContactInfos, createContactInfo, updateContactInfo
} from '../services/infoService';
import { FAQ, ContactInfo } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, XIcon, LoadingSpinnerIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';
import EditFaqModal from './EditFaqModal';
import EditContactInfoModal from './EditContactInfoModal';

interface InfosPageProps {
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

const InfosPage: React.FC<InfosPageProps> = ({ token, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [infos, setInfos] = useState<ContactInfo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Separate error states for robust loading
  const [faqError, setFaqError] = useState<string | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);

  // Modal States
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [faqToEdit, setFaqToEdit] = useState<FAQ | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null);

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [infoToEdit, setInfoToEdit] = useState<ContactInfo | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const fetchData = async () => {
    setLoading(true);
    setFaqError(null);
    setInfoError(null);

    // Fetch FAQs
    try {
        const fetchedFaqs = await getFaqs(token);
        setFaqs(fetchedFaqs);
    } catch (e: any) {
        console.error("Failed to fetch FAQs", e);
        if (e.message?.includes("Session expirée")) onLogout();
        setFaqError("Impossible de charger les FAQs.");
    }

    // Fetch Contact Infos
    try {
        const fetchedInfos = await getContactInfos(token);
        setInfos(fetchedInfos);
    } catch (e: any) {
        console.error("Failed to fetch Contact Infos", e);
        if (e.message?.includes("Session expirée")) onLogout();
        setInfoError(e.message || "Impossible de charger les infos de contact.");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [token, onLogout]);

  // --- FAQ Handlers ---

  const handleSaveFaq = async (faqData: Partial<FAQ>) => {
    setIsSubmitting(true);
    try {
        if (faqToEdit) {
            const updated = await updateFaq(token, faqToEdit._id, faqData);
            setFaqs(faqs.map(f => f._id === updated._id ? updated : f));
            showToast('FAQ mise à jour.', 'success');
        } else {
            const newFaq = await createFaq(token, faqData);
            setFaqs([newFaq, ...faqs]);
            showToast('FAQ créée.', 'success');
        }
        setIsFaqModalOpen(false);
        setFaqToEdit(null);
    } catch (e: any) {
        showToast(e.message || 'Erreur lors de la sauvegarde.', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteFaq = async () => {
      if (!faqToDelete) return;
      setIsSubmitting(true);
      try {
          await deleteFaq(token, faqToDelete._id);
          setFaqs(faqs.filter(f => f._id !== faqToDelete._id));
          showToast('FAQ supprimée.', 'success');
      } catch (e: any) {
          showToast(e.message || 'Erreur lors de la suppression.', 'error');
      } finally {
          setIsSubmitting(false);
          setFaqToDelete(null);
      }
  };

  const openFaqModal = (faq?: FAQ) => {
      setFaqToEdit(faq || null);
      setIsFaqModalOpen(true);
  };

  // --- Contact Info Handlers ---

  const handleSaveInfo = async (infoData: Partial<ContactInfo>) => {
    setIsSubmitting(true);
    try {
        if (infoToEdit) {
            const updated = await updateContactInfo(token, infoToEdit._id, infoData);
            setInfos(infos.map(i => i._id === updated._id ? updated : i));
            showToast('Info mise à jour.', 'success');
        } else {
            const newInfo = await createContactInfo(token, infoData);
            setInfos([newInfo, ...infos]);
            showToast('Info créée.', 'success');
        }
        setIsInfoModalOpen(false);
        setInfoToEdit(null);
    } catch (e: any) {
        showToast(e.message || 'Erreur lors de la sauvegarde.', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const openInfoModal = (info?: ContactInfo) => {
      setInfoToEdit(info || null);
      setIsInfoModalOpen(true);
  };

  if (loading) return <div className="flex h-full items-center justify-center"><LoadingSpinnerIcon className="h-12 w-12 text-premier" /></div>;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <PageLayout
        title="Infos & FAQ"
        headerContent={
            <div className="flex gap-4">
                 {activeTab === 'faq' && (
                    <button 
                        onClick={() => openFaqModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-premier text-white rounded-lg hover:bg-premier-dark transition-colors text-sm font-medium"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Ajouter une FAQ
                    </button>
                 )}
            </div>
        }
      >
        <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex border-b border-border-color px-6">
                 <button
                    onClick={() => setActiveTab('faq')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'faq' ? 'border-premier text-premier' : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    Questions Fréquentes (FAQ)
                </button>
                <button
                    onClick={() => setActiveTab('contact')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'contact' ? 'border-premier text-premier' : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    Informations de Contact
                </button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-gray-50/30">
                {activeTab === 'faq' ? (
                    <>
                        {faqError ? (
                            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 border border-red-200 text-center">
                                <p className="font-medium mb-2">{faqError}</p>
                                <button onClick={fetchData} className="text-sm underline hover:text-red-800">Réessayer</button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg border border-border-color shadow-sm overflow-hidden">
                                <table className="min-w-full divide-y divide-border-color">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Question</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Réponse</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-color">
                                        {faqs.map(faq => (
                                            <tr key={faq._id}>
                                                <td className="px-6 py-4 text-sm font-medium text-text-primary">{faq.question}</td>
                                                <td className="px-6 py-4 text-sm text-text-secondary line-clamp-2 max-w-md">{faq.answer}</td>
                                                <td className="px-6 py-4 text-right text-sm">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => openFaqModal(faq)} className="p-2 rounded-md hover:bg-gray-100 text-text-secondary hover:text-premier">
                                                            <PencilIcon className="h-5 w-5" />
                                                        </button>
                                                        <button onClick={() => setFaqToDelete(faq)} className="p-2 rounded-md hover:bg-gray-100 text-text-secondary hover:text-red-500">
                                                            <TrashIcon className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {faqs.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-8 text-center text-text-secondary">Aucune FAQ trouvée.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {infoError ? (
                            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 border border-red-200 text-center">
                                <p className="font-medium mb-2">{infoError}</p>
                                <p className="text-xs mb-2">Vérifiez la console pour plus de détails [DEBUG]</p>
                                <button onClick={fetchData} className="text-sm underline hover:text-red-800">Réessayer</button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg border border-border-color shadow-sm overflow-hidden">
                                <table className="min-w-full divide-y divide-border-color">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Contact (Email / Tél)</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Réseaux Sociaux</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-color">
                                        {infos.map(info => (
                                            <tr key={info._id}>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-text-primary">{info.email}</span>
                                                        <span className="text-text-secondary">{info.phone}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-text-secondary max-w-xs truncate" title={info.description}>
                                                    {info.description || 'Aucune description'}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex flex-wrap gap-2">
                                                        {info.socials && info.socials.length > 0 ? (
                                                            info.socials.map((social, idx) => (
                                                                <a 
                                                                    key={idx} 
                                                                    href={social.url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100 hover:bg-blue-100 transition-colors"
                                                                    title={social.url}
                                                                >
                                                                    {social.icon.startsWith('http') ? (
                                                                        <img src={social.icon} alt={social.title} className="w-3.5 h-3.5 object-contain" />
                                                                    ) : (
                                                                        <span>{social.icon.substring(0, 2).toUpperCase()}</span>
                                                                    )}
                                                                    <span>{social.title}</span>
                                                                </a>
                                                            ))
                                                        ) : (
                                                            <span className="text-text-secondary italic">Aucun</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => openInfoModal(info)} className="p-2 rounded-md hover:bg-gray-100 text-text-secondary hover:text-premier">
                                                            <PencilIcon className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {infos.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">Aucune info de contact trouvée.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
      </PageLayout>

      <EditFaqModal 
        isOpen={isFaqModalOpen}
        onClose={() => setIsFaqModalOpen(false)}
        onSave={handleSaveFaq}
        faq={faqToEdit}
        isLoading={isSubmitting}
      />

      <EditContactInfoModal 
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        onSave={handleSaveInfo}
        info={infoToEdit}
        isLoading={isSubmitting}
      />

      <ConfirmationModal
        isOpen={!!faqToDelete}
        onClose={() => setFaqToDelete(null)}
        onConfirm={handleDeleteFaq}
        title="Supprimer la FAQ"
        message="Êtes-vous sûr de vouloir supprimer cette question ?"
        confirmButtonText="Supprimer"
        isLoading={isSubmitting}
      />
    </>
  );
};

export default InfosPage;
