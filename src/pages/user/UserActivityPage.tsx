import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import Card from '../../components/common/Card';
import { formatTimestamp } from '../../utils/formatters';
import { RefreshCw, Activity } from 'lucide-react';
import Button from '../../components/common/Button';

interface ActivityLog {
    id: string;
    timestamp: string;
    action_type: string;
    details: string;
    actor_role: string;
}

const UserActivityPage: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('system_logs')
                .select('*')
                .eq('actor_id', user.id)
                .order('timestamp', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching user activity:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [user]);

    if (!user) return null;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    My Activity History
                </h2>
                <Button onClick={fetchLogs} variant="secondary" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Time</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Action</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={3} className="p-8 text-center">Loading activity...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={3} className="p-8 text-center text-slate-500">No activity recorded yet.</td></tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-xs">
                                            {formatTimestamp(new Date(log.timestamp))}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 font-mono text-xs font-bold rounded-full 
                                                ${log.action_type.includes('DELETE') ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                    log.action_type.includes('CREATE') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                                                        log.action_type.includes('UPDATE') ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                                                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                                {log.action_type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-700 dark:text-slate-300 text-sm">
                                            {log.details}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default UserActivityPage;
