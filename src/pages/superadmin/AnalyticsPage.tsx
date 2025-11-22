import React, { useContext, useState, useMemo } from 'react';
import StatCard from '../../components/common/StatCard';
import { Users, UserCog, TrendingUp, CircleDollarSign, Activity, Server, Database, ArrowUpRight } from 'lucide-react';
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

// --- Interactive Charts ---

interface ChartProps {
    data: number[];
    labels: string[];
    color?: string;
    fillColor?: string; // For area charts
    title: string;
    subtitle?: string;
    valuePrefix?: string;
    valueSuffix?: string;
    type: 'area' | 'line';
}

const InteractiveChart: React.FC<ChartProps> = ({ 
    data, 
    labels, 
    color = '#10b981', 
    fillColor,
    title, 
    subtitle,
    valuePrefix = '', 
    valueSuffix = '',
    type
}) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    
    // Calculate min/max for scaling with padding
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal || 1;
    const padding = range * 0.2; // 20% padding
    const displayMax = maxVal + padding;
    const displayMin = Math.max(0, minVal - padding);
    const displayRange = displayMax - displayMin;

    const points = useMemo(() => data.map((val, i) => ({
        x: (i / (data.length - 1)) * 100,
        y: 100 - ((val - displayMin) / displayRange) * 100,
        val,
        label: labels[i]
    })), [data, labels, displayMin, displayRange]);

    const linePath = getSmoothPath(points);
    const areaPath = `${linePath} L 100 100 L 0 100 Z`;

    // Current or Hovered Value
    const displayIndex = activeIndex !== null ? activeIndex : data.length - 1;
    const displayValue = points[displayIndex].val;
    const displayLabel = activeIndex !== null ? points[displayIndex].label : 'Current';

    return (
        <Card className="flex flex-col h-[380px] border border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800 transition-all duration-300 hover:shadow-xl overflow-visible relative group">
            <div className="flex justify-between items-start mb-6 px-2 z-10">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{subtitle || 'Yearly Performance'}</p>
                </div>
                <div className="text-right animate-fadeIn">
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {valuePrefix}{displayValue.toLocaleString()}{valueSuffix}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                        {displayLabel}
                    </p>
                </div>
            </div>
            
            {/* Chart Area */}
            <div className="relative w-full flex-1 mb-2">
                {/* SVG Layer for Path */}
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id={`gradient-${title.replace(/\s/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={fillColor || color} stopOpacity={type === 'area' ? 0.4 : 0.1} />
                            <stop offset="100%" stopColor={fillColor || color} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    
                    {/* Horizontal Grid Lines */}
                    {[0, 25, 50, 75, 100].map((y) => (
                        <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" className="text-slate-100 dark:text-slate-700/50" strokeWidth="0.5" strokeDasharray="3,3" vectorEffect="non-scaling-stroke" />
                    ))}

                    {/* Area Path */}
                    {type === 'area' && (
                        <path d={areaPath} fill={`url(#gradient-${title.replace(/\s/g, '')})`} className="transition-all duration-500" />
                    )}
                    
                    {/* Line Path */}
                    <path 
                        d={linePath} 
                        fill="none" 
                        stroke={color} 
                        strokeWidth="3" 
                        vectorEffect="non-scaling-stroke" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="drop-shadow-md"
                    />
                </svg>

                {/* HTML Overlay for Interactive Elements (Dots & Tooltips) */}
                <div className="absolute inset-0 w-full h-full">
                    {points.map((p, i) => (
                        <div 
                            key={i}
                            className="absolute top-0 h-full flex flex-col items-center justify-end group/point cursor-crosshair"
                            style={{ left: `${p.x}%`, width: `${100/points.length}%`, transform: 'translateX(-50%)' }}
                            onMouseEnter={() => setActiveIndex(i)}
                            onMouseLeave={() => setActiveIndex(null)}
                        >
                            {/* Hover Line */}
                            <div 
                                className={`absolute top-0 bottom-0 w-px border-l border-dashed border-slate-300 dark:border-slate-600 transition-opacity duration-200 ${activeIndex === i ? 'opacity-100' : 'opacity-0'}`} 
                            />

                            {/* The Dot - Positioned absolutely based on value */}
                            <div 
                                className={`absolute w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 shadow-lg transition-all duration-200 z-20 flex items-center justify-center ${activeIndex === i ? 'scale-125 opacity-100 ring-4 ring-white/20 dark:ring-slate-700/40' : 'scale-0 opacity-0'}`}
                                style={{ top: `${p.y}%`, backgroundColor: color, transform: 'translateY(-50%)' }}
                            >
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between px-2 pb-4 border-t border-transparent">
                 {labels.map((label, i) => (
                     <div 
                        key={i} 
                        className={`text-[10px] font-bold uppercase tracking-wider text-center flex-1 transition-colors duration-200 ${activeIndex === i ? 'text-slate-900 dark:text-white scale-110' : 'text-slate-400 dark:text-slate-500'}`}
                    >
                         {label}
                     </div>
                 ))}
            </div>
        </Card>
    );
};

const ModernBarChart: React.FC<{ data: { label: string, value: number }[], title: string }> = ({ data, title }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <Card className="flex flex-col h-[380px] border border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800 transition-all duration-300 hover:shadow-xl">
             <div className="flex justify-between items-start mb-8 px-2">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
                 <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                 </div>
             </div>
             <div className="flex-1 flex items-end justify-between gap-4 px-4 min-h-[200px]">
                 {data.map((d, i) => (
                     <div key={i} className="flex flex-col items-center gap-3 flex-1 group h-full justify-end relative">
                         <div className="w-full bg-slate-100 dark:bg-slate-700/30 rounded-t-2xl relative overflow-hidden flex-1 min-h-[20px] group-hover:bg-slate-200 dark:group-hover:bg-slate-700/50 transition-colors">
                             <div 
                                className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-violet-600 to-fuchsia-500 rounded-t-2xl transition-all duration-700 ease-out group-hover:shadow-[0_0_20px_rgba(192,38,211,0.3)]"
                                style={{ height: `${(d.value / max) * 100}%` }}
                             >
                                 <div className="absolute top-0 left-0 w-full h-[1px] bg-white/30" />
                             </div>
                         </div>
                         <div className="text-center">
                            <p className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">{formatCurrency(d.value)}</p>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{d.label}</span>
                         </div>
                     </div>
                 ))}
             </div>
        </Card>
    );
};

const DonutChart: React.FC<{ data: { status: string, count: number, color: string }[], total: number, title: string }> = ({ data, total, title }) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <Card className="flex flex-col h-[380px] border border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800 transition-all duration-300 hover:shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 px-2">{title}</h3>
            <div className="flex-1 flex items-center justify-center py-4 relative">
                 <div className="relative w-56 h-56 group">
                    <svg width="100%" height="100%" viewBox="0 0 200 200" className="transform -rotate-90 drop-shadow-xl">
                        {/* Background Circle */}
                        <circle cx="100" cy="100" r={radius} fill="none" strokeWidth="20" className="text-slate-100 dark:text-slate-700/30" stroke="currentColor" />
                        
                        {/* Segments */}
                        {data.map(({ count, color }, index) => {
                            const percentage = total > 0 ? (count / total) : 0;
                            const strokeDasharray = `${percentage * circumference} ${circumference}`;
                            const segment = (
                                <circle 
                                    key={index} 
                                    cx="100" cy="100" r={radius} 
                                    fill="none" 
                                    strokeWidth="20" 
                                    strokeDasharray={strokeDasharray} 
                                    strokeDashoffset={-offset} 
                                    strokeLinecap="round"
                                    className={`${color.replace('bg-','text-')} transition-all duration-500 hover:stroke-[24px] hover:opacity-90 cursor-pointer`} 
                                    stroke="currentColor" 
                                />
                            );
                            offset += percentage * circumference;
                            return segment;
                        })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-fadeIn">
                        <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{total}</span>
                        <span className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Total Slots</span>
                    </div>
                 </div>
            </div>
            <div className="flex justify-center flex-wrap gap-4 pb-4">
                {data.map(d => (
                    <div key={d.status} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/30 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div className={`w-2.5 h-2.5 rounded-full ${d.color} shadow-sm`} />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{d.status}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white ml-1">{d.count}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const SystemHealthCard: React.FC = () => (
    <Card className="h-[380px] border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col relative overflow-hidden justify-between bg-white dark:bg-slate-800 transition-all duration-300 hover:shadow-xl">
        <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
            <Activity size={200} className="text-slate-900 dark:text-white" />
        </div>
        
        <div className="flex justify-between items-center mb-6 px-2 z-10">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">System Health</h3>
            <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Operational
            </div>
        </div>

        <div className="space-y-8 flex-1 z-10 px-2 justify-center flex flex-col">
            <div className="group">
                <div className="flex justify-between text-xs mb-2.5">
                    <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-2"><Server size={14} className="text-primary"/> API Uptime</span>
                    <span className="text-emerald-500 font-black font-mono">99.98%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000 w-[99.98%] shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40"></div>
                </div>
            </div>
            
            <div className="group">
                <div className="flex justify-between text-xs mb-2.5">
                    <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-2"><Activity size={14} className="text-blue-500"/> Response Time</span>
                    <span className="text-blue-500 font-black font-mono">45ms</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-400 h-full rounded-full transition-all duration-1000 w-[92%] shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40"></div>
                </div>
            </div>

             <div className="group">
                <div className="flex justify-between text-xs mb-2.5">
                    <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-2"><Database size={14} className="text-amber-500"/> DB Load</span>
                    <span className="text-amber-500 font-black font-mono">24%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-1000 w-[24%] shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40"></div>
                </div>
            </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50 text-[10px] font-medium text-slate-400 text-center uppercase tracking-widest">
            Last updated: Just now
        </div>
    </Card>
)

const SuperAdminAnalyticsPage: React.FC = () => {
    const reservationContext = useContext(ReservationContext);
    const slots = reservationContext?.slots || [];
    
    // 12-Month Cycle Data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Mock Data for 12 months
    const userGrowthData = [120, 135, 155, 180, 220, 250, 290, 340, 380, 410, 450, 500]; 
    const revenueTrendData = [15, 22, 28, 25, 42, 58, 65, 60, 78, 85, 98, 125]; 
    
    const revenueByTypeData = [ 
        { label: 'Car', value: 25000 }, 
        { label: 'SUV', value: 18500 }, 
        { label: 'Bike', value: 8500 }, 
        { label: 'Minivan', value: 6000 }
    ];

    // Slot status calculation
    const totalSlots = slots.length;
    const availableSlots = slots.filter(s => s.status === ParkingSlotStatus.AVAILABLE).length;
    const reservedSlots = slots.filter(s => s.status === ParkingSlotStatus.RESERVED).length;
    const occupiedSlots = slots.filter(s => s.status === ParkingSlotStatus.OCCUPIED).length;

    const slotStatusData = [
        { status: 'Available', count: availableSlots, color: 'bg-emerald-500' },
        { status: 'Reserved', count: reservedSlots, color: 'bg-amber-500' },
        { status: 'Occupied', count: occupiedSlots, color: 'bg-rose-500' },
    ];
    
    // Calculate totals for stat cards
    const totalRevenue = revenueTrendData.reduce((a, b) => a + b, 0) * 1000; // Assuming data is in k
    const totalUsers = userGrowthData[userGrowthData.length - 1];

    return (
        <div className="space-y-8 animate-fadeIn pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Analytics Overview</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-base">Platform performance metrics for the last 12 months.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                        Export Report
                    </button>
                </div>
            </div>

            {/* Top Row: Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Users} title="Total Users" value={totalUsers.toString()} change={12} changeType="increase" className="bg-white dark:bg-slate-800 border-l-4 border-l-emerald-500" />
                <StatCard icon={UserCog} title="Admins" value="8" change={0} className="bg-white dark:bg-slate-800 border-l-4 border-l-blue-500" />
                <StatCard icon={TrendingUp} title="Growth (MoM)" value="+15.2%" change={2.4} changeType="increase" className="bg-white dark:bg-slate-800 border-l-4 border-l-violet-500" />
                <StatCard icon={CircleDollarSign} title="Total Revenue" value={formatCurrency(totalRevenue)} change={8} changeType="increase" className="bg-white dark:bg-slate-800 border-l-4 border-l-fuchsia-500" />
            </div>

            {/* Middle Row: Major Interactive Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <InteractiveChart 
                    type="area"
                    title="User Growth" 
                    subtitle="New user registrations per month"
                    data={userGrowthData} 
                    labels={months} 
                    color="#10b981" 
                    fillColor="#10b981"
                />
                <InteractiveChart 
                    type="line"
                    title="Monthly Revenue Trend" 
                    subtitle="Revenue generated across all parking slots"
                    data={revenueTrendData} 
                    labels={months} 
                    color="#8b5cf6"
                    valuePrefix="৳"
                    valueSuffix="k"
                />
            </div>

             {/* Bottom Row: Detailed Stats */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ModernBarChart title="Revenue by Vehicle Type" data={revenueByTypeData} />
                <DonutChart title="Live Slot Status" data={slotStatusData} total={totalSlots} />
                <SystemHealthCard />
             </div>
        </div>
    );
};

export default SuperAdminAnalyticsPage;