import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ParkingSlot } from '../../types';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ArrowLeft, Clock, Tag, CircleDollarSign, Car } from 'lucide-react';
import { formatCurrency, formatDateTimeLocal } from '../../utils/formatters';
import { ReservationContext } from '../../contexts/ReservationContext';
import { getUserParkingHistory, UserParkingHistory } from '../../utils/recommendations';

const ReservationConfirmationPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { slot } = location.state as { slot: ParkingSlot };
    const reservationContext = useContext(ReservationContext);

    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);
    const [initialStartTime, setInitialStartTime] = useState<Date | null>(null);

    const [duration, setDuration] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const [error, setError] = useState('');
    const [userPattern, setUserPattern] = useState<UserParkingHistory | null>(null);

    if (!reservationContext) {
        navigate('/map');
        return null;
    }

    useEffect(() => {
        const now = new Date();
        const minutes = now.getMinutes();
        const roundedMinutes = Math.ceil(minutes / 15) * 15;
        now.setMinutes(roundedMinutes);
        now.setSeconds(0);
        now.setMilliseconds(0);

        const defaultStartTime = new Date(now);

        const userReservations = reservationContext.getReservationsForCurrentUser();
        const pattern: UserParkingHistory = getUserParkingHistory(userReservations);
        setUserPattern(pattern);

        let defaultEndTime;
        if (pattern.averageDuration > 0) {
            defaultEndTime = new Date(now.getTime() + pattern.averageDuration * 60 * 60 * 1000);
        } else {
            defaultEndTime = new Date(now.getTime() + 60 * 60 * 1000); // fallback to 1 hour
        }

        setInitialStartTime(defaultStartTime);
        setStartTime(defaultStartTime);
        setEndTime(defaultEndTime);
    }, [reservationContext]);

    useEffect(() => {
        if (startTime && endTime) {
            if (endTime <= startTime) {
                setError('End time must be after start time.');
                setDuration(0);
                setTotalCost(0);
            } else {
                setError('');
                const diffMs = endTime.getTime() - startTime.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);
                setDuration(diffHours);
                setTotalCost(diffHours * slot.pricePerHour);
            }
        }
    }, [startTime, endTime, slot.pricePerHour]);

    const handleReset = () => {
        const now = new Date();
        const minutes = now.getMinutes();
        const roundedMinutes = Math.ceil(minutes / 15) * 15;
        now.setMinutes(roundedMinutes);
        now.setSeconds(0);
        now.setMilliseconds(0);
        setStartTime(now);
        setEndTime(new Date(now.getTime() + 60 * 60 * 1000));
        setError('');
    };

    if (!slot) {
        navigate('/map');
        return null;
    }

    const handleProceedToPayment = () => {
        navigate('/payment', { state: { slot, duration, totalCost, startTime: startTime?.toISOString(), endTime: endTime?.toISOString() } });
    };

    const minStartTime = new Date();
    const minMinutes = minStartTime.getMinutes();
    const minRoundedMinutes = Math.ceil(minMinutes / 15) * 15;
    minStartTime.setMinutes(minRoundedMinutes);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Link to="/map" className="inline-flex items-center gap-2 text-primary hover:text-primary-600 font-medium">
                <ArrowLeft className="w-4 h-4" />
                Back to Map
            </Link>

            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Confirm Your Reservation</h1>

            <Card>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{slot.name}</h2>
                <div className="space-y-3 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-3">
                        <Car className="w-5 h-5 text-slate-400" />
                        <span>Type: <span className="font-semibold text-slate-800 dark:text-slate-100">{slot.type}</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Tag className="w-5 h-5 text-slate-400" />
                        <span>Price: <span className="font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(slot.pricePerHour)}/hour</span></span>
                    </div>
                </div>
            </Card>

            <Card>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Select Date & Time</h2>
                {userPattern && userPattern.averageDuration > 0 && (
                    <div className="p-3 mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            ℹ️ We've pre-filled your usual parking duration ({userPattern.averageDuration} hrs)
                        </p>
                    </div>
                )}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="startTime" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Start Time</label>
                        <input
                            id="startTime"
                            type="datetime-local"
                            value={formatDateTimeLocal(startTime)}
                            min={formatDateTimeLocal(minStartTime)}
                            onChange={(e) => setStartTime(e.target.value ? new Date(e.target.value) : null)}
                            className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md"
                        />
                    </div>
                    <div>
                        <label htmlFor="endTime" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">End Time</label>
                        <input
                            id="endTime"
                            type="datetime-local"
                            value={formatDateTimeLocal(endTime)}
                            min={formatDateTimeLocal(startTime)}
                            onChange={(e) => setEndTime(e.target.value ? new Date(e.target.value) : null)}
                            className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md"
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
            </Card>

            <Card>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-slate-400" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">Duration</span>
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">{duration.toFixed(2)} hours</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <CircleDollarSign className="w-6 h-6 text-primary" />
                            <span className="text-lg font-semibold text-slate-900 dark:text-white">Total Cost</span>
                        </div>
                        <span className="text-2xl font-bold text-primary">{formatCurrency(totalCost)}</span>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button onClick={handleReset} variant="secondary" size="lg">Reset Times</Button>
                <Button onClick={handleProceedToPayment} className="w-full" size="lg" disabled={!!error || duration <= 0}>
                    Proceed to Payment
                </Button>
            </div>
        </div>
    );
};

export default ReservationConfirmationPage;