import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 3;
    const ellipsis = <li key="ellipsis" className="px-3 py-1 text-slate-500">...</li>;

    if (totalPages <= maxPagesToShow + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <li key={i}>
            <button
              onClick={() => handlePageClick(i)}
              className={`px-3 py-1 rounded-md transition-colors text-sm font-medium ${
                currentPage === i
                  ? 'bg-primary text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
               aria-current={currentPage === i ? 'page' : undefined}
            >
              {i}
            </button>
          </li>
        );
      }
    } else {
      pageNumbers.push(
        <li key={1}>
          <button
            onClick={() => handlePageClick(1)}
            className={`px-3 py-1 rounded-md transition-colors text-sm font-medium ${
              currentPage === 1 ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            1
          </button>
        </li>
      );

      if (currentPage > 3) {
        pageNumbers.push(ellipsis);
      }

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      if(currentPage <= 2) {
        startPage = 2;
        endPage = startPage + maxPagesToShow - 1;
      }
      if(currentPage >= totalPages - 1) {
          startPage = totalPages - maxPagesToShow;
          endPage = totalPages - 1;
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <li key={i}>
            <button
              onClick={() => handlePageClick(i)}
              className={`px-3 py-1 rounded-md transition-colors text-sm font-medium ${
                currentPage === i ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
               aria-current={currentPage === i ? 'page' : undefined}
            >
              {i}
            </button>
          </li>
        );
      }

      if (currentPage < totalPages - 2) {
        pageNumbers.push(ellipsis);
      }

      pageNumbers.push(
        <li key={totalPages}>
          <button
            onClick={() => handlePageClick(totalPages)}
            className={`px-3 py-1 rounded-md transition-colors text-sm font-medium ${
              currentPage === totalPages ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {totalPages}
          </button>
        </li>
      );
    }

    return pageNumbers;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-0">
        Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{startItem}</span> to <span className="font-semibold text-slate-700 dark:text-slate-200">{endItem}</span> of <span className="font-semibold text-slate-700 dark:text-slate-200">{totalItems}</span> results
      </p>
      <nav aria-label="Pagination">
        <ul className="flex items-center space-x-1">
          <li>
            <button
              onClick={() => handlePageClick(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Previous</span>
            </button>
          </li>
          {renderPageNumbers()}
          <li>
            <button
              onClick={() => handlePageClick(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <span className="text-sm font-medium">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;
