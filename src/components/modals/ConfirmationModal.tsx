import React, { useEffect, useRef } from 'react';
import Button from '../common/Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmButtonText?: string;
  confirmButtonVariant?: 'primary' | 'secondary' | 'danger';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirm',
  confirmButtonVariant = 'danger',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    };
    if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        firstElement?.focus();

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };
        
        const currentModalRef = modalRef.current;
        currentModalRef.addEventListener('keydown', handleTabKey);

        return () => {
            currentModalRef?.removeEventListener('keydown', handleTabKey);
        };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 animate-fadeIn duration-200" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" ref={modalRef}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md animate-slideUp duration-300">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${confirmButtonVariant === 'danger' ? 'bg-red-100 dark:bg-red-900/50' : 'bg-primary/10'} sm:mx-0 sm:h-10 sm:w-10`}>
              <AlertTriangle className={`${confirmButtonVariant === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-primary'} h-6 w-6`} aria-hidden="true" />
            </div>
            <div className="mt-0 text-center sm:text-left flex-1">
              <h3 id="confirm-modal-title" className="text-lg leading-6 font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {message}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={confirmButtonVariant} onClick={onConfirm}>
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;