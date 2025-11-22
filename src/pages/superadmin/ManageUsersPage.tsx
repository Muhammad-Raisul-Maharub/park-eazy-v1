
import React, { useState, useMemo, useContext } from 'react';
import Card from '../../components/common/Card';
import { User, UserRole } from '../../types';
import { Trash2, Edit, PlusCircle, Shield, User as UserIcon, Star, Filter } from 'lucide-react';
import Button from '../../components/common/Button';
import UserEditModal from '../../components/modals/UserEditModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { LogContext } from '../../contexts/LogContext';
import { UserContext } from '../../contexts/UserContext';


const ManageUsersPage: React.FC = () => {
    const userContext = useContext(UserContext);
    const logContext = useContext(LogContext);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Partial<User> | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

    if (!userContext) {
        return <div>Loading users...</div>;
    }
    
    const { users, addUser, updateUser, deleteUser } = userContext;

    const handleAddUser = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = (user: User) => {
       setUserToDelete(user);
       setIsConfirmModalOpen(true);
    };
    
    const confirmDelete = () => {
        if (userToDelete) {
            deleteUser(userToDelete.id);
            logContext?.addLog('USER_DELETED', `Deleted user ${userToDelete.name} (${userToDelete.email})`);
            setUserToDelete(null);
        }
        setIsConfirmModalOpen(false);
    }
    
    const handleSaveUser = (userData: User) => {
        // Strict check: does this user ID exist in the current state?
        const existingUser = users.find(u => u.id === userData.id);

        if (existingUser) {
             // Update existing user using context
             updateUser(userData);
             
             // Detailed logging for role change
             if (existingUser.role !== userData.role) {
                 logContext?.addLog('ROLE_UPDATE', `Changed role for ${userData.name} from ${existingUser.role} to ${userData.role}`);
             } else {
                 logContext?.addLog('USER_UPDATE', `Updated details for user ${userData.name}`);
             }
        } else {
            // Create new user
            const newUser = { ...userData, id: userData.id || `user-${Date.now()}` };
            addUser(newUser);
            logContext?.addLog('USER_CREATED', `Created new user ${newUser.name} with role ${newUser.role}`);
        }
        setIsModalOpen(false);
    };

    const roleUI = {
        [UserRole.USER]: { icon: UserIcon, color: 'text-blue-500', label: 'User' },
        [UserRole.ADMIN]: { icon: Shield, color: 'text-primary', label: 'Admin' },
        [UserRole.SUPER_ADMIN]: { icon: Star, color: 'text-yellow-500', label: 'Super Admin' },
    };

    const filteredUsers = useMemo(() => {
        if (roleFilter === 'all') return users;
        return users.filter(user => user.role === roleFilter);
    }, [users, roleFilter]);

    const filterOptions: { value: UserRole | 'all', label: string }[] = [
        { value: 'all', label: 'All Roles' },
        { value: UserRole.USER, label: 'Users' },
        { value: UserRole.ADMIN, label: 'Admins' },
        { value: UserRole.SUPER_ADMIN, label: 'Super Admins' },
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage All Users</h1>
                <Button onClick={handleAddUser}>
                    <PlusCircle className="w-5 h-5 mr-2"/>
                    Add New User
                </Button>
            </div>
            <Card>
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="w-5 h-5 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Filter by role:</span>
                        {filterOptions.map(option => (
                             <button 
                                key={option.value} 
                                onClick={() => setRoleFilter(option.value)}
                                className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${roleFilter === option.value ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                             >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Name</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Email</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Role</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user: User) => {
                                const { icon: Icon, color, label } = roleUI[user.role];
                                return (
                                <tr key={user.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-700`}>
                                                <Icon className={`w-5 h-5 ${color}`} />
                                            </div>
                                            <span className="font-medium text-slate-800 dark:text-slate-100">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-500 dark:text-slate-400 max-w-[150px] sm:max-w-xs truncate" title={user.email}>{user.email}</td>
                                    <td className="p-4">
                                        <div className={`inline-flex items-center gap-2 ${color} bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full`}>
                                            <Icon className="w-4 h-4" />
                                            <span className="font-semibold text-xs">{label}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleEditUser(user)} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors" aria-label={`Edit user ${user.name}`}><Edit className="w-4 h-4" /></button>
                                            {user.role !== UserRole.SUPER_ADMIN && (
                                                <button onClick={() => handleDeleteUser(user)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors" aria-label={`Delete user ${user.name}`}><Trash2 className="w-4 h-4" /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </Card>
            <UserEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveUser}
                user={selectedUser}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete User"
                message={<>Are you sure you want to delete <strong>{userToDelete?.name}</strong>? This action cannot be undone.</>}
                confirmButtonText="Delete User"
                confirmButtonVariant="danger"
            />
        </div>
    );
};

export default ManageUsersPage;
