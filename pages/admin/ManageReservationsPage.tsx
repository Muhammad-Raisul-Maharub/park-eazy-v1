import React, { useContext } from 'react';
import { ReservationContext } from '../../contexts/ReservationContext';
import Card from '../../components/common/Card';
import { ReservationStatus } from '../../types';
import { formatCurrency } from '../../utils/formatters';

const ManageReservationsPage: React.FC = () => {
    const reservationContext = useContext(ReservationContext);

    if (!reservationContext) {
        return <div>Loading...</div>;
    }

    const { reservations, slots } = reservationContext;

    const getSlotName = (slotId: string) => {
        return slots.find(s => s.id === slotId)?.name || 'Unknown Slot';
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Reservations</h1>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Reservation ID</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Slot Name</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">User ID</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Start Time</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">End Time</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Cost</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.map(res => (
                                <tr key={res.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 text-sm font-mono text-slate-500 dark:text-slate-400 max-w-[120px] truncate" title={res.id}>{res.id}</td>
                                    <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{getSlotName(res.slotId)}</td>
                                    <td className="p-4 text-sm font-mono text-slate-500 dark:text-slate-400 max-w-[120px] truncate" title={res.userId}>{res.userId}</td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">{res.startTime.toLocaleString()}</td>
                                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">{res.endTime.toLocaleString()}</td>
                                    <td className="p-4 font-semibold text-primary">{formatCurrency(res.totalCost)}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                            res.status === ReservationStatus.ACTIVE ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' : 
                                            res.status === ReservationStatus.COMPLETED ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' :
                                            'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>{res.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ManageReservationsPage;