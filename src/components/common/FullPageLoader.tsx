import React, { useState, useEffect } from 'react';
import { Car, AlertCircle, RefreshCw } from 'lucide-react';

interface FullPageLoaderProps {
  timeout?: number; // Timeout in milliseconds
}

const FullPageLoader: React.FC<FullPageLoaderProps> = ({ timeout = 60000 }) => {
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (timeout > 0) {
      const timer = setTimeout(() => {
        setShowError(true);
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [timeout]);

  const handleRetry = () => {
    window.location.reload();
  };

  if (showError) {
    return (
      <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center z-50 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-red-500/10 p-4 rounded-full">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Loading Taking Too Long
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              The application is taking longer than expected to load. This might be due to:
            </p>
            <ul className="text-sm text-slate-500 dark:text-slate-400 text-left space-y-2 w-full">
              <li>• Slow network connection</li>
              <li>• Database connectivity issues</li>
              <li>• Cached session data conflicts</li>
            </ul>
            <button
              onClick={handleRetry}
              className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              Reload Page
            </button>
            <p className="text-xs text-slate-400">
              If the issue persists, try clearing your browser cache and cookies.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center z-50" role="status" aria-live="polite">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-24 w-24 border-4 border-primary/20 rounded-full animate-spin"></div>
        <Car className="h-12 w-12 text-primary animate-pulse" />
      </div>
      <p className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-300 tracking-wide">
        Loading Park-Eazy...
      </p>
    </div>
  );
};

export default FullPageLoader;