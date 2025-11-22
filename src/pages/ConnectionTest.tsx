import React, { useState, useEffect } from 'react';
import { testSupabaseConnection } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Wifi } from 'lucide-react';

const ConnectionTest: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [details, setDetails] = useState('');
    const [envInfo, setEnvInfo] = useState<any>({});

    useEffect(() => {
        // Check env vars (safe to show existence, not values)
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

        setEnvInfo({
            hasUrl: !!url,
            urlLength: url?.length || 0,
            urlStart: url ? url.substring(0, 8) + '...' : 'Missing',
            hasKey: !!key,
            keyLength: key?.length || 0
        });

        runTest();
    }, []);

    const runTest = async () => {
        setStatus('testing');
        setMessage('Testing connection to Supabase...');
        setDetails('');

        try {
            const startTime = Date.now();
            const result = await testSupabaseConnection();
            const duration = Date.now() - startTime;

            if (result) {
                setStatus('success');
                setMessage(`Connected successfully in ${duration}ms`);
            } else {
                setStatus('error');
                setMessage('Connection failed');
                setDetails('Check console for detailed error logs. Possible causes: Network blocked, wrong keys, or Supabase down.');
            }
        } catch (err: any) {
            setStatus('error');
            setMessage('Test threw an exception');
            setDetails(err.message || String(err));
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-8 flex flex-col items-center justify-center">
            <div className="max-w-md w-full bg-[#1e293b] rounded-2xl p-8 border border-slate-700 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Wifi className="text-[#10b981]" />
                        Network Check
                    </h1>
                    <Link to="/login" className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                </div>

                <div className="space-y-6">
                    {/* Env Var Check */}
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Configuration</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Supabase URL:</span>
                                <span className={envInfo.hasUrl ? "text-green-400" : "text-red-400"}>
                                    {envInfo.hasUrl ? `Present (${envInfo.urlStart})` : "MISSING"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Anon Key:</span>
                                <span className={envInfo.hasKey ? "text-green-400" : "text-red-400"}>
                                    {envInfo.hasKey ? "Present" : "MISSING"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Connection Status */}
                    <div className={`p-6 rounded-xl border flex flex-col items-center text-center gap-4 transition-all ${status === 'testing' ? 'bg-blue-500/10 border-blue-500/30' :
                            status === 'success' ? 'bg-green-500/10 border-green-500/30' :
                                status === 'error' ? 'bg-red-500/10 border-red-500/30' :
                                    'bg-slate-800 border-slate-700'
                        }`}>
                        {status === 'testing' && <RefreshCw className="h-12 w-12 text-blue-400 animate-spin" />}
                        {status === 'success' && <CheckCircle className="h-12 w-12 text-green-400" />}
                        {status === 'error' && <XCircle className="h-12 w-12 text-red-400" />}

                        <div>
                            <h2 className="text-xl font-bold mb-1">
                                {status === 'testing' ? 'Testing...' :
                                    status === 'success' ? 'Online' :
                                        status === 'error' ? 'Connection Failed' : 'Ready'}
                            </h2>
                            <p className="text-slate-300">{message}</p>
                        </div>
                    </div>

                    {details && (
                        <div className="bg-red-950/30 p-4 rounded-lg border border-red-900/50 text-red-200 text-sm font-mono break-words">
                            {details}
                        </div>
                    )}

                    <button
                        onClick={runTest}
                        disabled={status === 'testing'}
                        className="w-full py-3 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw className={`h-5 w-5 ${status === 'testing' ? 'animate-spin' : ''}`} />
                        Run Test Again
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConnectionTest;
