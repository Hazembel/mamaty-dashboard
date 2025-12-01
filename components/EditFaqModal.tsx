
import React, { useState, useEffect, FormEvent } from 'react';
import { FAQ } from '../types';
import { XIcon } from './icons';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (faq: Partial<FAQ>) => Promise<void>;
  faq: FAQ | null;
  isLoading?: boolean;
}

const EditFaqModal: React.FC<FaqModalProps> = ({ isOpen, onClose, onSave, faq, isLoading }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  
  const isEditMode = !!faq;

  useEffect(() => {
    if (isOpen) {
        setError('');
        if (faq) {
            setQuestion(faq.question);
            setAnswer(faq.answer);
        } else {
            setQuestion('');
            setAnswer('');
        }
    }
  }, [isOpen, faq]);

  const handleInvalid = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    (e.target as HTMLInputElement).setCustomValidity("Veuillez remplir ce champ.");
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    (e.target as HTMLInputElement).setCustomValidity('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!question.trim() || !answer.trim()) {
        setError('Tous les champs sont requis.');
        return;
    }

    try {
      await onSave({ question, answer });
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
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg transform transition-all">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-semibold text-text-primary">
                {isEditMode ? "Modifier la FAQ" : "Ajouter une FAQ"}
              </h3>
              <button type="button" onClick={onClose} className="p-1 rounded-full text-text-secondary hover:bg-gray-100">
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="question" className="block text-sm font-medium text-text-secondary mb-1">Question</label>
                <input 
                    required 
                    type="text" 
                    id="question" 
                    value={question} 
                    onChange={(e) => setQuestion(e.target.value)}
                    onInvalid={handleInvalid}
                    onInput={handleInput} 
                    className={inputBaseClass} 
                    placeholder="Posez une question..." 
                />
              </div>
              
              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-text-secondary mb-1">Réponse</label>
                <textarea 
                    required 
                    id="answer" 
                    rows={4} 
                    value={answer} 
                    onChange={(e) => setAnswer(e.target.value)}
                    onInvalid={handleInvalid}
                    onInput={handleInput} 
                    className={inputBaseClass} 
                    placeholder="Votre réponse ici..." 
                />
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
          </div>
          
           <div className="px-6 py-4 flex flex-row-reverse items-center gap-3 border-t border-border-color bg-gray-50 rounded-b-lg">
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

export default EditFaqModal;
