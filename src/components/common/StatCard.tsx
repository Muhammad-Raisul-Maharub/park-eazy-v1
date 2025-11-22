
import React from 'react';
import Card from './Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  className?: string;
}

const StatCardComponent: React.FC<StatCardProps> = ({ icon: Icon, title, value, change, changeType, className }) => {
  const isIncrease = changeType === 'increase' || (changeType === undefined && change && change > 0);

  return (
    <Card className={`relative overflow-hidden group hover:shadow-lg dark:hover:shadow-primary/10 transition-all duration-300 border border-slate-100 dark:border-slate-700 ${className}`}>
      {/* Background decoration */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out" />
      
      <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-xl bg-gradient-to-br from-fuchsia-50 to-violet-100 dark:from-slate-800 dark:to-slate-700 text-fuchsia-600 dark:text-fuchsia-400 shadow-sm group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-6 w-6" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${isIncrease ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'}`}>
              {isIncrease ? <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> : <ArrowDownRight className="h-3.5 w-3.5 mr-1" />}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{value}</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{title}</p>
        </div>
      </div>
    </Card>
  );
};

const StatCard = React.memo(StatCardComponent);
export default StatCard;
