
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, LucideIcon } from 'lucide-react';

interface NavLink {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface SidebarProps {
  navLinks: NavLink[];
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  isMobileFriendly: boolean;
  className?: string;
  textColor?: string;
  hoverBg?: string;
  activeBg?: string;
  activeTextColor?: string;
  logoBorderColor?: string;
  logoComponent?: React.ReactNode;
  mobileLogoComponent?: React.ReactNode;
}

const DefaultLogo: React.FC<{ isCollapsed: boolean, logoBorderColor?: string }> = ({ isCollapsed, logoBorderColor }) => (
    <div className={`p-6 flex items-center ${logoBorderColor || 'border-transparent'} h-[80px] overflow-hidden ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
        {!isCollapsed && (
            <h1 className="text-2xl font-extrabold ml-1 bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-violet-600 whitespace-nowrap tracking-tight">Park-Eazy</h1>
        )}
    </div>
);

const NavContent: React.FC<Pick<SidebarProps, 'navLinks' | 'sidebarOpen' | 'setSidebarOpen' | 'isSidebarCollapsed' | 'textColor' | 'hoverBg' | 'activeBg' | 'activeTextColor' | 'logoBorderColor' | 'logoComponent' | 'mobileLogoComponent'>> = 
({ navLinks, sidebarOpen, setSidebarOpen, isSidebarCollapsed, textColor, hoverBg, activeBg, activeTextColor, logoBorderColor, logoComponent }) => {
  const location = useLocation();

  return (
    <div className="h-full flex flex-col py-2">
        {logoComponent ? logoComponent : <DefaultLogo isCollapsed={isSidebarCollapsed} logoBorderColor={logoBorderColor} />}
      <nav className="flex-1 mt-6 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                title={isSidebarCollapsed ? link.name : undefined}
                onClick={() => sidebarOpen && setSidebarOpen(false)}
                className={`flex items-center px-4 py-3.5 rounded-2xl transition-all duration-200 group relative overflow-hidden ${isSidebarCollapsed ? 'justify-center' : ''} ${
                  isActive
                    ? `bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-lg shadow-fuchsia-500/20`
                    : `text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200`
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-white/10 pointer-events-none"></div>
                )}
                <link.icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'} ${!isSidebarCollapsed ? 'mr-3' : ''}`} />
                {!isSidebarCollapsed && (
                  <span className={`font-semibold tracking-wide whitespace-nowrap ${isActive ? 'font-bold' : ''}`}>{link.name}</span>
                )}
              </Link>
            )
        })}
      </nav>
    </div>
  );
};


const Sidebar: React.FC<SidebarProps> = ({ 
    navLinks, sidebarOpen, setSidebarOpen, isSidebarCollapsed, setIsSidebarCollapsed, 
    isMobileFriendly, className, textColor, hoverBg, activeBg, activeTextColor, logoBorderColor,
    logoComponent, mobileLogoComponent
}) => {
  
  const commonProps = { navLinks, sidebarOpen, setSidebarOpen, isSidebarCollapsed, textColor, hoverBg, activeBg, activeTextColor, logoBorderColor };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden ${isMobileFriendly ? 'lg:flex' : 'sm:flex'} flex-col transition-all duration-300 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30 ${className} ${isSidebarCollapsed ? 'w-24' : 'w-72'}`}>
        <NavContent {...commonProps} logoComponent={logoComponent}/>
        <div className={`p-4 border-t border-slate-100 dark:border-slate-800 mt-auto`}>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`w-full flex items-center justify-center p-3 rounded-2xl text-slate-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50`}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isMobileFriendly && (
        <div className={`fixed inset-0 z-[1300] flex lg:hidden ${sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          <div 
            className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} 
            onClick={() => setSidebarOpen(false)}
          />
          <aside className={`relative w-72 flex-shrink-0 bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${className}`}>
            <NavContent {...commonProps} isSidebarCollapsed={false} logoComponent={mobileLogoComponent || logoComponent} />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
