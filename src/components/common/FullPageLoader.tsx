import React from 'react';
import { Car } from 'lucide-react';

const FullPageLoader: React.FC = () => {
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