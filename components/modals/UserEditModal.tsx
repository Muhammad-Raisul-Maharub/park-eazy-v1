import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../../types';
import Button from '../common/Button';
import { X } from 'lucide-react';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  user: Partial<User> | null;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ isOpen, onClose, onSave, user }) => {
  const [formData, setFormData] = useState<Partial<User>>({});
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setFormData(user);
    } else {
      // Defaults for a new user
      setFormData({ role: UserRole.USER });
    }
  }, [user, isOpen]);
  
  // Accessibility: Handle Escape key to close modal
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

  // Accessibility: Focus trapping
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.email || !formData.role) {
      alert("Please fill all fields.");
      return;
    }
    // In a real app, a new user would get a proper ID from the backend.
    const userToSave: User = {
        id: formData.id || `user-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: formData.role,
    };
    onSave(userToSave);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="user-modal-title" ref={modalRef}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 id="user-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">{user?.id ? 'Edit' : 'Add'} User</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close modal"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label htmlFor="user-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
            <input
              id="user-name"
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              className="mt-1 w-full p-2.5 bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="user-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
            <input
              id="user-email"
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="mt-1 w-full p-2.5 bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="user-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
            <select
              id="user-role"
              name="role"
              value={formData.role || ''}
              onChange={handleChange}
              className="mt-1 w-full p-2.5 bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary"
            >
              {Object.values(UserRole).map(role => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save User</Button>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;