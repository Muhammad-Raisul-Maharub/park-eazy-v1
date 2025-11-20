import React, { useContext, useState } from 'react';
import { PaymentContext } from '../../contexts/PaymentContext';
import Button from '../common/Button';
import { CreditCard, Trash2, PlusCircle } from 'lucide-react';
import { PaymentMethod, SavedCard, SavedMobileWallet } from '../../types';
import { BkashIcon, NagadIcon, RocketIcon } from '../common/PaymentIcons';

const ManagePaymentMethods: React.FC = () => {
    const paymentContext = useContext(PaymentContext);
    const [showAddForm, setShowAddForm] = useState(false);
    const [addMethodType, setAddMethodType] = useState<PaymentMethod>(PaymentMethod.CARD);
    const [newCard, setNewCard] = useState({ name: '', number: '', expiry: '', cvc: '' });
    const [newMobileWallet, setNewMobileWallet] = useState({ accountNumber: '' });

    if (!paymentContext) {
        return <div>Loading payment context...</div>;
    }

    const { savedMethods, addMethod, removeMethod } = paymentContext;

    const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;
        if (name === 'number') {
            formattedValue = value.replace(/[^\d]/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
        } else if (name === 'expiry') {
            formattedValue = value.replace(/[^\d/]/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
        } else if (name === 'cvc') {
            formattedValue = value.replace(/[^\d]/g, '').slice(0, 4);
        }
        setNewCard(prev => ({ ...prev, [name]: formattedValue }));
    };
    
    const handleMobileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const formattedValue = value.replace(/[^\d]/g, '').slice(0, 11);
        setNewMobileWallet(prev => ({ ...prev, [name]: formattedValue }));
    };

    const handleAddMethod = (e: React.FormEvent) => {
        e.preventDefault();
        
        if(addMethodType === PaymentMethod.CARD) {
            const cardNumber = newCard.number.replace(/\s/g, '');
            const expiryParts = newCard.expiry.split('/');
            const expMonth = parseInt(expiryParts[0], 10);
            const expYear = parseInt(expiryParts[1], 10);
            const currentYear = new Date().getFullYear() % 100;
            const currentMonth = new Date().getMonth() + 1;
            const isExpiryValid = expiryParts.length === 2 && expMonth >= 1 && expMonth <= 12 && (expYear > currentYear || (expYear === currentYear && expMonth >= currentMonth));
            
            if (!newCard.name.trim() || cardNumber.length !== 16 || !isExpiryValid || !/^\d{3,4}$/.test(newCard.cvc)) {
                alert('Please fill all card details correctly.');
                return;
            }
            addMethod({
                id: `card-${Date.now()}`, type: PaymentMethod.CARD,
                cardholderName: newCard.name, last4: cardNumber.slice(-4), expiryDate: newCard.expiry,
            });
        } else {
             if (!/^01[3-9]\d{8}$/.test(newMobileWallet.accountNumber)) {
                alert('Please enter a valid 11-digit account number.');
                return;
            }
            addMethod({
                id: `${addMethodType}-${Date.now()}`, type: addMethodType,
                accountNumber: newMobileWallet.accountNumber
            });
        }

        setNewCard({ name: '', number: '', expiry: '', cvc: '' });
        setNewMobileWallet({ accountNumber: '' });
        setShowAddForm(false);
    };
    
    const PaymentMethodIcon: React.FC<{ type: PaymentMethod }> = ({ type }) => {
        switch (type) {
            case PaymentMethod.CARD: return <CreditCard className="w-6 h-6 text-slate-500" />;
            case PaymentMethod.BKASH: return <BkashIcon />;
            case PaymentMethod.NAGAD: return <NagadIcon />;
            case PaymentMethod.ROCKET: return <RocketIcon />;
            default: return <CreditCard className="w-6 h-6 text-slate-500" />;
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Saved Payment Methods</h3>
            <div className="space-y-3">
                {savedMethods.length > 0 ? (
                    savedMethods.map(method => (
                        <div key={method.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <PaymentMethodIcon type={method.type} />
                                <div>
                                    {method.type === 'Card' ? (
                                        <>
                                            <p className="font-semibold text-slate-800 dark:text-slate-100">{(method as SavedCard).cardholderName}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">**** **** **** {(method as SavedCard).last4} &bull; Exp: {(method as SavedCard).expiryDate}</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-semibold text-slate-800 dark:text-slate-100">{method.type}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">*******{(method as SavedMobileWallet).accountNumber.slice(-4)}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => removeMethod(method.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full" aria-label={`Remove method`}>
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-slate-500 text-center py-4">You have no saved payment methods.</p>
                )}
            </div>

            {showAddForm ? (
                <form onSubmit={handleAddMethod} className="mt-6 p-4 border-t border-slate-200 dark:border-slate-700 space-y-4 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">Add a New Method</h4>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Payment Type</label>
                        <select value={addMethodType} onChange={e => setAddMethodType(e.target.value as PaymentMethod)} className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg">
                            <option value={PaymentMethod.CARD}>Card</option>
                            <option value={PaymentMethod.BKASH}>bKash</option>
                            <option value={PaymentMethod.NAGAD}>Nagad</option>
                            <option value={PaymentMethod.ROCKET}>Rocket</option>
                        </select>
                    </div>

                    {addMethodType === PaymentMethod.CARD ? (
                        <div className="space-y-4">
                             <div><label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Card Number</label><input type="text" name="number" value={newCard.number} onChange={handleCardInputChange} placeholder="•••• •••• •••• ••••" maxLength={19} className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" required/></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Expiry Date</label><input type="text" name="expiry" value={newCard.expiry} onChange={handleCardInputChange} placeholder="MM/YY" maxLength={5} className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" required/></div>
                                <div><label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">CVC</label><input type="text" name="cvc" value={newCard.cvc} onChange={handleCardInputChange} placeholder="CVC" maxLength={4} className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" required/></div>
                            </div>
                            <div><label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Name on Card</label><input type="text" name="name" value={newCard.name} onChange={handleCardInputChange} placeholder="Name on Card" maxLength={64} className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" required/></div>
                        </div>
                    ) : (
                        <div>
                             <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{addMethodType} Account Number</label>
                             <input type="tel" name="accountNumber" value={newMobileWallet.accountNumber} onChange={handleMobileInputChange} placeholder="e.g., 01xxxxxxxxx" maxLength={11} className="w-full p-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" required/>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Button>
                        <Button type="submit">Save Method</Button>
                    </div>
                </form>
            ) : (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                     <Button variant="secondary" onClick={() => setShowAddForm(true)} className="w-full">
                        <PlusCircle className="w-4 h-4 mr-2"/>
                        Add New Payment Method
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ManagePaymentMethods;