
import React, { useContext } from 'react';
import StatCard from '../../components/common/StatCard';
import { TrendingUp, CircleDollarSign, Clock, ParkingSquare, CheckCircle, PauseCircle, XCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import { ReservationContext } from '../../contexts/ReservationContext';
import { ParkingSlotStatus } from '../../types';
import { formatCurrency } from '../../utils/formatters';


const DonutChart: React.FC<{ data: { status: string, count: number, color: string }[], total: number }> = ({ data, total }) => {
    if (total === 0) {
        return <div className="flex items-center justify-center h-48 w-48 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">No Data</div>;
    }

    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
            <circle cx="100" cy="100" r={radius} fill="none" strokeWidth="20" className="text-slate-200 dark:text-slate-700" stroke="currentColor" />
            {data.map(({ count, color }, index) => {
                const percentage = (count / total);
                const strokeDasharray = `${percentage * circumference} ${circumference}`;
                const segment = (
                    <circle
                        key={index}
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="none"
                        strokeWidth="20"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={-offset}
                        className={color.replace('bg-','text-')}
                        stroke="currentColor"
                        
                    />
                );
                offset += percentage * circumference;
                return segment;
            })}
             <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="text-3xl font-bold fill-current text-slate-800 dark:text-slate-100" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
                {total}
            </text>
             <text x="50%" y="65%" dominantBaseline="middle" textAnchor="middle" className="text-sm font-medium fill-current text-slate-500 dark:text-slate-400" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
                Slots
            </text>
        </svg>
    );
};

const AdminAnalyticsPage: React.FC = () => {
    const reservationContext = useContext(ReservationContext);
    const slots = reservationContext?.slots || [];

    // Mock data for charts
    const revenueData = [
        { type: 'Car', revenue: 12000 },
        { type: 'SUV', revenue: 9500 },
        { type: 'Bike', revenue: 4500 },
        { type: 'Minivan', revenue: 3000 },
    ];
    const maxRevenue = Math.max(...revenueData.map(d => d.revenue));

    // Slot status data
    const totalSlots = slots.length;
    const availableSlots = slots.filter(s => s.status === ParkingSlotStatus.AVAILABLE).length;
    const reservedSlots = slots.filter(s => s.status === ParkingSlotStatus.RESERVED).length;
    const occupiedSlots = slots.filter(s => s.status === ParkingSlotStatus.OCCUPIED).length;

    const slotStatusData = [
        { status: 'Available', count: availableSlots, color: 'bg-emerald-500', icon: CheckCircle, textColor: 'text-emerald-500' },
        { status: 'Reserved', count: reservedSlots, color: 'bg-amber-500', icon: PauseCircle, textColor: 'text-amber-500' },
        { status: 'Occupied', count: occupiedSlots, color: 'bg-rose-500', icon: XCircle, textColor: 'text-rose-500' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Analytics</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={TrendingUp} title="Occupancy Trend" value="+2.5%" change={2.5} changeType="increase" className="border-l-4 border-l-primary"/>
                <StatCard icon={CircleDollarSign} title="Avg. Revenue/Slot" value={formatCurrency(350.75)} change={5} changeType="increase" className="border-l-4 border-l-emerald-500"/>
                <StatCard icon={Clock} title="Peak Hours" value="5 PM - 8 PM" className="border-l-4 border-l-amber-500"/>
                <StatCard icon={ParkingSquare} title="Most Used Slot Type" value="SUV" className="border-l-4 border-l-blue-500"/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Revenue by Slot Type (Monthly)</h2>
                    <div className="space-y-5">
                        {revenueData.map(item => (
                            <div key={item.type} className="flex items-center group">
                                <span className="w-24 text-sm font-bold text-slate-600 dark:text-slate-400">{item.type}</span>
                                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-fuchsia-500 to-violet-600 h-full rounded-full flex items-center justify-end px-2 transition-all duration-500 group-hover:opacity-90"
                                        style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                                    >
                                    </div>
                                </div>
                                <span className="ml-4 w-20 text-xs font-bold text-slate-700 dark:text-white text-right">{formatCurrency(item.revenue)}</span>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Live Slot Status Distribution</h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-10">
                        <div className="relative transform hover:scale-105 transition-transform duration-300">
                            <DonutChart data={slotStatusData} total={totalSlots} />
                        </div>
                        <ul className="space-y-4 w-full sm:w-auto">
                            {slotStatusData.map(d => {
                                const Icon = d.icon;
                                const percentage = totalSlots > 0 ? ((d.count / totalSlots) * 100).toFixed(1) : "0.0";
                                return (
                                    <li key={d.status} className="flex items-center text-sm p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                        <div className={`p-2 rounded-lg ${d.color} bg-opacity-10 mr-3`}>
                                            <Icon className={`w-4 h-4 ${d.textColor}`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-700 dark:text-slate-200">{d.status}</p>
                                            <p className="text-xs text-slate-500">{d.count} slots</p>
                                        </div>
                                        <span className="font-bold text-slate-800 dark:text-white ml-4">{percentage}%</span>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminAnalyticsPage;
