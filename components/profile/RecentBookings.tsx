import React, { useContext, useMemo } from 'react';
import { ReservationContext } from '../../contexts/ReservationContext';
import { ParkingSlot } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const RecentBookings: React.FC = () => {
    const reservationContext = useContext(ReservationContext);

    const recentBookings = useMemo(() => {
        if (!reservationContext) {
            return [];
        }
        const userReservations = reservationContext.getReservationsForCurrentUser();
        return userReservations.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()).slice(0, 5);
    }, [reservationContext]);

    const getSlotById = (slotId: string): ParkingSlot | undefined => {
        return reservationContext?.slots.find(slot => slot.id === slotId);
    };

    if (!reservationContext) {
        return <p>Loading booking history...</p>;
    }

    if (recentBookings.length === 0) {
        return <p className="text-slate-500 dark:text-slate-400 mt-8 pt-4 border-t border-slate-200 dark:border-slate-700 text-center">No recent bookings to display.</p>;
    }

    return (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Recent Booking History</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="p-3 font-semibold text-sm text-slate-600 dark:text-slate-400">Slot</th>
                            <th className="p-3 font-semibold text-sm text-slate-600 dark:text-slate-400">Date</th>
                            <th className="p-3 font-semibold text-sm text-slate-600 dark:text-slate-400 text-right">Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentBookings.map(res => {
                            const slot = getSlotById(res.slotId);
                            return (
                                <tr key={res.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-3 font-medium text-slate-800 dark:text-slate-100">{slot?.name || 'N/A'}</td>
                                    <td className="p-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{res.startTime.toLocaleDateString()}</td>
                                    <td className="p-3 font-semibold text-primary text-right">{formatCurrency(res.totalCost)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentBookings;