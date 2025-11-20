
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { SystemLog } from '../types';
import { mockSystemLogs } from '../data/mockData';
import { AuthContext } from './AuthContext';

interface LogContextType {
  logs: SystemLog[];
  addLog: (action: string, details: string) => void;
}

export const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<SystemLog[]>(mockSystemLogs);
  const authContext = useContext(AuthContext);

  const addLog = useCallback((action: string, details: string) => {
    const currentUser = authContext?.user;
    
    const newLog: SystemLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date(),
      userId: currentUser ? currentUser.id : 'system',
      action: action,
      details: details,
    };

    setLogs(prevLogs => [newLog, ...prevLogs]);
  }, [authContext]);

  return (
    <LogContext.Provider value={{ logs, addLog }}>
      {children}
    </LogContext.Provider>
  );
};
