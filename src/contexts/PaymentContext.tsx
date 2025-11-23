
import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback, useContext } from 'react';
import { SavedPaymentMethod, PaymentMethod, SavedCard, SavedMobileWallet } from '../types';
import { AuthContext } from './AuthContext';

interface PaymentContextType {
  savedMethods: SavedPaymentMethod[];
  addMethod: (method: SavedPaymentMethod) => void;
  removeMethod: (methodId: string) => void;
}

export const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);

  // Load from localStorage on mount or when user changes
  useEffect(() => {
    if (!authContext?.user?.id) {
      // No user logged in, clear payment methods
      setSavedMethods([]);
      return;
    }

    try {
      const userId = authContext.user.id;
      const key = `park-eazy-payment-methods-${userId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        setSavedMethods(JSON.parse(stored));
      } else {
        setSavedMethods([]);
      }
    } catch (e) {
      console.error("Failed to load payment methods", e);
      setSavedMethods([]);
    }
  }, [authContext?.user?.id]);

  // Sync to localStorage whenever savedMethods changes
  useEffect(() => {
    if (!authContext?.user?.id) return;

    const userId = authContext.user.id;
    const key = `park-eazy-payment-methods-${userId}`;
    localStorage.setItem(key, JSON.stringify(savedMethods));
  }, [savedMethods, authContext?.user?.id]);

  const addMethod = useCallback((method: SavedPaymentMethod) => {
    setSavedMethods(currentMethods => {
      // Check for duplicates
      const isDuplicate = currentMethods.some(m => {
        if (m.type !== method.type) return false;
        if (m.type === PaymentMethod.CARD && method.type === PaymentMethod.CARD) {
          return m.last4 === (method as SavedCard).last4 &&
            m.cardholderName.toLowerCase() === (method as SavedCard).cardholderName.toLowerCase();
        }
        if (m.type !== PaymentMethod.CARD && method.type !== PaymentMethod.CARD) {
          return m.accountNumber === (method as SavedMobileWallet).accountNumber;
        }
        return false;
      });

      if (isDuplicate) return currentMethods;
      return [...currentMethods, method];
    });
  }, []);

  const removeMethod = useCallback((methodId: string) => {
    setSavedMethods(prev => prev.filter(m => m.id !== methodId));
  }, []);

  const value = useMemo(() => ({ savedMethods, addMethod, removeMethod }), [savedMethods, addMethod, removeMethod]);

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};
