
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'google';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const ButtonComponent: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  children, 
  className, 
  ...props 
}) => {
  // Candyland Base: Rounded-full (Pill), Poppins font (inherited), Smooth transforms
  const baseClasses = 'font-bold rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-opacity-50 flex items-center justify-center transform active:scale-95 shadow-sm relative overflow-hidden';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white hover:shadow-lg hover:shadow-fuchsia-500/40 hover:-translate-y-0.5 focus-visible:ring-fuchsia-300 border border-transparent',
    secondary: 'bg-white text-slate-700 border-2 border-slate-100 hover:border-fuchsia-200 hover:bg-fuchsia-50 hover:text-fuchsia-600 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:border-fuchsia-700 dark:hover:bg-slate-800 focus-visible:ring-slate-300',
    danger: 'bg-gradient-to-r from-rose-500 to-red-600 text-white hover:shadow-lg hover:shadow-rose-500/40 hover:-translate-y-0.5 focus-visible:ring-rose-300',
    google: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-white border-2 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 focus-visible:ring-slate-300',
  };

  const sizeClasses = {
    sm: 'py-1.5 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-8 text-lg tracking-wide',
  };

  const disabledClasses = 'disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:hover:translate-y-0';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2.5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="tracking-wide">Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

const Button = React.memo(ButtonComponent);
export default Button;
