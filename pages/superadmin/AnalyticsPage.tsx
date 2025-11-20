
import React, { useContext } from 'react';
import StatCard from '../../components/common/StatCard';
import { Users, UserCog, TrendingUp, CircleDollarSign, Activity, Server } from 'lucide-react';
import Card from '../../components/common/Card';
import { ReservationContext } from '../../contexts/ReservationContext';
import { ParkingSlotStatus } from '../../types';
import { formatCurrency } from '../../utils/formatters';

// --- Helper for Smooth Curves ---
const getSmoothPath = (points: { x: number; y: number }[]) => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p1.x - (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p1.x} ${p1.y}`;
  }
  return d;
};

// --- Custom SVG Charts ---

const ModernAreaChart: React.FC<{ data: number[], labels: string[], color?: string, height?: number, title: string }> = ({ data, labels, color = '#10b981', height = 180, title }) => {
    const max = Math.max(...data, 1) * 1.2; 
    const min = 0;
    const points = data.map((val, i) => ({
        x: (i / (data.length - 1)) * 100,
        y: 100 - ((val - min) / (max - min)) * 100
    }));
    const linePath = getSmoothPath(points);
    const areaPath = `${linePath} L 100 100 L 0 100 Z`;

    return (
        <Card className="flex flex-col h-full border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 px-1">{title}</h3>
            <div className="relative w-full flex-1 min-h-[160px]">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {[0, 50, 100].map((y) => (<line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" className="text-slate-100 dark:text-slate-700" strokeWidth="0.5" />))}
                    <path d={areaPath} fill={`url(#gradient-${color})`} />
                    <path d={linePath} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                    {points.map((p, i) => (<circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color} className="opacity-0 group-hover:opacity-100 transition-opacity" />))}
                </svg>
            </div>
            <div className="flex justify-between mt-2 px-1">
                {labels.map((label, i) => (<span key={i} className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">{label}</span>))}
            </div>
        </Card>
    );
};

const ModernLineChart: React.FC<{ data: number[], labels: string[], color?: string, height?: number, title: string }> = ({ data, labels, color = '#3b82f6', height = 180, title }) => {
    const max = Math.max(...data, 1) * 1.2;
    const points = data.map((val, i) => ({ x: (i / (data.length - 1)) * 100, y: 100 - (val / max) * 80 - 10 }));
    const linePath = getSmoothPath(points);

    return (
         <Card className="flex flex-col h-full border border-slate-200 dark:border-slate-700 shadow-sm group">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 px-1">{title}</h3>
            <div className="relative w-full flex-1 min-h-[160px]">
                 <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <path d={linePath} fill="none" stroke={color} strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md" />
                    {points.map((p, i) => (<circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke={color} strokeWidth="1.5" className="opacity-0 group-hover:opacity-100 transition-opacity" />))}
                 </svg>
            </div>
             <div className="flex justify-between mt-2 px-1">
                {labels.map((label, i) => (<span key={i} className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">{label}</span>))}
            </div>
         </Card>
    );
}

const ModernBarChart: React.FC<{ data: { label: string, value: number }[], color?: string, height?: number, title: string }> = ({ data, color = '#8b5cf6', height = 180, title }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <Card className="flex flex-col h-full border border-slate-200 dark:border-slate-700 shadow-sm">
             <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 px-1">{title}</h3>
             <div className="flex-1 flex items-end justify-between gap-2 px-1 min-h-[160px]">
                 {data.map((d, i) => (
                     <div key={i} className="flex flex-col items-center gap-2 flex-1 group h-full justify-end">
                         <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-md relative overflow-hidden flex-1">
                             <div 
                                className="absolute bottom-0 left-0 w-full bg-violet-500 rounded-t-md transition-all duration-500 group-hover:bg-violet-600"
                                style={{ height: `${(d.value / max) * 100}%` }}
                             />
                         </div>
                         <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">{d.label}</span>
                     </div>
                 ))}
             </div>
        </Card>
    );
};

const DonutChart: React.FC<{ data: { status: string, count: number, color: string }[], total: number, title: string }> = ({ data, total, title }) => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <Card className="flex flex-col h-full border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 px-1">{title}</h3>
            <div className="flex-1 flex items-center justify-center py-2">
                 <div className="relative w-40 h-40">
                    <svg width="100%" height="100%" viewBox="0 0 200 200" className="transform -rotate-90">
                        <circle cx="100" cy="100" r={radius} fill="none" strokeWidth="20" className="text-slate-100 dark:text-slate-800" stroke="currentColor" />
                        {data.map(({ count, color }, index) => {
                            const percentage = total > 0 ? (count / total) : 0;
                            const strokeDasharray = `${percentage * circumference} ${circumference}`;
                            const segment = <circle key={index} cx="100" cy="100" r={radius} fill="none" strokeWidth="20" strokeDasharray={strokeDasharray} strokeDashoffset={-offset} className={color.replace('bg-','text-')} stroke="currentColor" />;
                            offset += percentage * circumference;
                            return segment;
                        })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{total}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide">Slots</span>
                    </div>
                 </div>
            </div>
            <div className="flex justify-center gap-3 pb-1">
                {data.map(d => (
                    <div key={d.status} className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${d.color}`} />
                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{d.status}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const SystemHealthCard: React.FC = () => (
    <Card className="h-full border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col relative overflow-hidden justify-between">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Activity size={60} className="text-primary" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 z-10">System Health</h3>
        <div className="space-y-4 flex-1 z-10">
            <div>
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2"><Server size={12}/> API Uptime</span>
                    <span className="text-emerald-500 font-bold">99.98%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '99.98%' }}></div>
                </div>
            </div>
            <div>
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2"><Activity size={12}/> Response Time</span>
                    <span className="text-blue-500 font-bold">45ms</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: '92%' }}></div>
                </div>
            </div>
             <div>
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2"><CircleDollarSign size={12}/> DB Load</span>
                    <span className="text-amber-500 font-bold">24%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '24%' }}></div>
                </div>
            </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[10px] font-medium text-slate-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            All Systems Operational
        </div>
    </Card>
)

const SuperAdminAnalyticsPage: React.FC = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const userGrowthData = [20, 35, 45, 55, 80, 100]; 
    const revenueTrendData = [15, 25, 22, 40, 48, 65]; 
    const revenueByTypeData = [ { label: 'Car', value: 12000 }, { label: 'SUV', value: 9500 }, { label: 'Bike', value: 4500 }, { label: 'Minivan', value: 3000 }];

    const reservationContext = useContext(ReservationContext);
    const slots = reservationContext?.slots || [];
    const totalSlots = slots.length;
    const availableSlots = slots.filter(s => s.status === ParkingSlotStatus.AVAILABLE).length;
    const reservedSlots = slots.filter(s => s.status === ParkingSlotStatus.RESERVED).length;
    const occupiedSlots = slots.filter(s => s.status === ParkingSlotStatus.OCCUPIED).length;

    const slotStatusData = [
        { status: 'Available', count: availableSlots, color: 'bg-emerald-500' },
        { status: 'Reserved', count: reservedSlots, color: 'bg-amber-500' },
        { status: 'Occupied', count: occupiedSlots, color: 'bg-rose-500' },
    ];

    return (
        <div className="space-y-6 animate-fadeIn p-1 pb-10">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Analytics Overview</h1>
                <p className="text-slate-500 dark:text-slate-400">Deep dive into platform performance.</p>
            </div>

            {/* Top Row: Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} title="New Users" value="120" change={15} changeType="increase" className="bg-white dark:bg-slate-800 border-l-4 border-l-blue-500" />
                <StatCard icon={UserCog} title="New Admins" value="2" change={1} changeType="increase" className="bg-white dark:bg-slate-800 border-l-4 border-l-indigo-500" />
                <StatCard icon={TrendingUp} title="Growth" value="+15.2%" change={15.2} changeType="increase" className="bg-white dark:bg-slate-800 border-l-4 border-l-emerald-500" />
                <StatCard icon={CircleDollarSign} title="Revenue" value="৳125k" change={22} changeType="increase" className="bg-white dark:bg-slate-800 border-l-4 border-l-amber-500" />
            </div>

            {/* Middle Row: Major Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ModernAreaChart title="User Growth" data={userGrowthData} labels={months} color="#10b981" />
                <ModernLineChart title="Monthly Revenue Trend" data={revenueTrendData} labels={months} color="#3b82f6" />
            </div>

             {/* Bottom Row: Detailed Stats */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <ModernBarChart title="Revenue by Type" data={revenueByTypeData} />
                <DonutChart title="Slot Status" data={slotStatusData} total={totalSlots} />
                <SystemHealthCard />
             </div>
        </div>
    );
};

export default SuperAdminAnalyticsPage;
