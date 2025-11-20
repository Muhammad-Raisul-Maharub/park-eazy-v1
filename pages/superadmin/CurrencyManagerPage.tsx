import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { DollarSign, Edit } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const initialRates = {
  USD: 117.50,
  EUR: 127.80,
  GBP: 149.25,
  INR: 1.41,
};

const CurrencyManagerPage: React.FC = () => {
    const [rates, setRates] = useState(initialRates);
    const [editMode, setEditMode] = useState(false);
    const [tempRates, setTempRates] = useState(initialRates);
    
    const handleRateChange = (currency: keyof typeof initialRates, value: string) => {
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
            setTempRates(prev => ({ ...prev, [currency]: numericValue }));
        }
    };

    const handleSave = () => {
        setRates(tempRates);
        setEditMode(false);
        alert("Exchange rates updated successfully!");
    };

    const handleCancel = () => {
        setTempRates(rates);
        setEditMode(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Currency Manager</h1>
                {!editMode && <Button onClick={() => setEditMode(true)}><Edit className="w-4 h-4 mr-2" /> Change Rates</Button>}
            </div>
            
            <Card>
                <div className="flex items-center p-4 rounded-t-lg bg-primary/10 dark:bg-primary/20 border-b-2 border-primary">
                    <DollarSign className="w-8 h-8 text-primary" />
                    <div className="ml-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Base Currency</h2>
                        <p className="font-bold text-primary text-xl">BDT (Bangladeshi Taka)</p>
                    </div>
                </div>

                <div className="p-4">
                    <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">Exchange Rates (1 Foreign Currency to BDT)</h3>
                    <div className="space-y-3">
                        {Object.entries(tempRates).map(([currency, rate]) => (
                            <div key={currency} className="flex items-center justify-between">
                                <label htmlFor={`rate-input-${currency}`} className="font-medium">{currency}</label>
                                {editMode ? (
                                    <input 
                                        id={`rate-input-${currency}`}
                                        type="number" 
                                        step="0.01"
                                        value={rate}
                                        onChange={(e) => handleRateChange(currency as keyof typeof initialRates, e.target.value)}
                                        className="w-32 p-1.5 text-right font-mono bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md"
                                    />
                                ) : (
                                    <span className="font-semibold font-mono">{formatCurrency(Number(rate))}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {editMode && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                        <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
                        <Button onClick={handleSave}>Update Rates</Button>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default CurrencyManagerPage;