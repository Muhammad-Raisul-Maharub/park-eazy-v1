import React, { useState } from 'react';
import { User } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { User as UserIcon, Mail } from 'lucide-react';

interface EditProfileFormProps {
    user: User;
    onSave: (updatedData: Partial<User>) => void;
    onCancel: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ user, onSave, onCancel }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, email });
    };

    return (
        <Card>
            <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Edit Information</h3>
            <form className="space-y-4" onSubmit={handleSave}>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <UserIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 pl-10 py-2.5 focus:border-primary focus:ring-primary sm:text-sm"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Mail className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            disabled
                            className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 pl-10 py-2.5 cursor-not-allowed sm:text-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </div>
            </form>
        </Card>
    );
};

export default EditProfileForm;
