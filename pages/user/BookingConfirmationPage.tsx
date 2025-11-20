import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { CheckCircle, LayoutGrid, ListChecks, Clock, Calendar, CreditCard } from 'lucide-react';
import { PaymentMethod } from '../../types';
import { BkashIcon, NagadIcon, RocketIcon } from '../../components/common/PaymentIcons';

const BookingConfirmationPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        isExtension = false,
        slot,
        totalCost,
        paymentMethod,
        duration,
        startTime,
        endTime,
        newEndTime
    } = location.state || {};

    if (!slot) {
        navigate('/');
        return null;
    }

    const title = isExtension ? "Reservation Extended!" : "Booking Successful!";
    const description = isExtension
        ? "Your reservation has been successfully extended. See the updated details below."
        : "Your parking spot has been reserved and paid for. You can view your active reservation details below.";

    const startDate = new Date(isExtension ? newEndTime : startTime);
    const endDate = new Date(isExtension ? newEndTime : endTime);
    
    const PaymentMethodIcon: React.FC<{method: PaymentMethod}> = ({method}) => {
        switch(method) {
            case PaymentMethod.CARD: return <CreditCard className="w-4 h-4" />;
            case PaymentMethod.BKASH: return <BkashIcon className="h-4" />;
            case PaymentMethod.NAGAD: return <NagadIcon className="h-4" />;
            case PaymentMethod.ROCKET: return <RocketIcon className="h-4" />;
            default: return <CreditCard className="w-4 h-4" />;
        }
    }

    return (
        <div className="max-w-xl mx-auto text-center py-10">
            <Card className="shadow-2xl dark:shadow-black/50">
                <div className="p-6">
                    <CheckCircle className="w-16 h-16 text-primary mx-auto" />
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-4">
                        {title}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                        {description}
                    </p>

                    <div className="text-left bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl mt-6 space-y-3 border border-slate-200 dark:border-slate-700">
                         <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-300">Slot:</span> <span className="font-semibold text-slate-800 dark:text-slate-100">{slot.name}</span></div>
                         
                         {isExtension ? (
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-300 flex items-center gap-2"><Clock className="w-4 h-4" /> New End Time:</span> 
                                <span className="font-semibold text-slate-800 dark:text-slate-100">{endDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                            </div>
                         ) : (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-300 flex items-center gap-2"><Calendar className="w-4 h-4" /> Date:</span> 
                                    <span className="font-semibold text-slate-800 dark:text-slate-100">{startDate.toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 dark:text-slate-300 flex items-center gap-2"><Clock className="w-4 h-4" /> Time:</span> 
                                    <span className="font-semibold text-slate-800 dark:text-slate-100">{new Date(startTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - {endDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                                </div>
                            </>
                         )}

                         <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-300">Amount Paid:</span> 
                            <span className="font-semibold text-slate-800 dark:text-slate-100">৳{totalCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-300 flex items-center gap-2"><PaymentMethodIcon method={paymentMethod} /> Via:</span> 
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{paymentMethod}</span>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link to="/active-reservation">
                    <Button variant="primary" className="w-full">
                       <ListChecks className="w-5 h-5 mr-2" /> View Active Reservation
                    </Button>
                </Link>
                <Link to="/">
                     <Button variant="secondary" className="w-full">
                        <LayoutGrid className="w-5 h-5 mr-2" /> Go to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
};

export default BookingConfirmationPage;