import React from 'react';
import { XIcon } from './icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirmer',
  cancelButtonText = 'Annuler',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-medium leading-6 text-text-primary">{title}</h3>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-2">
            <p className="text-sm text-text-secondary">{message}</p>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3 rounded-b-lg">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm disabled:opacity-50"
          >
            {isLoading ? 'Suppression...' : confirmButtonText}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex justify-center rounded-md border border-border-color shadow-sm px-4 py-2 bg-white text-base font-medium text-text-primary hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-premier sm:text-sm disabled:opacity-50"
          >
            {cancelButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;