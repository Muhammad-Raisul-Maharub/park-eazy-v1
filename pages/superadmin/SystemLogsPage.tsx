
import React, { useState, useMemo, useContext } from 'react';
import Card from '../../components/common/Card';
import { LogContext } from '../../contexts/LogContext';
import { formatTimestamp } from '../../utils/formatters';

const SystemLogsPage: React.FC = () => {
    const [filter, setFilter] = useState('ALL');
    const logContext = useContext(LogContext);
    const logs = logContext?.logs || [];
    
    const uniqueActions = useMemo(() => ['ALL', ...Array.from(new Set(logs.map(log => log.action)))], [logs]);

    const filteredLogs = useMemo(() => {
        if (filter === 'ALL') {
            return logs;
        }
        return logs.filter(log => log.action === filter);
    }, [filter, logs]);

    return (
        <div className="space-y-6 animate-fadeIn">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">System Logs</h1>

            <Card>
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <label htmlFor="log-filter" className="text-sm font-medium mr-2 text-slate-700 dark:text-slate-300">Filter by action:</label>
                    <select 
                        id="log-filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        {uniqueActions.map(action => (
                            <option key={action} value={action}>{action}</option>
                        ))}
                    </select>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="p-3 font-semibold text-sm text-slate-600 dark:text-slate-400">Timestamp</th>
                                <th className="p-3 font-semibold text-sm text-slate-600 dark:text-slate-400">Action</th>
                                <th className="p-3 font-semibold text-sm text-slate-600 dark:text-slate-400">User ID</th>
                                <th className="p-3 font-semibold text-sm text-slate-600 dark:text-slate-400">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm transition-colors">
                                    <td className="p-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono">{formatTimestamp(log.timestamp)}</td>
                                    <td className="p-3">
                                        <span className="px-2 py-1 font-mono text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{log.userId}</td>
                                    <td className="p-3 text-slate-700 dark:text-slate-300">{log.details}</td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">No logs found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default SystemLogsPage;
