
import React, { useState, useEffect, useContext } from 'react';
import Card from '../../components/common/Card';
import { formatTimestamp } from '../../utils/formatters';
import { supabase } from '../../lib/supabaseClient';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';
import Button from '../../components/common/Button';

interface EnrichedLog {
    id: string;
    timestamp: string;
    action_type: string;
    details: string;
    actor_role: string;
    actor_id: string;
    user_profiles?: {
        name: string;
        email: string;
    };
}

const SystemLogsPage: React.FC = () => {
    const [logs, setLogs] = useState<EnrichedLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [actionFilter, setActionFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('system_logs')
                .select(`
                    *,
                    user_profiles (
                        name,
                        email
                    )
                `)
                .order('timestamp', { ascending: false });

            if (roleFilter !== 'ALL') {
                query = query.eq('actor_role', roleFilter);
            }
            if (actionFilter !== 'ALL') {
                query = query.eq('action_type', actionFilter);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Client-side search for details/name/email (Supabase ILIKE on joined tables is complex)
            let filteredData = (data || []) as EnrichedLog[];

            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase();
                filteredData = filteredData.filter(log =>
                    log.details?.toLowerCase().includes(lowerQuery) ||
                    log.user_profiles?.name?.toLowerCase().includes(lowerQuery) ||
                    log.user_profiles?.email?.toLowerCase().includes(lowerQuery) ||
                    log.action_type?.toLowerCase().includes(lowerQuery)
                );
            }

            setLogs(filteredData);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [roleFilter, actionFilter]); // Re-fetch on filter change (except search, which is client-side for speed)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) fetchLogs();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const uniqueActions = Array.from(new Set(logs.map(log => log.action_type)));

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">System Logs</h1>
                <Button onClick={fetchLogs} variant="secondary" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </div>

            <Card>
                {/* Filters Toolbar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                            >
                                <option value="ALL">All Roles</option>
                                <option value="super_admin">Super Admin</option>
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                                <option value="system">System</option>
                            </select>
                        </div>

                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={actionFilter}
                                onChange={(e) => setActionFilter(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary max-w-[200px]"
                            >
                                <option value="ALL">All Actions</option>
                                {uniqueActions.map(action => (
                                    <option key={action} value={action}>{action}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Timestamp</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Actor</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Action</th>
                                <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-400">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center">Loading logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No logs found matching your filters.</td></tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm transition-colors">
                                        <td className="p-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-xs">
                                            {formatTimestamp(new Date(log.timestamp))}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900 dark:text-white">
                                                    {log.user_profiles?.name || 'System / Unknown'}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {log.user_profiles?.email || log.actor_role}
                                                </span>
                                            </div>
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
                                        <td className="p-4 text-slate-700 dark:text-slate-300 max-w-md truncate" title={log.details}>
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

export default SystemLogsPage;
