
import React, { useContext, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { LayoutGrid, MapPin, ListChecks, UserCircle, Car } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from './shared/Sidebar';
import Header from './shared/Header';
import { UserRole } from '../../types';
import FullPageLoader from '../common/FullPageLoader';

interface UserLayoutProps {
  children: React.ReactNode;
}

const navLinks = [
  { name: 'Dashboard', path: '/', icon: LayoutGrid },
  { name: 'Find Parking', path: '/map', icon: MapPin },
  { name: 'My Reservations', path: '/reservations', icon: ListChecks },
  { name: 'Profile', path: '/settings', icon: UserCircle },
];

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (!authContext || !authContext.user) {
    return <FullPageLoader />;
  }
  const { user, logout } = authContext;

  const Logo = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <Link to="/" className={`p-6 flex items-center h-[80px] ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="bg-gradient-to-br from-fuchsia-500 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-fuchsia-500/20 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <Car className="w-6 h-6 text-white" />
        </div>
        {!isCollapsed && (
            <h1 className="text-2xl font-extrabold ml-3 text-slate-900 dark:text-white whitespace-nowrap tracking-tight">Park-Eazy</h1>
        )}
    </Link>
  );
  
  const isMapPage = location.pathname === '/map';

  return (
    <div className="flex h-screen bg-rose-50 dark:bg-[#0f172a]">
      <Sidebar
        navLinks={navLinks}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        isMobileFriendly={true}
        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl"
        logoComponent={<Logo isCollapsed={isSidebarCollapsed} />}
        mobileLogoComponent={<Logo isCollapsed={false} />}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
         <Header 
          user={user}
          logout={logout}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          role={UserRole.USER}
          headerClass="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-white/50 dark:border-slate-800"
          isMobileToggleVisible={true}
        />
        <main className={`flex-1 relative ${isMapPage ? 'overflow-hidden p-0 flex flex-col' : 'overflow-y-auto p-4 sm:p-6 lg:p-8'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
