
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { Sun, Moon, Menu, User as UserIcon, Shield, LogOut, Settings } from 'lucide-react';
import { User, UserRole } from '../../../types';

interface HeaderProps {
  user: User | null;
  logout: () => void;
  onToggleSidebar: () => void;
  role: UserRole;
  headerClass?: string;
  isMobileToggleVisible?: boolean;
}

const roleConfig = {
    [UserRole.USER]: { name: 'User', icon: UserIcon, color: 'text-primary', bg: 'bg-primary/10' },
    [UserRole.ADMIN]: { name: 'Admin', icon: UserIcon, color: 'text-primary', bg: 'bg-primary/10' },
    [UserRole.SUPER_ADMIN]: { name: 'Super Admin', icon: Shield, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
};

const Header: React.FC<HeaderProps> = ({ user, logout, onToggleSidebar, role, headerClass = 'bg-white dark:bg-slate-800', isMobileToggleVisible = true }) => {
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { name: roleName, icon: RoleIcon, color, bg } = roleConfig[role];
  const profilePath = role === UserRole.USER ? '/settings' : '/profile';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`relative z-[1200] flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 shadow-sm shrink-0 ${headerClass}`}>
      {isMobileToggleVisible && (
        <button className="lg:hidden p-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={onToggleSidebar} aria-label="Open navigation menu">
          <Menu className="h-6 w-6" />
        </button>
      )}
      <div className="flex-1"></div>
      <div className="flex items-center space-x-4">
        <button onClick={toggleTheme} className="p-2 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
          {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-slate-500" />}
        </button>
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" aria-haspopup="true" aria-expanded={dropdownOpen}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${bg}`}>
              <RoleIcon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="hidden sm:block text-left">
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{roleName}</p>
            </div>
          </button>
          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-[1010]">
              <Link to={profilePath} onClick={() => setDropdownOpen(false)} className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                <Settings className="w-4 h-4 mr-2" />
                Profile & Settings
              </Link>
              <div className="border-t border-slate-200 dark:border-slate-600 my-1"></div>
              <button onClick={() => { logout(); setDropdownOpen(false); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
