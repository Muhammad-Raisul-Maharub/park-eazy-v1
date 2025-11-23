
import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback, useContext } from 'react';
import { SavedPaymentMethod, PaymentMethod, SavedCard, SavedMobileWallet } from '../types';
import { AuthContext } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

interface PaymentContextType {
  savedMethods: SavedPaymentMethod[];
  addMethod: (method: SavedPaymentMethod) => Promise<void>;
  removeMethod: (methodId: string) => Promise<void>;
  loading: boolean;
}

export const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch payment methods from database
  const fetchPaymentMethods = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('saved_payment_methods')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching payment methods:', error);
        return [];
      }

      // Transform database rows to SavedPaymentMethod format
      return (data || []).map(row => ({
        id: row.id,
        type: row.type as PaymentMethod,
        ...(row.type === PaymentMethod.CARD ? {
          cardholderName: row.cardholder_name,
          last4: row.last4,
          expiryDate: row.expiry_date,
        } : {
          accountNumber: row.account_number,
        })
      })) as SavedPaymentMethod[];
    } catch (err) {
      console.error('Unexpected error fetching payment methods:', err);
      return [];
    }
  }, []);

  // Migrate existing localStorage data to database (one-time)
  const migrateLocalStorage = useCallback(async (userId: string) => {
    try {
      const oldKey = `park-eazy-payment-methods-${userId}`;
      const stored = localStorage.getItem(oldKey);

      if (!stored) return;

      const localMethods: SavedPaymentMethod[] = JSON.parse(stored);

      // Upload each method to database
      for (const method of localMethods) {
        const row = {
          id: method.id,
          user_id: userId,
          type: method.type,
          cardholder_name: method.type === PaymentMethod.CARD ? (method as SavedCard).cardholderName : null,
          last4: method.type === PaymentMethod.CARD ? (method as SavedCard).last4 : null,
          expiry_date: method.type === PaymentMethod.CARD ? (method as SavedCard).expiryDate : null,
          account_number: method.type !== PaymentMethod.CARD ? (method as SavedMobileWallet).accountNumber : null,
        };

        await supabase.from('saved_payment_methods').upsert(row);
      }

      // Clear old localStorage after successful migration
      localStorage.removeItem(oldKey);
      console.log('✅ Migrated payment methods from localStorage to database');
    } catch (err) {
      console.error('Migration error:', err);
    }
  }, []);

  // Load payment methods when user changes
  useEffect(() => {
    const loadMethods = async () => {
      if (!authContext?.user?.id) {
        setSavedMethods([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const userId = authContext.user.id;

      // Try to migrate localStorage first
      await migrateLocalStorage(userId);

      // Fetch from database
      const methods = await fetchPaymentMethods(userId);
      setSavedMethods(methods);
      setLoading(false);
    };

    loadMethods();
  }, [authContext?.user?.id, fetchPaymentMethods, migrateLocalStorage]);

  // Add payment method to database
  const addMethod = useCallback(async (method: SavedPaymentMethod) => {
    if (!authContext?.user?.id) return;

    const userId = authContext.user.id;

    // Transform to database format
    const row = {
      id: method.id,
      user_id: userId,
      type: method.type,
      cardholder_name: method.type === PaymentMethod.CARD ? (method as SavedCard).cardholderName : null,
      last4: method.type === PaymentMethod.CARD ? (method as SavedCard).last4 : null,
      expiry_date: method.type === PaymentMethod.CARD ? (method as SavedCard).expiryDate : null,
      account_number: method.type !== PaymentMethod.CARD ? (method as SavedMobileWallet).accountNumber : null,
    };

    try {
      const { error } = await supabase
        .from('saved_payment_methods')
        .insert(row);

      if (error) {
        console.error('Error adding payment method:', error);
        return;
      }

      // Update local state
      setSavedMethods(prev => [...prev, method]);
    } catch (err) {
      console.error('Unexpected error adding payment method:', err);
    }
  }, [authContext?.user?.id]);

  // Remove payment method from database
  const removeMethod = useCallback(async (methodId: string) => {
    if (!authContext?.user?.id) return;

    try {
      const { error } = await supabase
        .from('saved_payment_methods')
        .delete()
        .eq('id', methodId)
        .eq('user_id', authContext.user.id); // Security: ensure user owns this method

      if (error) {
        console.error('Error removing payment method:', error);
        return;
      }

      // Update local state
      setSavedMethods(prev => prev.filter(m => m.id !== methodId));
    } catch (err) {
      console.error('Unexpected error removing payment method:', err);
    }
  }, [authContext?.user?.id]);

  const value = useMemo(
    () => ({ savedMethods, addMethod, removeMethod, loading }),
    [savedMethods, addMethod, removeMethod, loading]
  );

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};
