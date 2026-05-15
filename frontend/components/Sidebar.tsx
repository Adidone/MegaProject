
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bus, 
  Map, 
  Users, 
  Calendar, 
  Bell, 
  FileText, 
  LogOut, 
  UserCircle,
  MapPin
} from 'lucide-react';
import { User, UserRole } from '../types';

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const adminLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/buses', icon: Bus, label: 'Buses' },
    { to: '/routes', icon: Map, label: 'Routes' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/drivers', icon: UserCircle, label: 'Drivers' },
    { to: '/scheduling', icon: Calendar, label: 'Scheduling' },
    { to: '/notifications', icon: Bell, label: 'Alerts' },
    { to: '/reports', icon: FileText, label: 'Reports' },
  ];

  const studentLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/tracking', icon: MapPin, label: 'Live Tracking' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  const driverLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/trip', icon: Map, label: 'Current Trip' },
    { to: '/history', icon: FileText, label: 'Trip History' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  const links = user.role === UserRole.ADMIN 
    ? adminLinks 
    : user.role === UserRole.STUDENT 
      ? studentLinks 
      : driverLinks;

  return (
    <div className="w-64 bg-[#2E2D7F] text-white flex flex-col hidden md:flex">
      <div className="p-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F47C20] rounded flex items-center justify-center">KW</div>
          RouteWise
        </h1>
        <p className="text-xs text-indigo-300 mt-1">Bus Manager System</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
              ${isActive ? 'bg-[#F47C20] text-white' : 'text-indigo-100 hover:bg-white/10'}
            `}
          >
            <link.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-indigo-100 hover:bg-red-500/20 hover:text-red-200 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
