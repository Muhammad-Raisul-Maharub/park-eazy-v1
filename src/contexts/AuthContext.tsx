
import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for a logged-in user in local storage
    try {
      const storedUser = localStorage.getItem('park-eazy-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('park-eazy-user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string): Promise<void> => {
    setLoading(true);
    // Simulate API call
    await new Promise(res => setTimeout(res, 500));
    
    const lowercasedEmail = email.toLowerCase();
    
    // Prioritize exact email match (case-insensitive)
    let foundUser: User | undefined = mockUsers.find(u => u.email.toLowerCase() === lowercasedEmail);
    
    // Fallback to demo logic if no exact match is found
    if (!foundUser) {
        if (lowercasedEmail.startsWith('user')) {
          foundUser = mockUsers.find(u => u.role === UserRole.USER);
        } else if (lowercasedEmail.startsWith('admin')) {
          foundUser = mockUsers.find(u => u.role === UserRole.ADMIN);
        } else if (lowercasedEmail.startsWith('superadmin')) {
          foundUser = mockUsers.find(u => u.role === UserRole.SUPER_ADMIN);
        }
    }
    
    if (foundUser) {
      // Always use the provided email for login session, but keep the found user's other details
      const userToLogin = {...foundUser, email};
      setUser(userToLogin);
      localStorage.setItem('park-eazy-user', JSON.stringify(userToLogin));
    } else {
        setLoading(false);
        throw new Error('User not found');
    }
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('park-eazy-user');
  }, []);
  
  const updateUser = useCallback((updatedData: Partial<User>) => {
    setUser(currentUser => {
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updatedData };
        localStorage.setItem('park-eazy-user', JSON.stringify(updatedUser));
        return updatedUser;
      }
      return null;
    });
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout, updateUser }), [user, loading, login, logout, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
