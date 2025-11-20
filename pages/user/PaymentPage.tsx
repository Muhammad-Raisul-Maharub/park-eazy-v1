
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ParkingSlot, PaymentMethod, Reservation, SavedPaymentMethod, SavedCard, SavedMobileWallet } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ChevronLeft, CreditCard, ShieldCheck, PlusCircle, CheckCircle, AlertCircle, Lock, Calendar, User, Smartphone } from 'lucide-react';
import { ReservationContext } from '../../contexts/ReservationContext';
import { PaymentContext } from '../../contexts/PaymentContext';
import { BkashIcon, NagadIcon, RocketIcon, VisaIcon, MastercardIcon, AmexIcon, GenericCardIcon } from '../../components/common/PaymentIcons';
import { getCardBrand as getCardBrandUtil, validateCard, validateMobileWallet } from '../../utils/validation';

type CardBrand = 'visa' | 'mastercard' | 'amex' | 'other';

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

const getCardBrand = (number: string): CardBrand => {
    return getCardBrandUtil(number);
};

const PaymentPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const reservationContext = useContext(ReservationContext);
    const paymentContext = useContext(PaymentContext);
    
    const state = location.state as NewReservationState | ExtensionState | null;

    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.CARD);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const [selectedSavedMethodId, setSelectedSavedMethodId] = useState<string | null>(null);
    const [showNewMethodForm, setShowNewMethodForm] = useState(true);
    
    // Card Form State
    const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '', name: '' });
    const [cardErrors, setCardErrors] = useState<Record<string, string | undefined>>({});
    const [cardTouched, setCardTouched] = useState<Record<string, boolean>>({});
    const [isCardFlipped, setIsCardFlipped] = useState(false);

    // Mobile Wallet Form State
    const [mobileWalletNumber, setMobileWalletNumber] = useState('');
    const [mobileWalletError, setMobileWalletError] = useState<string | undefined>();
    const [mobileWalletTouched, setMobileWalletTouched] = useState(false);
    
    const [saveMethod, setSaveMethod] = useState(true);

    if (!state?.slot || !reservationContext || !paymentContext) {
        navigate('/map');
        return null;
    }

    const { addReservation, extendReservation } = reservationContext;
    const { savedMethods, addMethod } = paymentContext;
    
    const paymentMethods = [
        { id: PaymentMethod.CARD, name: 'Card', icon: <CreditCard className="w-5 h-5" /> },
        { id: PaymentMethod.BKASH, name: 'bKash', icon: <BkashIcon /> },
        { id: PaymentMethod.NAGAD, name: 'Nagad', icon: <NagadIcon /> },
        { id: PaymentMethod.ROCKET, name: 'Rocket', icon: <RocketIcon /> },
    ];

    useEffect(() => {
        if(showNewMethodForm) {
            if (selectedMethod === PaymentMethod.CARD) {
                setCardErrors(validateCard(cardDetails));
            } else {
                setMobileWalletError(validateMobileWallet(mobileWalletNumber));
            }
        } else {
            setCardErrors({});
            setMobileWalletError(undefined);
        }
    }, [cardDetails, mobileWalletNumber, selectedMethod, showNewMethodForm]);

    const isFormValid = useMemo(() => {
        if (selectedSavedMethodId && !showNewMethodForm) return true;
        if (!showNewMethodForm) return false;
        
        if (selectedMethod === PaymentMethod.CARD) {
             const hasRequiredFields = !!cardDetails.number && !!cardDetails.expiry && !!cardDetails.cvc && !!cardDetails.name;
             const hasNoErrors = Object.keys(validateCard(cardDetails)).length === 0;
             return hasRequiredFields && hasNoErrors;
        }
        
        return !!mobileWalletNumber && !validateMobileWallet(mobileWalletNumber);
    }, [selectedSavedMethodId, showNewMethodForm, selectedMethod, cardDetails, mobileWalletNumber]);

    const handlePayment = async () => {
        if (!isFormValid) return;

        setIsLoading(true);

        try {
            if (showNewMethodForm && saveMethod) {
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
    };

    const handleMobileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/[^\d-]/g, '');
        if (value.length > 3 && value.charAt(3) !== '-') value = value.slice(0, 3) + '-' + value.slice(3);
        if (value.length > 8 && value.charAt(8) !== '-') value = value.slice(0, 8) + '-' + value.slice(8);
        setMobileWalletNumber(value.slice(0, 13));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name } = e.target;
        if (selectedMethod === PaymentMethod.CARD) setCardTouched(prev => ({ ...prev, [name]: true }));
        else setMobileWalletTouched(true);

        if(name === 'cvc') setIsCardFlipped(false);
    };

    const backLink = state.isExtension ? '/active-reservation' : ((state as NewReservationState).fromMap ? '/map' : '/reservation-confirmation');
    const backLinkState = useMemo(() => {
        if ((state as NewReservationState).fromMap || state.isExtension) {
            return undefined;
        }
        const { slot, startTime, endTime } = state as NewReservationState;
        return { slot, startTime, endTime };
    }, [state]);

    const inputClasses = "w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-white placeholder-slate-500";
    const iconClasses = "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400";

    return (
         <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12 px-4 sm:px-6 animate-fadeIn">
            {/* Header with Back Button */}
            <div className="pt-8 flex items-center gap-4">
                 <Link 
                    to={backLink} 
                    state={backLinkState} 
                    className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-primary transition-all duration-300 group"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <h1 className="text-3xl font-bold text-white tracking-tight">Checkout</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN: Payment Details */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="!bg-slate-900/60 !border-slate-800 backdrop-blur-sm p-8">
                        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary"/> Payment Method
                        </h2>
                        
                        {/* Payment Method Tabs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                            {paymentMethods.map(method => (
                                <button 
                                    key={method.id} 
                                    onClick={() => setSelectedMethod(method.id)} 
                                    className={`flex flex-col items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all duration-200 ${selectedMethod === method.id ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800'}`}
                                > 
                                    <span className="transform scale-110">{method.icon}</span>
                                    <span className="text-xs font-bold">{method.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Add New Method Toggle */}
                        <div className="mb-6">
                            <button 
                                onClick={() => { setShowNewMethodForm(true); setSelectedSavedMethodId(null); }}
                                className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all duration-200 group ${showNewMethodForm ? 'border-primary ring-1 ring-primary/50 bg-primary/5' : 'border-dashed border-slate-700 hover:border-primary/50 hover:bg-slate-800'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full transition-colors ${showNewMethodForm ? 'bg-primary text-white' : 'bg-slate-800 text-slate-500 group-hover:text-primary'}`}>
                                        <PlusCircle className="w-5 h-5"/> 
                                    </div>
                                    <span className="font-bold text-white">Add a new {selectedMethod === PaymentMethod.CARD ? "Card" : selectedMethod}</span>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${showNewMethodForm ? 'border-primary bg-primary' : 'border-slate-600'}`}>
                                    {showNewMethodForm && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                            </button>
                        </div>

                        {/* New Method Form */}
                        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showNewMethodForm ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            {selectedMethod === PaymentMethod.CARD ? (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Card Number</label>
                                        <div className="relative">
                                            <CreditCard className={iconClasses}/>
                                            <input name="number" type="text" value={cardDetails.number} onChange={handleCardInputChange} onBlur={handleBlur} placeholder="0000 0000 0000 0000" className={inputClasses} />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Card Holder</label>
                                        <div className="relative">
                                            <User className={iconClasses}/>
                                            <input name="name" type="text" value={cardDetails.name} onChange={handleCardInputChange} onBlur={handleBlur} placeholder="e.g. John Doe" className={inputClasses}/>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Expiry</label>
                                            <div className="relative">
                                                <Calendar className={iconClasses}/>
                                                <input name="expiry" type="text" value={cardDetails.expiry} onChange={handleCardInputChange} onBlur={handleBlur} placeholder="MM/YY" className={inputClasses}/>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">CVC</label>
                                            <div className="relative">
                                                <Lock className={iconClasses}/>
                                                <input name="cvc" type="text" value={cardDetails.cvc} onChange={handleCardInputChange} onFocus={() => setIsCardFlipped(true)} onBlur={handleBlur} placeholder="123" className={inputClasses}/>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold tracking-widest pointer-events-none">
                                                    ...
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                    <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Enter {selectedMethod} number</label>
                                    <div className="relative">
                                        <Smartphone className={iconClasses} />
                                        <input type="tel" value={mobileWalletNumber} onChange={handleMobileInputChange} onBlur={handleBlur} placeholder="01X-XXXX-XXXX" className={inputClasses} />
                                    </div>
                                </div>
                            )}
                                <div className="flex items-center pt-4">
                                    <label className="flex items-center cursor-pointer group select-none">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${saveMethod ? 'bg-primary border-primary' : 'border-slate-600 bg-slate-800'}`}>
                                            {saveMethod && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <input type="checkbox" checked={saveMethod} onChange={(e) => setSaveMethod(e.target.checked)} className="hidden" />
                                        <span className="ml-3 text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Save securely for future use</span>
                                    </label>
                                </div>
                        </div>
                    </Card>
                </div>
                
                {/* RIGHT COLUMN: Order Summary */}
                <div className="lg:col-span-5 space-y-6">
                     {/* Card Visualizer (Only for Card) */}
                     <div className={`transition-all duration-500 ease-in-out transform ${selectedMethod === PaymentMethod.CARD && showNewMethodForm ? 'opacity-100 max-h-[300px] translate-y-0' : 'opacity-0 max-h-0 -translate-y-4 overflow-hidden'}`}>
                        <div className="card-flipper aspect-[1.586] w-full max-w-[340px] mx-auto" >
                           <div className={`card-flipper-inner ${isCardFlipped ? 'flipped' : ''}`}>
                             <div className="card-front bg-slate-900 text-white p-6 flex flex-col justify-between rounded-2xl shadow-2xl border border-slate-700/50 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black"></div>
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                                
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-8 bg-amber-200/20 rounded-md backdrop-blur-md border border-white/10"></div>
                                        <div className="italic font-bold text-xl tracking-wider opacity-80">VISA</div>
                                    </div>
                                    <p className="font-mono text-xl mt-8 tracking-widest text-white drop-shadow-md">{cardDetails.number || '•••• •••• •••• ••••'}</p>
                                </div>
                                <div className="relative z-10 flex justify-between items-end text-sm mt-6">
                                    <div>
                                        <p className="text-slate-400 text-[9px] uppercase tracking-widest mb-1">Card Holder</p>
                                        <p className="font-medium uppercase tracking-wider truncate max-w-[160px] text-base">{cardDetails.name || 'YOUR NAME'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400 text-[9px] uppercase tracking-widest mb-1">Expires</p>
                                        <p className="font-medium tracking-widest text-base">{cardDetails.expiry || 'MM/YY'}</p>
                                    </div>
                                </div>
                             </div>
                             {/* Card Back */}
                             <div className="card-back bg-slate-800 text-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50 relative">
                                 <div className="bg-black h-10 w-full mt-6 relative z-10"></div>
                                 <div className="p-6 relative z-10">
                                     <div className="bg-white text-slate-900 text-right p-2 rounded-sm font-mono text-lg flex items-center justify-end gap-3 shadow-inner mt-2">
                                         <span className="text-[10px] text-slate-400 font-sans uppercase tracking-wider mr-2">CVC</span>
                                         <span className="tracking-widest font-bold">{cardDetails.cvc || '•••'}</span>
                                     </div>
                                 </div>
                             </div>
                           </div>
                        </div>
                    </div>

                    <Card className="!bg-slate-900 !border-slate-800 shadow-2xl sticky top-6 p-0 overflow-hidden">
                        <div className="p-6 border-b border-slate-800">
                            <h2 className="text-lg font-bold text-white">Order Summary</h2>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center group">
                                <span className="text-slate-400 text-sm font-medium">Parking Slot</span> 
                                <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded-md">{state.slot.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm font-medium">Vehicle Type</span> 
                                <span className="font-semibold text-slate-300">{state.slot.type}</span>
                            </div>
                            <div className="border-t border-dashed border-slate-800 my-2"></div>
                            {state.isExtension ? ( 
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm font-medium">Extra Time</span> 
                                    <span className="font-semibold text-slate-300">{state.hoursToAdd} Hour{state.hoursToAdd > 1 ? 's' : ''}</span>
                                </div> 
                            ) : ( 
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm font-medium">Duration</span> 
                                    <span className="font-semibold text-slate-300">{(state as NewReservationState).duration.toFixed(2)} Hours</span>
                                </div> 
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm font-medium">Rate</span> 
                                <span className="font-semibold text-slate-300">৳{state.slot.pricePerHour}/hr</span>
                            </div>
                            
                            <div className="pt-4 mt-4 border-t border-slate-800 flex justify-between items-end"> 
                                <span className="text-slate-400 font-bold pb-1">Total Amount</span> 
                                <span className="text-3xl font-extrabold text-primary">৳{state.totalCost.toFixed(2)}</span> 
                            </div>
                        </div>

                        <div className="p-6 bg-slate-950/30 border-t border-slate-800">
                            <Button 
                                onClick={handlePayment} 
                                isLoading={isLoading && !isSuccess} 
                                disabled={!isFormValid || isLoading} 
                                className="w-full shadow-lg shadow-primary/20 disabled:shadow-none !py-4 text-lg rounded-xl font-bold active:scale-[0.98] transition-all" 
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
                            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 mt-4 uppercase tracking-wider font-bold"> 
                                <ShieldCheck className="w-3 h-3 text-emerald-500" /> 
                                <span>Secure Encrypted Payment</span> 
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
         </div>
    );
};

export default PaymentPage;
