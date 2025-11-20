
import React, { useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { LayoutDashboard, ParkingSquare, BookCheck, LineChart, User as UserIcon, MapPin } from 'lucide-react';
import Sidebar from './shared/Sidebar';
import Header from './shared/Header';
import { UserRole } from '../../types';
import FullPageLoader from '../common/FullPageLoader';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navLinks = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Find Parking', path: '/map', icon: MapPin },
  { name: 'Manage Parkings', path: '/manage-parkings', icon: ParkingSquare },
  { name: 'Reservations', path: '/manage-reservations', icon: BookCheck },
  { name: 'Analytics', path: '/analytics', icon: LineChart },
  { name: 'Profile', path: '/profile', icon: UserIcon },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const location = useLocation();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (!authContext || !authContext.user) {
    return <FullPageLoader />;
  }
  const { user, logout } = authContext;

  // Determine if the current page should be full width (no padding)
  // Typically map pages require full width
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
          role={UserRole.ADMIN}
        />
        <main className={`flex-1 relative ${isFullWidthPage ? 'overflow-hidden p-0 flex flex-col' : 'overflow-y-auto p-4 sm:p-6 lg:p-8'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;