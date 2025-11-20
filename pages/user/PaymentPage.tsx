
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ParkingSlot, PaymentMethod, Reservation, SavedCard, SavedMobileWallet } from '../../types';
import Button from '../../components/common/Button';
import { ChevronLeft, CreditCard, PlusCircle, CheckCircle, Lock, Calendar, Smartphone, User, AlertCircle } from 'lucide-react';
import { ReservationContext } from '../../contexts/ReservationContext';
import { PaymentContext } from '../../contexts/PaymentContext';
import { BkashIcon, NagadIcon, RocketIcon } from '../../components/common/PaymentIcons';
import { validateCard, validateMobileWallet } from '../../utils/validation';

interface NewReservationState {
    isExtension?: false;
    slot: ParkingSlot;
    duration: number;
    totalCost: number;
    startTime: string;
    endTime: string;
    fromMap?: boolean;
}

interface ExtensionState {
    isExtension: true;
    slot: ParkingSlot;
    reservation: Reservation;
    hoursToAdd: number;
    totalCost: number;
    newEndTime: string;
}

const PaymentPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const reservationContext = useContext(ReservationContext);
    const paymentContext = useContext(PaymentContext);
    
    const state = location.state as NewReservationState | ExtensionState | null;

    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.CARD);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    // Card Form State
    const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '', name: '' });
    const [isCardFlipped, setIsCardFlipped] = useState(false);

    // Mobile Wallet Form State
    const [mobileWalletNumber, setMobileWalletNumber] = useState('');
    
    const [saveMethod, setSaveMethod] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!state?.slot || !reservationContext || !paymentContext) {
        navigate('/map');
        return null;
    }

    const { addReservation, extendReservation } = reservationContext;
    const { addMethod } = paymentContext;
    
    const paymentMethods = [
        { id: PaymentMethod.CARD, name: 'Card', icon: <CreditCard className="w-5 h-5" /> },
        { id: PaymentMethod.BKASH, name: 'bKash', icon: <BkashIcon className="w-5 h-5" /> },
        { id: PaymentMethod.NAGAD, name: 'Nagad', icon: <NagadIcon className="w-5 h-5" /> },
        { id: PaymentMethod.ROCKET, name: 'Rocket', icon: <RocketIcon className="w-5 h-5" /> },
    ];

    const validateField = (name: string, value: string): string => {
        let error = '';
        if (selectedMethod === PaymentMethod.CARD) {
            if (name === 'number') {
                const cleanNumber = value.replace(/\s/g, '');
                if (!value) error = "Card number is required";
                else if (!/^\d{16}$/.test(cleanNumber)) error = "Card number must be 16 digits";
            }
            if (name === 'name') {
                if (!value.trim()) error = "Card holder name is required";
                else if (value.trim().length < 2) error = "Name must be at least 2 characters";
            }
            if (name === 'expiry') {
                if (!value) error = "Expiry date is required";
                else if (!/^\d{2}\/\d{2}$/.test(value)) {
                    error = "Format must be MM/YY";
                } else {
                    const [monthStr, yearStr] = value.split('/');
                    const month = parseInt(monthStr, 10);
                    const year = parseInt(yearStr, 10);
                    const now = new Date();
                    const currentYear = now.getFullYear() % 100;
                    const currentMonth = now.getMonth() + 1;
                    
                    if (month < 1 || month > 12) error = "Invalid month (01-12)";
                    else if (year < currentYear || (year === currentYear && month < currentMonth)) error = "Card has expired";
                }
            }
            if (name === 'cvc') {
                if (!value) error = "CVC is required";
                else if (!/^\d{3,4}$/.test(value)) error = "CVC must be 3 or 4 digits";
            }
        } else {
            if (name === 'mobileNumber') {
                const cleanedNumber = value.replace(/[-\s]/g, '');
                if (!value) error = "Account number is required";
                else if (!/^01[3-9]\d{8}$/.test(cleanedNumber)) error = "Invalid number (must be 11 digits starting 01)";
            }
        }
        return error;
    };

    const isFormValid = useMemo(() => {
        if (selectedMethod === PaymentMethod.CARD) {
             const { number, expiry, cvc, name } = cardDetails;
             return !validateField('number', number) && 
                    !validateField('expiry', expiry) && 
                    !validateField('cvc', cvc) && 
                    !validateField('name', name) &&
                    number !== '' && expiry !== '' && cvc !== '' && name !== '';
        }
        return !!mobileWalletNumber && !validateField('mobileNumber', mobileWalletNumber);
    }, [selectedMethod, cardDetails, mobileWalletNumber]);

    const handlePayment = async () => {
        if (!isFormValid) return;

        setIsLoading(true);

        try {
            if (saveMethod) {
                if (selectedMethod === PaymentMethod.CARD) {
                    addMethod({ 
                        id: `card-${Date.now()}`, 
                        type: PaymentMethod.CARD, 
                        cardholderName: cardDetails.name, 
                        last4: cardDetails.number.replace(/\s/g, '').slice(-4), 
                        expiryDate: cardDetails.expiry 
                    });
                } else if (mobileWalletNumber) {
                     addMethod({ 
                         id: `${selectedMethod.toLowerCase()}-${Date.now()}`, 
                         type: selectedMethod, 
                         accountNumber: mobileWalletNumber 
                     });
                }
            }
            
            await new Promise(res => setTimeout(res, 1500));

            if (state.isExtension === true) {
                await extendReservation(state.reservation.id, state.hoursToAdd, selectedMethod);
            } else {
                await addReservation(state.slot, new Date(state.startTime), new Date(state.endTime), selectedMethod);
            }
            
            setIsSuccess(true);
            setTimeout(() => {
                const finalState = state.isExtension === true 
                    ? { isExtension: true, slot: state.slot, totalCost: state.totalCost, paymentMethod: selectedMethod, newEndTime: state.newEndTime } 
                    : { ...state, paymentMethod: selectedMethod };
                navigate('/booking-confirmation', { state: finalState });
            }, 1000);

        } catch (error) {
            console.error("Payment/Reservation failed", error);
            alert("There was an error processing your request. Please try again.");
            setIsLoading(false);
        }
    };
    
    const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;
        if (name === 'number') formattedValue = value.replace(/[^\d]/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
        else if (name === 'expiry') formattedValue = value.replace(/[^\d/]/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
        else if (name === 'cvc') formattedValue = value.replace(/[^\d]/g, '').slice(0, 4);
        
        setCardDetails(prev => ({ ...prev, [name]: formattedValue }));
        
        // Clear error when typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleMobileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/[^\d-]/g, '');
        if (value.length > 3 && value.charAt(3) !== '-') value = value.slice(0, 3) + '-' + value.slice(3);
        if (value.length > 8 && value.charAt(8) !== '-') value = value.slice(0, 8) + '-' + value.slice(8);
        setMobileWalletNumber(value.slice(0, 13));

        if (errors['mobileNumber']) {
            setErrors(prev => ({ ...prev, mobileNumber: '' }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if(name === 'cvc') setIsCardFlipped(false);
        
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const backLink = state.isExtension ? '/active-reservation' : ((state as NewReservationState).fromMap ? '/map' : '/reservation-confirmation');
    const backLinkState = useMemo(() => {
        if ((state as NewReservationState).fromMap || state.isExtension) {
            return undefined;
        }
        const { slot, startTime, endTime } = state as NewReservationState;
        return { slot, startTime, endTime };
    }, [state]);

    const inputClasses = "w-full px-4 py-4 bg-[#0f172a] border border-slate-700 rounded-xl focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all text-white placeholder-slate-600 font-medium";
    const errorInputClasses = "border-red-500 focus:border-red-500 focus:ring-red-500";
    const iconClasses = "absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5";
    const labelClasses = "block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-wide";

    return (
         <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4 sm:px-6 lg:px-8 animate-fadeIn">
            {/* Header with Back Button */}
            <div className="pt-8 flex items-center gap-4 mb-2">
                 <Link 
                    to={backLink} 
                    state={backLinkState} 
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white transition-all duration-200 shadow-lg hover:shadow-primary/20 group"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <h1 className="text-3xl font-bold text-white tracking-tight">Checkout</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
                {/* LEFT COLUMN: Payment Details */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-slate-900/60 border border-slate-800 backdrop-blur-sm p-6 sm:p-8 rounded-3xl">
                        <h2 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-fuchsia-500"/> Payment Method
                        </h2>
                        
                        {/* Payment Method Tabs */}
                        <div className="grid grid-cols-4 gap-4 mb-8">
                            {paymentMethods.map(method => (
                                <button 
                                    key={method.id} 
                                    onClick={() => {
                                        setSelectedMethod(method.id);
                                        setErrors({});
                                    }} 
                                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border transition-all duration-200 ${selectedMethod === method.id ? 'bg-slate-800 border-fuchsia-500 text-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.15)] transform scale-105' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:bg-slate-900'}`}
                                > 
                                    <span className="transform scale-100">{method.icon}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider mt-1">{method.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Expanded Form */}
                        <div>
                            {selectedMethod === PaymentMethod.CARD ? (
                                <div className="rounded-2xl border-2 border-fuchsia-500/50 bg-slate-900/50 p-1 overflow-hidden">
                                    <div className="flex items-center justify-between p-4 bg-fuchsia-500/10 rounded-xl mb-6 mx-1 mt-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/30">
                                                <PlusCircle size={20} />
                                            </div>
                                            <span className="font-bold text-white">Add a new Card</span>
                                        </div>
                                        <div className="w-5 h-5 rounded-full border-[5px] border-fuchsia-500 bg-white shadow-sm"></div>
                                    </div>

                                    <div className="px-4 pb-4 space-y-6">
                                        <div>
                                            <label className={labelClasses}>Card Number</label>
                                            <div className="relative">
                                                 <CreditCard className={`${iconClasses} !left-4`} />
                                                 <input 
                                                    name="number" 
                                                    type="text" 
                                                    value={cardDetails.number} 
                                                    onChange={handleCardInputChange} 
                                                    onBlur={handleBlur} 
                                                    placeholder="0000 0000 0000 0000" 
                                                    className={`${inputClasses} pl-12 ${errors.number ? errorInputClasses : ''}`} 
                                                />
                                            </div>
                                            {errors.number && <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center gap-1.5 font-medium animate-fadeIn"><AlertCircle className="w-3 h-3"/> {errors.number}</p>}
                                        </div>
                                        
                                        <div>
                                            <label className={labelClasses}>Card Holder Name</label>
                                            <div className="relative">
                                                <User className={iconClasses} />
                                                <input 
                                                    name="name" 
                                                    type="text" 
                                                    value={cardDetails.name} 
                                                    onChange={handleCardInputChange} 
                                                    onBlur={handleBlur} 
                                                    placeholder="e.g. John Doe" 
                                                    className={`${inputClasses} pl-12 ${errors.name ? errorInputClasses : ''}`}
                                                />
                                            </div>
                                            {errors.name && <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center gap-1.5 font-medium animate-fadeIn"><AlertCircle className="w-3 h-3"/> {errors.name}</p>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className={labelClasses}>Expiry</label>
                                                <div className="relative">
                                                    <Calendar className={iconClasses}/>
                                                    <input 
                                                        name="expiry" 
                                                        type="text" 
                                                        value={cardDetails.expiry} 
                                                        onChange={handleCardInputChange} 
                                                        onBlur={handleBlur} 
                                                        placeholder="MM/YY" 
                                                        className={`${inputClasses} pl-12 ${errors.expiry ? errorInputClasses : ''}`}
                                                    />
                                                </div>
                                                {errors.expiry && <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center gap-1.5 font-medium animate-fadeIn"><AlertCircle className="w-3 h-3"/> {errors.expiry}</p>}
                                            </div>
                                            <div>
                                                <label className={labelClasses}>CVC</label>
                                                <div className="relative">
                                                    <Lock className={iconClasses}/>
                                                    <input 
                                                        name="cvc" 
                                                        type="text" 
                                                        value={cardDetails.cvc} 
                                                        onChange={handleCardInputChange} 
                                                        onFocus={() => setIsCardFlipped(true)} 
                                                        onBlur={handleBlur} 
                                                        placeholder="123" 
                                                        className={`${inputClasses} pl-12 ${errors.cvc ? errorInputClasses : ''}`}
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-bold tracking-widest pointer-events-none">
                                                        ●●●
                                                    </div>
                                                </div>
                                                {errors.cvc && <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center gap-1.5 font-medium animate-fadeIn"><AlertCircle className="w-3 h-3"/> {errors.cvc}</p>}
                                            </div>
                                        </div>

                                        <div className="flex items-center pt-2">
                                            <label className="flex items-center cursor-pointer group select-none">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${saveMethod ? 'bg-fuchsia-500 border-fuchsia-500' : 'border-slate-600 bg-slate-800'}`}>
                                                    {saveMethod && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <input type="checkbox" checked={saveMethod} onChange={(e) => setSaveMethod(e.target.checked)} className="hidden" />
                                                <span className="ml-3 text-sm font-medium text-slate-400 group-hover:text-white transition-colors">Save securely for future use</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border-2 border-slate-700 bg-slate-900/50 p-6">
                                    <label className={labelClasses}>Enter {selectedMethod} number</label>
                                    <div className="relative mt-2">
                                        <Smartphone className={iconClasses} />
                                        <input 
                                            type="tel" 
                                            name="mobileNumber"
                                            value={mobileWalletNumber} 
                                            onChange={handleMobileInputChange} 
                                            onBlur={handleBlur} 
                                            placeholder="01X-XXXX-XXXX" 
                                            className={`${inputClasses} pl-12 ${errors.mobileNumber ? errorInputClasses : ''}`} 
                                        />
                                    </div>
                                    {errors.mobileNumber && <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center gap-1.5 font-medium animate-fadeIn"><AlertCircle className="w-3 h-3"/> {errors.mobileNumber}</p>}
                                    
                                    <div className="flex items-center pt-6">
                                            <label className="flex items-center cursor-pointer group select-none">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${saveMethod ? 'bg-fuchsia-500 border-fuchsia-500' : 'border-slate-600 bg-slate-800'}`}>
                                                    {saveMethod && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <input type="checkbox" checked={saveMethod} onChange={(e) => setSaveMethod(e.target.checked)} className="hidden" />
                                                <span className="ml-3 text-sm font-medium text-slate-400 group-hover:text-white transition-colors">Save account for future use</span>
                                            </label>
                                        </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* RIGHT COLUMN: Summary & Card */}
                <div className="lg:col-span-5 flex flex-col gap-10">
                     {/* Card Visualizer (Only for Card) */}
                     {selectedMethod === PaymentMethod.CARD && (
                        <div className="relative w-full max-w-[380px] mx-auto aspect-[1.586] group perspective-[1000px]">
                           <div className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${isCardFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                             
                             {/* CARD FRONT */}
                             <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-[#1e293b] text-white p-6 flex flex-col justify-between rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden z-20">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] to-[#0f172a]"></div>
                                
                                <div className="relative z-10 flex justify-between items-start">
                                    <div className="w-12 h-9 bg-amber-200/20 rounded-md backdrop-blur-sm border border-white/20"></div>
                                    <div className="italic font-bold text-2xl tracking-wider text-white/90 font-serif">VISA</div>
                                </div>
                                
                                <div className="relative z-10 mt-2">
                                    <p className="font-mono text-xl sm:text-2xl tracking-[0.15em] text-white drop-shadow-md break-all">
                                        {cardDetails.number ? cardDetails.number : '•••• •••• •••• ••••'}
                                    </p>
                                </div>
                                
                                <div className="relative z-10 flex justify-between items-end text-sm mt-4">
                                    <div>
                                        <p className="text-slate-400 text-[9px] uppercase tracking-widest mb-1 font-bold">Card Holder</p>
                                        <p className="font-bold uppercase tracking-wider truncate max-w-[180px] text-xs sm:text-sm">{cardDetails.name || 'YOUR NAME'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400 text-[9px] uppercase tracking-widest mb-1 font-bold">Expires</p>
                                        <p className="font-bold tracking-widest text-xs sm:text-sm">{cardDetails.expiry || 'MM/YY'}</p>
                                    </div>
                                </div>
                             </div>

                             {/* CARD BACK */}
                             <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#1e293b] text-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50 z-10">
                                 <div className="bg-black h-10 w-full mt-6 relative z-10"></div>
                                 <div className="px-6 pt-4 pb-8 relative z-10">
                                     <div className="bg-white text-slate-900 h-10 w-full rounded-sm flex items-center justify-end pr-3 font-mono text-lg tracking-widest relative">
                                         <span className="absolute left-0 top-0 bottom-0 w-full bg-[url('https://www.transparenttextures.com/patterns/diagonal-striped-brick.png')] opacity-10"></span>
                                         <span className="relative z-20 font-bold mr-2 text-sm">CVC</span>
                                         <span className="relative z-20 font-bold">{cardDetails.cvc || '•••'}</span>
                                     </div>
                                 </div>
                                 <div className="absolute bottom-6 right-6 opacity-50 grayscale">
                                      <div className="italic font-bold text-xl tracking-wider text-white/90 font-serif">VISA</div>
                                 </div>
                             </div>
                           </div>
                        </div>
                     )}

                    <div className="bg-slate-900/60 border border-slate-800 backdrop-blur-sm shadow-2xl p-0 overflow-hidden rounded-3xl">
                        <div className="p-6 sm:p-8">
                            <h2 className="text-lg font-bold text-white mb-6">Order Summary</h2>
                            
                            <div className="space-y-5">
                                <div className="flex justify-between items-center group pb-5 border-b border-slate-800">
                                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wide">Parking Slot</span> 
                                    <span className="font-mono font-bold text-slate-200 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">{state.slot.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm font-medium">Vehicle Type</span> 
                                    <span className="font-bold text-slate-200">{state.slot.type}</span>
                                </div>
                                
                                {state.isExtension ? ( 
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm font-medium">Extra Time</span> 
                                        <span className="font-bold text-slate-200">{state.hoursToAdd} Hour{state.hoursToAdd > 1 ? 's' : ''}</span>
                                    </div> 
                                ) : ( 
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm font-medium">Duration</span> 
                                        <span className="font-bold text-slate-200">{(state as NewReservationState).duration.toFixed(2)} Hour</span>
                                    </div> 
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm font-medium">Rate</span> 
                                    <span className="font-bold text-slate-200">৳{state.slot.pricePerHour}/hr</span>
                                </div>
                                
                                <div className="pt-6 mt-4 border-t border-slate-800 flex justify-between items-center"> 
                                    <span className="text-slate-300 font-bold">Total Amount</span> 
                                    <span className="text-4xl font-extrabold text-fuchsia-500">৳{state.totalCost.toFixed(2)}</span> 
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-950/80 border-t border-slate-800">
                            <Button 
                                onClick={handlePayment} 
                                isLoading={isLoading && !isSuccess} 
                                disabled={!isFormValid || isLoading} 
                                className="w-full shadow-lg shadow-fuchsia-500/20 disabled:shadow-none !py-4 text-lg rounded-xl font-bold active:scale-[0.98] transition-all bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 border-none" 
                                size="lg"
                            >
                                {isSuccess ? (
                                    <div className="flex items-center gap-2 animate-fadeIn">
                                        <CheckCircle className="h-6 w-6"/> 
                                        <span>Paid Successfully</span>
                                    </div>
                                ) : (
                                    isLoading ? 'Processing...' : `Pay ৳${state.totalCost.toFixed(2)}`
                                )}
                            </Button>
                            {!isFormValid && !isLoading && (
                                <p className="text-center text-xs text-red-400 mt-3 font-medium animate-fadeIn flex items-center justify-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Please fix the errors to proceed.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
         </div>
    );
};

export default PaymentPage;
