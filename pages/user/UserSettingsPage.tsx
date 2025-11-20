import React, { useContext, useState } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import EditProfileForm from '../../components/profile/EditProfileForm';
import { User } from '../../types';
import Card from '../../components/common/Card';
import { User as UserIcon, Activity, CreditCard } from 'lucide-react';
import UserActivityStats from '../../components/profile/UserActivityStats';
import ManagePaymentMethods from '../../components/profile/ManagePaymentMethods';
import RecentBookings from '../../components/profile/RecentBookings';

const UserSettingsPage: React.FC = () => {
    const authContext = useContext(AuthContext);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'payment'>('profile');

    if (!authContext || !authContext.user) return <div>Loading...</div>;

    const { user, updateUser } = authContext;

    const handleSave = (updatedData: Partial<User>) => {
        updateUser(updatedData);
        alert("Profile updated successfully!");
        setIsEditing(false);
    };
    
    const TabButton: React.FC<{tabName: 'profile' | 'activity' | 'payment', label: string, icon: React.ElementType}> = ({ tabName, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold border-b-2 transition-colors duration-300 ${
                activeTab === tabName
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Profile & Settings</h1>
            
            <Card className="p-0">
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <TabButton tabName="profile" label="Edit Profile" icon={UserIcon} />
                    <TabButton tabName="activity" label="My Activity" icon={Activity} />
                    <TabButton tabName="payment" label="Payment Methods" icon={CreditCard} />
                </div>
                <div className="p-4 sm:p-6">
                    {activeTab === 'profile' && (
                        <EditProfileForm
                            user={user}
                            onSave={handleSave}
                            onCancel={() => {}} // Not really needed in this layout
                        />
                    )}
                    {activeTab === 'activity' && (
                        <>
                            <UserActivityStats />
                            <RecentBookings />
                        </>
                    )}
                    {activeTab === 'payment' && <ManagePaymentMethods />}
                </div>
            </Card>
        </div>
    );
};

export default UserSettingsPage;