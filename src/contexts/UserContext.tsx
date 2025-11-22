
import React, { createContext, useState, ReactNode, useCallback, useEffect, useContext } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabaseClient';
import { AuthContext } from './AuthContext';

interface UserContextType {
    users: User[];
    addUser: (user: User) => void;
    updateUser: (user: User) => void;
    deleteUser: (userId: string) => void;
    loading: boolean;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const authContext = useContext(AuthContext);
    const currentUser = authContext?.user;

    // Fetch users when the provider mounts or user role changes
    useEffect(() => {
        const fetchUsers = async () => {
            // Only Admins and Super Admins can see the user list
            if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.SUPER_ADMIN)) {
                setUsers([]);
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('*');

                if (error) {
                    console.error('Error fetching users:', error);
                    // Don't throw, just show empty list or handle gracefully
                } else if (data) {
                    const mappedUsers: User[] = data.map(u => ({
                        id: u.user_id,
                        name: u.name || u.email?.split('@')[0] || 'Unknown',
                        email: u.email || '',
                        role: u.role as UserRole,
                    }));
                    setUsers(mappedUsers);
                }
            } catch (err) {
                console.error('Unexpected error fetching users:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [currentUser?.role, currentUser?.id]); // Re-fetch if role changes

    const addUser = useCallback((user: User) => {
        setUsers(prev => [...prev, user]);
    }, []);

    const updateUser = useCallback((user: User) => {
        setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    }, []);

    const deleteUser = useCallback((userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
    }, []);

    return (
        <UserContext.Provider value={{ users, addUser, updateUser, deleteUser, loading }}>
            {children}
        </UserContext.Provider>
    );
};
