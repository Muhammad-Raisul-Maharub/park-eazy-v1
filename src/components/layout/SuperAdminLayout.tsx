
import React, { useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { Shield, Users, LineChart, DollarSign, Terminal, User as UserIcon, ParkingSquare, UserCog, MapPin } from 'lucide-react';
import Sidebar from './shared/Sidebar';
import Header from './shared/Header';
import { UserRole } from '../../types';
import FullPageLoader from '../common/FullPageLoader';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const navLinks = [
  { name: 'Dashboard', path: '/', icon: Shield },
  { name: 'Find Parking', path: '/map', icon: MapPin },
  { name: 'Manage Users', path: '/manage-users', icon: Users },
  { name: 'Manage Admins', path: '/manage-admins', icon: UserCog },
  { name: 'Manage Parkings', path: '/manage-parkings', icon: ParkingSquare },
  { name: 'Analytics', path: '/analytics', icon: LineChart },
  { name: 'System Logs', path: '/logs', icon: Terminal },
  { name: 'Profile', path: '/profile', icon: UserIcon },
];

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (!authContext || !authContext.user) {
    return <FullPageLoader />;
  }
  const { user, logout } = authContext;

  const isFullWidthPage = location.pathname === '/map';

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
      <Sidebar
        navLinks={navLinks}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        isMobileFriendly={true}
        className="bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700"
        textColor="text-slate-600 dark:text-slate-300"
        hoverBg="hover:bg-slate-100 dark:hover:bg-slate-700"
        activeBg="bg-primary text-white"
        activeTextColor="text-white"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          user={user}
          logout={logout}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          role={UserRole.SUPER_ADMIN}
        />
        <main className={`flex-1 relative ${isFullWidthPage ? 'overflow-hidden p-0 flex flex-col' : 'overflow-y-auto p-4 sm:p-6 lg:p-8'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;