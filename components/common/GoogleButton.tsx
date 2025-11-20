
import React from 'react';
import GoogleIcon from './GoogleIcon';

interface GoogleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: React.ReactNode;
}

const GoogleButton: React.FC<GoogleButtonProps> = ({
  isLoading = false,
  children,
  className = "",
  ...props
}) => {
  return (
    <button
      type="button"
      className={`w-full h-12 px-4 flex items-center justify-center gap-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 shadow-sm active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </div>
      ) : (
        <>
          <div className="flex-shrink-0 flex items-center justify-center w-5 h-5">
             <GoogleIcon />
          </div>
          <span className="mt-0.5">{children}</span>
        </>
      )}
    </button>
  );
};

export default GoogleButton;
