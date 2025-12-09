
import React, { useState, useContext } from 'react';
import Card from '../../components/common/Card';
import { User, UserRole } from '../../types';
import { UserMinus, Edit, PlusCircle, Shield } from 'lucide-react';
import Button from '../../components/common/Button';
import UserEditModal from '../../components/modals/UserEditModal';
import { LogContext } from '../../contexts/LogContext';
import { UserContext } from '../../contexts/UserContext';

const ManageAdminsPage: React.FC = () => {
    const userContext = useContext(UserContext);
    const logContext = useContext(LogContext);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Partial<User> | null>(null);

    if (!userContext) return <div>Loading...</div>;
    const { users, addUser, updateUser } = userContext;

    const admins = users.filter(user => user.role === UserRole.ADMIN);

    const handleAddAdmin = () => {
        // Pre-fill role as ADMIN for new user
        setSelectedUser({ role: UserRole.ADMIN });
        setIsModalOpen(true);
    };

    const handleEditAdmin = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleDemoteAdmin = (admin: User) => {
        if (window.confirm(`Are you sure you want to demote ${admin.name} to a regular user?`)) {
            updateUser({ ...admin, role: UserRole.USER });
            logContext?.addLog('ROLE_DEMOTION', `Demoted admin ${admin.name} to User`);
        }
    };

    const handleSaveUser = (userData: User) => {
        const existingUser = users.find(u => u.id === userData.id);

        if (existingUser) {
            updateUser(userData);
            logContext?.addLog('ADMIN_UPDATE', `Updated admin details for ${userData.name}`);
        } else {
            const newUser = { ...userData, id: userData.id || `admin-${Date.now()}` };
            addUser(newUser);
            logContext?.addLog('ADMIN_CREATED', `Created new admin ${newUser.name}`);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Admins</h1>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Name</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Email</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map((admin: User) => (
                                <tr key={admin.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-primary/10">
                                                <Shield className="w-5 h-5 text-primary" />
                                            </div>
                                            <span className="font-medium text-slate-800 dark:text-slate-100">{admin.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-500 dark:text-slate-400 max-w-[150px] sm:max-w-xs truncate" title={admin.email}>{admin.email}</td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleEditAdmin(admin)} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors" aria-label={`Edit admin ${admin.name}`}><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDemoteAdmin(admin)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors" aria-label={`Demote admin ${admin.name}`}><UserMinus className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
        </div>
    );
};

export default ManageAdminsPage;
