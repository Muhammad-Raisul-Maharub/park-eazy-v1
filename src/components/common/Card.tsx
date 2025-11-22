
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const CardComponent: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div 
      className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none rounded-3xl p-5 sm:p-8 border border-white/50 dark:border-slate-700 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(217,70,239,0.08)] dark:hover:shadow-none ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

const Card = React.memo(CardComponent);
export default Card;
