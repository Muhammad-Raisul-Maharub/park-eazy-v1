
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
        const fetchWithTimeout = async (promise: Promise<any>, timeoutMs = 12000) => {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database query timeout')), timeoutMs)
            );
            return Promise.race([promise, timeoutPromise]);
        };

        const fetchUsers = async () => {
            // Only Admins and Super Admins can see the user list
            if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.SUPER_ADMIN)) {
                setUsers([]);
                return;
            }

            const MAX_RETRIES = 2;
            setLoading(true);

            for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                try {
                    const timeout = 12000 * Math.pow(1.5, attempt);

                    const queryPromise = supabase
                        .from('user_profiles')
                        .select('*');

                    const { data, error } = await fetchWithTimeout(queryPromise, timeout) as any;

                    if (error) {
                        throw error;
                    }

                    if (data) {
                        const mappedUsers: User[] = data.map(u => ({
                            id: u.user_id,
                            name: u.name || u.email?.split('@')[0] || 'Unknown',
                            email: u.email || '',
                            role: u.role as UserRole,
                        }));
                        setUsers(mappedUsers);
                    }

                    // Success - exit retry loop
                    break;
                } catch (err: any) {
                    console.error(`[DB] Fetch users failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, err);

                    if (attempt === MAX_RETRIES) {
                        // Final attempt failed
                        console.error('[DB] All retry attempts failed for users, using empty state');
                        setUsers([]);
                    } else {
                        // Wait before retry with exponential backoff
                        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
                    }
                }
            }

            setLoading(false);
        };

        fetchUsers();
    }, [currentUser?.role, currentUser?.id]); // Re-fetch if role changes

    const addUser = useCallback((user: User) => {
        setUsers(prev => [...prev, user]);
    }, []);

    const updateUser = useCallback(async (user: User) => {
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ role: user.role }) // Only update role for now as per requirements
                .eq('user_id', user.id);

            if (error) throw error;

            setUsers(prev => prev.map(u => u.id === user.id ? user : u));
        } catch (error) {
            console.error('Failed to update user role:', error);
            alert('Failed to update user role. Please try again.');
        }
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
