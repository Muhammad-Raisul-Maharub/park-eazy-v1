
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import { Users, UserCog, Car, CircleDollarSign, ParkingSquare, CheckCircle, Clock, XCircle, PauseCircle } from 'lucide-react';
import { ReservationContext } from '../../contexts/ReservationContext';
import { UserContext } from '../../contexts/UserContext';
import { UserRole, ParkingSlotStatus, ReservationStatus } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import Card from '../../components/common/Card';

const SuperAdminDashboard: React.FC = () => {
    const userContext = useContext(UserContext);
    const reservationContext = useContext(ReservationContext);
    const navigate = useNavigate();

    if (!userContext || !reservationContext) return <div>Loading...</div>;

    const { users } = userContext;
    const { slots, reservations } = reservationContext;

    // User Stats
    const totalUsers = users.filter(u => u.role === UserRole.USER).length;
    const totalAdmins = users.filter(u => u.role === UserRole.ADMIN).length;

    // Reservation/Slot Stats
    const totalSlots = slots.length;
    const availableSlots = slots.filter(s => s.status === ParkingSlotStatus.AVAILABLE).length;
    const reservedSlots = slots.filter(s => s.status === ParkingSlotStatus.RESERVED).length;
    const occupiedSlots = slots.filter(s => s.status === ParkingSlotStatus.OCCUPIED).length;
    const busySlots = reservedSlots + occupiedSlots;
    const occupancyRate = totalSlots > 0 ? (busySlots / totalSlots) * 100 : 0;

    const activeReservationsCount = reservations.filter(r => r.status === ReservationStatus.ACTIVE).length;
    const totalRevenue = reservations.reduce((acc, res) => acc + res.totalCost, 0);

    const recentReservations = [...reservations].sort((a,b) => b.startTime.getTime() - a.startTime.getTime()).slice(0, 5);

    const getSlotById = (slotId: string) => slots.find(slot => slot.id === slotId);

    const slotStatusData = [
        { status: 'Available', count: availableSlots, color: 'bg-emerald-500', percentage: totalSlots > 0 ? (availableSlots/totalSlots)*100 : 0, icon: CheckCircle, textColor: 'text-emerald-500' },
        { status: 'Reserved', count: reservedSlots, color: 'bg-amber-500', percentage: totalSlots > 0 ? (reservedSlots/totalSlots)*100 : 0, icon: PauseCircle, textColor: 'text-amber-500' },
        { status: 'Occupied', count: occupiedSlots, color: 'bg-rose-500', percentage: totalSlots > 0 ? (occupiedSlots/totalSlots)*100 : 0, icon: XCircle, textColor: 'text-rose-500' },
    ];

    return (
        <div className="space-y-8 animate-fadeIn p-1">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Super Admin Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400">Platform-wide metrics and management.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Users & Financials */}
                <StatCard icon={Users} title="Total Users" value={totalUsers.toString()} change={5} changeType="increase" className="bg-white dark:bg-slate-800 border-l-4 border-l-blue-500" />
                <StatCard icon={UserCog} title="Admins" value={totalAdmins.toString()} change={1} changeType="increase" className="bg-white dark:bg-slate-800 border-l-4 border-l-indigo-500" />
                <StatCard icon={CircleDollarSign} title="Revenue" value={formatCurrency(totalRevenue)} change={15} changeType="increase" className="bg-white dark:bg-slate-800 border-l-4 border-l-emerald-500" />
                <StatCard icon={Clock} title="Occupancy" value={`${occupancyRate.toFixed(1)}%`} className="bg-white dark:bg-slate-800 border-l-4 border-l-amber-500" />
                
                {/* Operations */}
                <Link to="/manage-parkings" className="group">
                    <StatCard icon={ParkingSquare} title="Slots" value={totalSlots.toString()} className="h-full hover:shadow-md transition-shadow" />
                </Link>
                <StatCard icon={CheckCircle} title="Available" value={availableSlots.toString()} className="h-full" />
                <StatCard icon={Car} title="Active Res." value={activeReservationsCount.toString()} className="h-full" />
                <StatCard icon={ParkingSquare} title="Busy Slots" value={busySlots.toString()} className="h-full" />
            </div>

            {/* Recent Activity & Status Breakdown */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                 {/* Recent Reservations Table */}
                 <Card className="xl:col-span-2 border border-slate-200 dark:border-slate-700 shadow-md">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Reservations</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                             <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="pb-3 pl-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Slot</th>
                                    <th className="pb-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User ID</th>
                                    <th className="pb-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cost</th>
                                    <th className="pb-3 pr-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {recentReservations.map(res => {
                                    const slot = getSlotById(res.slotId);
                                    return (
                                        <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                            <td className="py-4 pl-2 font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">{slot?.name || 'N/A'}</td>
                                            <td className="py-4 text-xs font-mono text-slate-500 dark:text-slate-400">{res.userId.substring(0,8)}...</td>
                                            <td className="py-4 font-bold text-slate-700 dark:text-slate-200">{formatCurrency(res.totalCost)}</td>
                                            <td className="py-4 pr-2 text-right">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${res.status === ReservationStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`}>{res.status}</span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                 </Card>

                 {/* Slot Status Breakdown */}
                 <Card className="border border-slate-200 dark:border-slate-700 flex flex-col shadow-md h-fit">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Slot Status</h2>
                    
                    <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden mb-8 shadow-inner">
                        {slotStatusData.map((d, i) => (
                             <div 
                                key={d.status} 
                                className={`${d.color} h-full transition-all duration-500`} 
                                style={{ width: `${d.percentage}%` }}
                                title={`${d.status}: ${d.count}`}
                            />
                        ))}
                    </div>

                    <div className="space-y-3 flex-1">
                        {slotStatusData.map(d => {
                            const Icon = d.icon;
                            return (
                                <div key={d.status} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${d.color} bg-opacity-10 dark:bg-opacity-20`}>
                                            <Icon className={`w-5 h-5 ${d.textColor}`} />
                                        </div>
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{d.status}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="font-bold text-lg text-slate-900 dark:text-white">{d.count}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d.percentage.toFixed(0)}%</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                 </Card>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
