import React, { useContext, useState } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import { ParkingSquare, BookCheck } from 'lucide-react';
import { User } from '../../types';
import UserProfileCard from '../../components/profile/UserProfileCard';
import EditProfileForm from '../../components/profile/EditProfileForm';

const AdminProfilePage: React.FC = () => {
    const authContext = useContext(AuthContext);
    const [isEditing, setIsEditing] = useState(false);

    if (!authContext || !authContext.user) return <div>Loading...</div>;

    const { user, updateUser } = authContext;

    const handleSave = (updatedData: Partial<User>) => {
        updateUser(updatedData);
        alert("Profile updated successfully!");
        setIsEditing(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Profile</h1>

            {!isEditing ? (
                <UserProfileCard 
                    user={user}
                    onEditClick={() => setIsEditing(true)}
                />
            ) : (
                <EditProfileForm
                    user={user}
                    onSave={handleSave}
                    onCancel={() => setIsEditing(false)}
                />
            )}
            
            <Card>
                <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Your Activity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatCard icon={ParkingSquare} title="Slots Managed" value="8" />
                    <StatCard icon={BookCheck} title="Reservations Overseen (Today)" value="12" />
                </div>
            </Card>
        </div>
    );
};

export default AdminProfilePage;