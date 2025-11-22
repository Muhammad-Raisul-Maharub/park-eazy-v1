import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Reservation, ParkingSlot } from '../../types';
import Button from '../common/Button';
import { X, Clock, CircleDollarSign, Plus, Minus } from 'lucide-react';

interface ExtendTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (hoursToAdd: number) => void;
  reservation: Reservation;
  slot: ParkingSlot;
}

const ExtendTimeModal: React.FC<ExtendTimeModalProps> = ({ isOpen, onClose, onConfirm, reservation, slot }) => {
  const [hoursInput, setHoursInput] = useState('1');
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  
  const MIN_HOURS = 0.5;
  const MAX_HOURS = 6;
  const STEP = 0.5;

  const validateAndSet = (value: number) => {
    let newError = '';
    if (value > MAX_HOURS) {
      newError = `Maximum extension is ${MAX_HOURS} hours.`;
    } else if (value > 0 && value < MIN_HOURS) {
      newError = `Minimum extension is ${MIN_HOURS} hours.`;
    } else if (value > 0 && (value * 10) % (STEP * 10) !== 0) {
      newError = `Please use increments of ${STEP} hours.`;
    }
    setError(newError);
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHoursInput(value);
    
    if (value === '' || value === '.') {
      validateAndSet(0);
      return;
    }
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0) {
      validateAndSet(numericValue);
    } else {
      setError('Please enter a valid number.');
    }
  };

  const handleBlur = () => {
    let numericValue = parseFloat(hoursInput);
    if (isNaN(numericValue) || numericValue <= 0) {
      numericValue = MIN_HOURS;
    }
    
    if (numericValue > 0 && numericValue < MIN_HOURS) {
        numericValue = MIN_HOURS;
    } else if (numericValue > MAX_HOURS) {
        numericValue = MAX_HOURS;
    } else if (numericValue % STEP !== 0) {
        numericValue = Math.round(numericValue / STEP) * STEP;
        numericValue = Math.max(MIN_HOURS, numericValue);
    }
    setHoursInput(String(numericValue));
    validateAndSet(numericValue);
  };

  const adjustHours = (amount: number) => {
    let currentValue = parseFloat(hoursInput);
    if(isNaN(currentValue)) currentValue = 0;

    const newValue = Math.max(MIN_HOURS, Math.min(MAX_HOURS, currentValue + amount));
    setHoursInput(String(newValue));
    validateAndSet(newValue);
  };

  const hoursToAdd = useMemo(() => {
    const numericValue = parseFloat(hoursInput);
    if (!isNaN(numericValue) && numericValue >= MIN_HOURS && numericValue <= MAX_HOURS && !error) {
        return numericValue;
    }
    return 0;
  }, [hoursInput, error]);
  
  const additionalCost = useMemo(() => {
    return hoursToAdd * slot.pricePerHour;
  }, [hoursToAdd, slot.pricePerHour]);

  const newEndTime = useMemo(() => {
    const currentEndTime = new Date(reservation.endTime.getTime());
    if (hoursToAdd > 0) {
      return new Date(currentEndTime.getTime() + hoursToAdd * 60 * 60 * 1000);
    }
    return currentEndTime;
  }, [hoursToAdd, reservation.endTime]);
  
  useEffect(() => {
    if (isOpen) {
        setHoursInput('1');
        setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;
  
  const handleConfirm = () => {
      if (hoursToAdd > 0) {
          onConfirm(hoursToAdd);
      }
  };
  
  const isConfirmDisabled = !!error || hoursToAdd <= 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 animate-fadeIn duration-200" role="dialog" aria-modal="true" aria-labelledby="extend-modal-title" ref={modalRef}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md animate-slideUp duration-300">
        <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 id="extend-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">Extend Reservation Time</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close modal"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
            <div>
                <label htmlFor="extend-hours" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hours to Add</label>
                <div className="relative flex items-center justify-between p-1 bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus-within:border-primary transition-colors">
                    <button
                        type="button"
                        onClick={() => adjustHours(-STEP)}
                        disabled={parseFloat(hoursInput) <= MIN_HOURS}
                        className="p-2 rounded-md text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Decrease hours"
                    >
                        <Minus className="w-5 h-5" />
                    </button>
                    <input 
                        id="extend-hours"
                        type="number"
                        step={STEP}
                        min={MIN_HOURS}
                        max={MAX_HOURS}
                        value={hoursInput}
                        onChange={handleHoursChange}
                        onBlur={handleBlur}
                        className="w-full text-center font-semibold text-lg bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-900 dark:text-slate-100"
                    />
                    <button
                        type="button"
                        onClick={() => adjustHours(STEP)}
                        disabled={parseFloat(hoursInput) >= MAX_HOURS}
                        className="p-2 rounded-md text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Increase hours"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                {error ? 
                    <p className="text-red-500 text-xs mt-1 text-center">{error}</p> :
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 text-center">Min: {MIN_HOURS} hour, Max: {MAX_HOURS} hours</p>
                }
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Current End Time:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{reservation.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><Clock className="w-4 h-4" /> New End Time:</span>
                    <span className="font-semibold text-primary">{newEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><CircleDollarSign className="w-4 h-4" /> Additional Cost:</span>
                    <span className="font-semibold text-primary">৳{additionalCost.toFixed(2)}</span>
                </div>
            </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={isConfirmDisabled}>Confirm Extension</Button>
        </div>
      </div>
    </div>
  );
};

export default ExtendTimeModal;