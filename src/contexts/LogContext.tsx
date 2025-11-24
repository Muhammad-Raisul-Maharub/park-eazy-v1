
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { SystemLog, UserRole } from '../types';
import { AuthContext } from './AuthContext';
import { supabase } from '../lib/supabaseClient';
import { ToastContainer, ToastMessage, ToastType } from '../components/common/Toast';

interface LogContextType {
  logs: SystemLog[]; // Kept for compatibility, but mainly fetched in SystemLogsPage
  addLog: (action: string, details: string, type?: ToastType, metadata?: any) => Promise<void>;
  addToast: (message: string, type: ToastType) => void;
}

export const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<SystemLog[]>([]); // Local state for immediate UI feedback if needed
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const authContext = useContext(AuthContext);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const addLog = useCallback(async (action: string, details: string, type: ToastType = 'info', metadata: any = {}) => {
    const currentUser = authContext?.user;
    const userId = currentUser ? currentUser.id : null;
    const userRole = currentUser ? currentUser.role : 'system';

    // 1. Insert into Supabase (Backend)
    try {
      if (userId) { // Only log to DB if authenticated (RLS requirement)
        const { error } = await supabase.from('system_logs').insert({
          actor_id: userId,
          actor_role: userRole,
          action_type: action,
          details: details,
          metadata: metadata
        });
        if (error) console.error('Failed to log to Supabase:', error);
      }
    } catch (err) {
      console.error('Logging error:', err);
    }

    // 2. Trigger Notification (Frontend) based on Role Logic
    // Users: Personal actions
    // Admins: Slot actions
    // Super Admins: All actions

    let shouldNotify = false;

    if (userRole === UserRole.USER) {
      // Users only see their own relevant actions
      if (['RESERVATION_CREATED', 'RESERVATION_EXTENDED', 'RESERVATION_ENDED', 'PAYMENT_METHOD_SAVED', 'LOGIN_SUCCESS'].includes(action)) {
        shouldNotify = true;
      }
    } else if (userRole === UserRole.ADMIN) {
      // Admins see slot actions
      if (['SLOT_CREATED', 'SLOT_UPDATED', 'SLOT_DELETED'].includes(action)) {
        shouldNotify = true;
      }
    } else if (userRole === UserRole.SUPER_ADMIN) {
      // Super Admins see everything
      shouldNotify = true;
    }

    if (shouldNotify) {
      addToast(details, type);
    }

  }, [authContext, addToast]);

  return (
    <LogContext.Provider value={{ logs, addLog, addToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </LogContext.Provider>
  );
};
