
import React, { useState } from 'react';
import { User } from '../../types';
import {
  Play,
  Square,
  Map as MapIcon,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Navigation,
  Bus as BusIcon
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { apiRequest } from '../../api';

interface DriverDashboardProps {
  user: User;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ user }) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, alertsRes] = await Promise.all([
        apiRequest<{ success: boolean; data: any; activeTrip: boolean }>(`/driver/dashboard/${user.id}`),
        apiRequest<{ success: boolean; data: any[] }>(`/driver/notifications/${user.id}`)
      ]);

      if (dashRes.success) {
        setDashboardData(dashRes.data || { activeTrip: false });
      }
      if (alertsRes.success) {
        setAlerts(alertsRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  const urgentAlert = alerts.find(a => a.type === 'alert' || a.type === 'warning');
  const hasActiveTrip = dashboardData && dashboardData.route_name;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F47C20]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Urgent Alert Banner */}
      {urgentAlert && (
        <div className={`p-4 rounded-2xl flex items-center justify-between animate-pulse ${urgentAlert.type === 'alert' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
          }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="text-xs font-black uppercase tracking-widest opacity-80">Urgent Alert</p>
              <p className="font-bold">{urgentAlert.title}: {urgentAlert.message}</p>
            </div>
          </div>
          <button className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold">Dismiss</button>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">
            {new Date().getHours() < 12 ? 'Good Morning' : 'Good Afternoon'}, {user.name}
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            {hasActiveTrip ? `You are assigned to the ${dashboardData.shift} shift.` : 'No trips assigned for today.'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className={`w-2 h-2 rounded-full ${hasActiveTrip ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-xs font-bold text-gray-700 uppercase">{hasActiveTrip ? 'Active Duty' : 'Off Duty'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            <div className="flex-1 space-y-4 z-10">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Assignment</p>
                <h2 className="text-3xl font-black text-[#2E2D7F]">
                  {hasActiveTrip ? dashboardData.route_name : 'No Active Route'}
                </h2>
                {hasActiveTrip && (
                  <p className="text-sm font-bold text-[#F47C20] flex items-center gap-2">
                    <BusIcon className="w-4 h-4" /> Bus: {dashboardData.bus_number}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Navigation className="w-4 h-4 text-[#F47C20]" />
                  <span className="text-xs font-bold text-gray-600">{dashboardData?.total_distance || 0} KM Total</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <MapIcon className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-gray-600">{dashboardData?.total_stops || 0} Scheduled Stops</span>
                </div>
              </div>
            </div>

            {hasActiveTrip ? (
              <NavLink
                to="/trip"
                className="w-40 h-40 rounded-full bg-[#F47C20] hover:bg-[#e06b12] text-white flex flex-col items-center justify-center gap-2 font-black text-xl shadow-2xl shadow-orange-200 transition-all transform active:scale-95 z-10"
              >
                <Play className="w-12 h-12 fill-current ml-2" />
                <span>START</span>
              </NavLink>
            ) : (
              <div className="w-40 h-40 rounded-full bg-gray-100 text-gray-300 flex flex-col items-center justify-center gap-2 font-black text-xl cursor-not-allowed">
                <Clock className="w-12 h-12" />
                <span className="text-sm">WAITING</span>
              </div>
            )}

            {/* Subtle background decoration */}
            <div className="absolute -right-10 -bottom-10 opacity-5">
              <BusIcon className="w-64 h-64" />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-orange-100 text-[#F47C20] rounded-2xl flex items-center justify-center mx-auto">
              <Navigation className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Your Route Details</h3>
              <p className="text-sm text-gray-500 mt-1">
                {hasActiveTrip
                  ? "Your route is ready. Tap start to begin tracking and see student details."
                  : "Check back later for your next assignment."}
              </p>
            </div>
            {hasActiveTrip && (
              <NavLink
                to="/trip"
                className="inline-block px-8 py-3 bg-[#2E2D7F] text-white font-bold rounded-xl hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-100"
              >
                Go to Active Trip
              </NavLink>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#2E2D7F] rounded-3xl p-6 text-white shadow-lg">
            <h3 className="font-bold mb-4 uppercase tracking-widest text-xs opacity-70">Daily Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-indigo-200">Trip Status</span>
                <span className={`font-bold ${hasActiveTrip ? 'text-green-400' : 'text-gray-300'}`}>
                  {hasActiveTrip ? 'Assigned' : 'Idle'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-indigo-200">Current Shift</span>
                <span className="font-bold">{dashboardData?.shift || (new Date().getHours() < 14 ? 'Morning' : 'Evening')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-indigo-200">Total Students</span>
                <span className="font-bold text-orange-400">{dashboardData?.total_students || 0}</span>
              </div>
              <div className="h-px bg-white/10 my-2"></div>
              <p className="text-[10px] text-indigo-300 leading-snug">
                Always ensure your GPS is enabled before starting a trip to provide live updates to students.
              </p>
            </div>
          </div>

          {hasActiveTrip && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Quick Links</h3>
              <NavLink to="/trip" className="w-full py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100">
                <Users className="w-4 h-4 text-[#F47C20]" /> Attendance Sheet
              </NavLink>
            </div>
          )}

          <div className="bg-red-50 rounded-3xl p-6 border border-red-100">
            <h4 className="text-red-900 font-bold text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Emergency
            </h4>
            <p className="text-xs text-red-700 mt-2 leading-snug">Report breakdown or accidents directly to campus dispatch.</p>
            <a
              href="tel:911"
              className="inline-block mt-4 text-xs font-black text-red-700 uppercase tracking-widest hover:underline"
            >
              Call Dispatcher
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
