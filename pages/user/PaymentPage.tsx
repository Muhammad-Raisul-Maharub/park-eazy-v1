
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ParkingSlot, PaymentMethod, Reservation, SavedPaymentMethod, SavedCard, SavedMobileWallet } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ChevronLeft, CreditCard, ShieldCheck, PlusCircle, CheckCircle, AlertCircle, Wifi, Lock } from 'lucide-react';
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
    const [showNewMethodForm, setShowNewMethodForm] = useState(false);
    
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
        const methodsForType = savedMethods.filter(m => m.type === selectedMethod);
        if (methodsForType.length > 0) {
            setSelectedSavedMethodId(methodsForType[0].id);
            setShowNewMethodForm(false);
        } else {
            setSelectedSavedMethodId(null);
            setShowNewMethodForm(true);
        }
    }, [selectedMethod, savedMethods]);

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

        if (showNewMethodForm) {
            if (selectedMethod === PaymentMethod.CARD) {
                const last4 = cardDetails.number.replace(/\s/g, '').slice(-4);
                const isDuplicate = savedMethods.some(m => 
                    m.type === PaymentMethod.CARD && 
                    (m as SavedCard).last4 === last4 && 
                    (m as SavedCard).cardholderName.trim().toLowerCase() === cardDetails.name.trim().toLowerCase()
                );
                
                if (isDuplicate) {
                    alert('Card is in use');
                    return;
                }
            } else if (mobileWalletNumber) {
                const isDuplicate = savedMethods.some(m => 
                    m.type === selectedMethod && 
                    (m as SavedMobileWallet).accountNumber === mobileWalletNumber
                );

                if (isDuplicate) {
                    alert('Payment Method Already in Use');
                    return;
                }
            }
        }

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

    const cardBrand = getCardBrand(cardDetails.number);
    const CardBrandIcon = { visa: VisaIcon, mastercard: MastercardIcon, amex: AmexIcon, other: GenericCardIcon }[cardBrand];

    const backLink = state.isExtension ? '/active-reservation' : ((state as NewReservationState).fromMap ? '/map' : '/reservation-confirmation');
    const backLinkState = useMemo(() => {
        if ((state as NewReservationState).fromMap || state.isExtension) {
            return undefined;
        }
        const { slot, startTime, endTime } = state as NewReservationState;
        return { slot, startTime, endTime };
    }, [state]);

    const handleToggleAddNew = () => {
        setShowNewMethodForm(prev => !prev);
        if (!showNewMethodForm) {
             setSelectedSavedMethodId(null);
        }
    };

    return (
         <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12 px-4 sm:px-6">
            <div className="pt-6">
                 <Link 
                    to={backLink} 
                    state={backLinkState} 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary hover:border-primary transition-all duration-300 group font-semibold shadow-sm hover:shadow-md"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                <div className="lg:col-span-7 space-y-8">
                     <div className="space-y-2">
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Checkout</h1>
                        <p className="text-slate-500 dark:text-slate-400">Complete your payment to secure your parking spot.</p>
                     </div>
                    
                    <Card className="border border-slate-200 dark:border-slate-700 shadow-lg dark:shadow-none">
                        <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary"/> Payment Method
                        </h2>
                        
                        <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl mb-6 overflow-x-auto no-scrollbar">
                            {paymentMethods.map(method => (
                                <button 
                                    key={method.id} 
                                    onClick={() => setSelectedMethod(method.id)} 
                                    className={`flex-1 min-w-[80px] py-2.5 px-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 whitespace-nowrap ${selectedMethod === method.id ? 'bg-white dark:bg-slate-700 text-primary shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800'}`}
                                > 
                                    <span className="transform scale-90 sm:scale-100">{method.icon}</span>
                                    <span className="hidden sm:inline">{method.name}</span>
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            {savedMethods.filter(m => m.type === selectedMethod).map(method => {
                                const isSelected = selectedSavedMethodId === method.id && !showNewMethodForm;
                                const CardLogo = method.type === 'Card' ? { visa: VisaIcon, mastercard: MastercardIcon, amex: AmexIcon, other: GenericCardIcon }[getCardBrand((method as SavedCard).last4)] || GenericCardIcon : null;

                                return (
                                <div 
                                    key={method.id} 
                                    onClick={() => { setSelectedSavedMethodId(method.id); setShowNewMethodForm(false); }}
                                    className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 group ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    {CardLogo && <CardLogo className="h-8 w-12 mr-4" />}
                                    {method.type !== 'Card' && <div className="mr-4 transform scale-125">{ { [PaymentMethod.BKASH]: <BkashIcon />, [PaymentMethod.NAGAD]: <NagadIcon />, [PaymentMethod.ROCKET]: <RocketIcon />}[method.type] }</div>}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{method.type === 'Card' ? (method as SavedCard).cardholderName : method.type}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono tracking-tight truncate">{method.type === 'Card' ? `•••• •••• •••• ${(method as SavedCard).last4}` : `•••••••${(method as SavedMobileWallet).accountNumber.slice(-4)}`}</p>
                                    </div>
                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-primary bg-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                    </div>
                                </div>
                            )})}

                             <div 
                                onClick={handleToggleAddNew}
                                className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 group ${showNewMethodForm ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-dashed border-slate-300 dark:border-slate-600 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <div className={`p-2 rounded-full mr-4 transition-colors ${showNewMethodForm ? 'bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 group-hover:text-primary'}`}>
                                    <PlusCircle className="w-6 h-6"/> 
                                </div>
                                <span className="font-bold flex-1 text-slate-800 dark:text-slate-100">Add a new {selectedMethod === PaymentMethod.CARD ? "Card" : selectedMethod}</span> 
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${showNewMethodForm ? 'border-primary bg-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                                    {showNewMethodForm && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                </div>
                            </div>

                             <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showNewMethodForm ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-6 mt-2">
                                    {selectedMethod === PaymentMethod.CARD ? (
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 tracking-wider">Card Number</label>
                                                <div className="relative">
                                                    <input name="number" type="text" value={cardDetails.number} onChange={handleCardInputChange} onFocus={() => setCardTouched(p => ({...p, number: true}))} onBlur={handleBlur} placeholder="0000 0000 0000 0000" className={`w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border-2 rounded-xl focus:outline-none focus:ring-0 transition-colors font-mono ${cardTouched.number ? (cardErrors.number ? 'border-red-500 focus:border-red-500' : 'border-green-500 focus:border-green-500') : 'border-slate-200 dark:border-slate-700 focus:border-primary'}`}/>
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                        <CreditCard className="w-5 h-5"/>
                                                    </div>
                                                    {cardTouched.number && <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{cardErrors.number ? <AlertCircle className="h-5 w-5 text-red-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}</div>}
                                                </div>
                                                {cardTouched.number && cardErrors.number && <p className="mt-1.5 text-xs text-red-500 font-medium animate-slideUp">{cardErrors.number}</p>}
                                            </div>
                                            
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 tracking-wider">Card Holder</label>
                                                <input name="name" type="text" value={cardDetails.name} onChange={handleCardInputChange} onFocus={() => setCardTouched(p => ({...p, name: true}))} onBlur={handleBlur} placeholder="e.g. John Doe" className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 rounded-xl focus:outline-none focus:ring-0 transition-colors ${cardTouched.name ? (cardErrors.name ? 'border-red-500 focus:border-red-500' : 'border-green-500 focus:border-green-500') : 'border-slate-200 dark:border-slate-700 focus:border-primary'}`}/>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 tracking-wider">Expiry</label>
                                                    <input name="expiry" type="text" value={cardDetails.expiry} onChange={handleCardInputChange} onFocus={() => setCardTouched(p => ({...p, expiry: true}))} onBlur={handleBlur} placeholder="MM/YY" className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 rounded-xl focus:outline-none focus:ring-0 transition-colors font-mono text-center ${cardTouched.expiry ? (cardErrors.expiry ? 'border-red-500 focus:border-red-500' : 'border-green-500 focus:border-green-500') : 'border-slate-200 dark:border-slate-700 focus:border-primary'}`}/>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 tracking-wider">CVC</label>
                                                    <div className="relative">
                                                        <input name="cvc" type="text" value={cardDetails.cvc} onChange={handleCardInputChange} onFocus={() => { setIsCardFlipped(true); setCardTouched(p => ({...p, cvc: true}))}} onBlur={handleBlur} placeholder="123" className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 rounded-xl focus:outline-none focus:ring-0 transition-colors font-mono text-center ${cardTouched.cvc ? (cardErrors.cvc ? 'border-red-500 focus:border-red-500' : 'border-green-500 focus:border-green-500') : 'border-slate-200 dark:border-slate-700 focus:border-primary'}`}/>
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                            <Lock className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                         <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 tracking-wider">Enter {selectedMethod} number</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none opacity-75 transform scale-90">{ { [PaymentMethod.BKASH]: <BkashIcon />, [PaymentMethod.NAGAD]: <NagadIcon />, [PaymentMethod.ROCKET]: <RocketIcon />}[selectedMethod] }</div>
                                                <input type="tel" value={mobileWalletNumber} onChange={handleMobileInputChange} onBlur={handleBlur} placeholder="01X-XXXX-XXXX" className={`w-full p-3 pl-14 bg-white dark:bg-slate-900 border-2 rounded-xl focus:outline-none focus:ring-0 transition-colors font-mono ${mobileWalletTouched ? (mobileWalletError ? 'border-red-500 focus:border-red-500' : 'border-green-500 focus:border-green-500') : 'border-slate-200 dark:border-slate-700 focus:border-primary'}`} />
                                                {mobileWalletTouched && <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{mobileWalletError ? <AlertCircle className="h-5 w-5 text-red-500" /> : <CheckCircle className="h-5 w-5 text-green-500" />}</div>}
                                            </div>
                                            {mobileWalletTouched && mobileWalletError && <p className="mt-1.5 text-xs text-red-500 font-medium animate-slideUp">{mobileWalletError}</p>}
                                        </div>
                                    )}
                                     <div className="flex items-center pt-2">
                                         <label className="flex items-center cursor-pointer group select-none">
                                             <input id="save-method" type="checkbox" checked={saveMethod} onChange={(e) => setSaveMethod(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer transition-all" />
                                             <span className="ml-2 text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">Save securely for future use</span>
                                         </label>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
                
                <div className="lg:col-span-5 space-y-6">
                     <div className={`transition-all duration-500 ease-in-out transform ${selectedMethod === PaymentMethod.CARD && showNewMethodForm ? 'opacity-100 max-h-[300px] translate-y-0 mb-6' : 'opacity-0 max-h-0 -translate-y-4 overflow-hidden'}`}>
                        <div className="card-flipper aspect-[1.586] w-full max-w-[340px] mx-auto" >
                           <div className={`card-flipper-inner ${isCardFlipped ? 'flipped' : ''}`}>
                             <div className="card-front bg-slate-900 text-white p-6 flex flex-col justify-between rounded-2xl shadow-2xl border border-slate-700/50 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-700/50 to-black/50"></div>
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center">
                                        <Wifi size={28} className="-rotate-90 text-white/70"/>
                                        <CardBrandIcon className="h-10 w-auto filter drop-shadow-md"/>
                                    </div>
                                    <p className="font-mono text-2xl mt-8 tracking-widest text-white drop-shadow-md">{cardDetails.number || '•••• •••• •••• ••••'}</p>
                                </div>
                                <div className="relative z-10 flex justify-between items-end text-sm">
                                    <div>
                                        <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">Card Holder</p>
                                        <p className="font-medium uppercase tracking-wider truncate max-w-[160px] text-lg">{cardDetails.name || 'YOUR NAME'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">Expires</p>
                                        <p className="font-medium tracking-widest text-lg">{cardDetails.expiry || 'MM/YY'}</p>
                                    </div>
                                </div>
                             </div>
                             <div className="card-back bg-slate-800 text-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50 relative">
                                 <div className="absolute inset-0 bg-gradient-to-tl from-slate-800 to-slate-900"></div>
                                 <div className="bg-black h-12 w-full mt-8 relative z-10"></div>
                                 <div className="p-6 relative z-10">
                                     <div className="bg-white text-slate-900 text-right p-2.5 rounded-md font-mono text-lg flex items-center justify-end gap-3 shadow-inner">
                                         <span className="text-xs text-slate-400 font-sans uppercase tracking-wider">CVC</span>
                                         <span className="tracking-widest font-bold">{cardDetails.cvc || '•••'}</span>
                                     </div>
                                     <div className="mt-8 flex justify-center opacity-50">
                                         <CreditCard size={48} />
                                     </div>
                                 </div>
                             </div>
                           </div>
                        </div>
                    </div>

                    <Card className="!bg-white dark:!bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-xl sticky top-6">
                        <h2 className="text-lg font-bold border-b pb-4 mb-4 border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-100">Order Summary</h2>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center group">
                                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Parking Slot</span> 
                                <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">{state.slot.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Vehicle Type</span> 
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{state.slot.type}</span>
                            </div>
                            <div className="border-t border-dashed border-slate-200 dark:border-slate-700 my-2"></div>
                            {state.isExtension ? ( 
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Extra Time</span> 
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{state.hoursToAdd} Hour{state.hoursToAdd > 1 ? 's' : ''}</span>
                                </div> 
                            ) : ( 
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Duration</span> 
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{(state as NewReservationState).duration.toFixed(2)} Hours</span>
                                </div> 
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Rate</span> 
                                <span className="font-semibold text-slate-700 dark:text-slate-300">৳{state.slot.pricePerHour}/hr</span>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 mt-6 flex justify-between items-center border border-slate-100 dark:border-slate-700"> 
                            <span className="text-slate-600 dark:text-slate-300 font-bold">Total Amount</span> 
                            <span className="text-2xl font-extrabold text-primary">৳{state.totalCost.toFixed(2)}</span> 
                        </div>

                        <div className="mt-6 space-y-4">
                            <Button 
                                onClick={handlePayment} 
                                isLoading={isLoading && !isSuccess} 
                                disabled={!isFormValid || isLoading} 
                                className="w-full shadow-xl shadow-primary/20 disabled:shadow-none !py-4 text-lg rounded-2xl font-bold active:scale-[0.98] transition-all" 
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
                            <div className="flex items-center justify-center gap-2 text-xs text-slate-400"> 
                                <ShieldCheck className="w-4 h-4 text-emerald-500" /> 
                                <span>Payments are secure and encrypted</span> 
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
         </div>
    );
};

export default PaymentPage;
