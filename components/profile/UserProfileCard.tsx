import React from 'react';
import { User, UserRole } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { User as UserIcon, Shield, Edit } from 'lucide-react';

interface UserProfileCardProps {
  user: User;
  onEditClick: () => void;
}

const roleUI = {
    [UserRole.USER]: { name: 'User', icon: UserIcon, color: 'primary', badgeBg: 'bg-primary/10' },
    [UserRole.ADMIN]: { name: 'Administrator', icon: UserIcon, color: 'primary', badgeBg: 'bg-primary/10' },
    [UserRole.SUPER_ADMIN]: { name: 'Super Administrator', icon: Shield, color: 'yellow-500', badgeBg: 'bg-yellow-500/10' },
};

const roleStyles = {
    [UserRole.USER]: {
        borderColor: 'border-primary',
        textColor: 'text-primary',
        badgeBg: 'bg-primary/10'
    },
    [UserRole.ADMIN]: {
        borderColor: 'border-primary',
        textColor: 'text-primary',
        badgeBg: 'bg-primary/10'
    },
    [UserRole.SUPER_ADMIN]: {
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-500',
        badgeBg: 'bg-yellow-500/10'
    }
};

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user, onEditClick }) => {
    const roleDetails = roleUI[user.role] || roleUI[UserRole.USER];
    const styles = roleStyles[user.role] || roleStyles[UserRole.USER];
    const { name, icon: Icon } = roleDetails;

    return (
        <Card>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className={`w-24 h-24 rounded-full border-4 ${styles.borderColor} ${styles.badgeBg} flex items-center justify-center`}>
                    <Icon className={`w-12 h-12 ${styles.textColor}`} />
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
                    <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
                    <span className={`mt-2 inline-block px-3 py-1 text-sm font-semibold rounded-full ${styles.badgeBg} ${styles.textColor}`}>
                        {name}
                    </span>
                </div>
                <Button onClick={onEditClick}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                </Button>
            </div>
        </Card>
    );
};

export default UserProfileCard;