
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  if (totalItems === 0) {
      return (
        <div className="flex items-center justify-center px-6 py-4 border-t border-border-color">
            <p className="text-sm text-text-secondary">Aucun résultat trouvé.</p>
        </div>
      );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 px-6 py-3 border-t border-border-color">
      <p className="text-sm text-text-secondary text-center sm:text-left">
        Montrant <span className="font-medium text-text-primary">{startItem}</span> à <span className="font-medium text-text-primary">{endItem}</span> sur <span className="font-medium text-text-primary">{totalItems}</span> résultats
      </p>
      <div className="inline-flex items-center -space-x-px">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="px-3 py-2 leading-tight text-text-secondary bg-white border border-border-color rounded-l-lg hover:bg-gray-100 hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Précédent
        </button>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="px-3 py-2 leading-tight text-text-secondary bg-white border border-border-color rounded-r-lg hover:bg-gray-100 hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default Pagination;