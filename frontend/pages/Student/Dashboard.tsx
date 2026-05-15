
import React from 'react';
import { User } from '../../types';
import { Bus, MapPin, Clock, User as DriverIcon, Bell, ChevronRight, Phone, CheckCircle } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { apiRequest } from '../../api';

interface StudentDashboardProps {
  user: User;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  const [attendanceStatus, setAttendanceStatus] = React.useState<boolean | null>(null);
  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [dashboard, setDashboard] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchData = async () => {
    try {
      const currentHour = new Date().getHours();
      const currentShift = currentHour < 14 ? 'Morning' : 'Evening';
      
      const [attRes, alertsRes, dashRes] = await Promise.all([
        apiRequest<{ success: boolean; is_coming: boolean | null }>(`/student/attendance-status/${user.id}?shift=${currentShift}`),
        apiRequest<{ success: boolean; data: any[] }>(`/student/notifications/${user.id}`),
        apiRequest<{ success: boolean; data: any }>(`/student/dashboard/${user.id}`)
      ]);

      if (attRes.success) setAttendanceStatus(attRes.is_coming);
      if (alertsRes.success) setAlerts(alertsRes.data.slice(0, 2));
      if (dashRes.success) setDashboard(dashRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [user.id]);

  const markAttendance = async (isComing: boolean) => {
    try {
      const currentHour = new Date().getHours();
      const currentShift = currentHour < 14 ? 'Morning' : 'Evening';
      await apiRequest('/student/mark-attendance', {
        method: 'POST',
        json: {
          student_id: user.id,
          is_coming: isComing,
          shift: currentShift,
          reason: isComing ? null : 'Not specified'
        }
      });
      setAttendanceStatus(isComing);
    } catch (e) {
      console.error(e);
      alert('Failed to update attendance');
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F47C20]"></div>
      </div>
    );
  }

  const hasActiveTrip = dashboard && dashboard.activeTrip;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      <div className="bg-[#2E2D7F] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">Hello, {user.name}!</h1>
          <p className="text-indigo-200 mt-1">
            {hasActiveTrip ? `Your bus (${dashboard.bus_number}) is ${dashboard.currentStatus.toLowerCase()}.` : 'No active trip for your route right now.'}
          </p>
          
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">Bus Assignment</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-bold">{hasActiveTrip ? dashboard.bus_number : user.assignedBus || 'TBD'}</span>
                <div className="p-2 bg-[#F47C20] rounded-lg">
                  <Bus className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">Pickup Status</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-bold uppercase">{hasActiveTrip ? 'Live' : 'Pending'}</span>
                <div className="p-2 bg-green-500 rounded-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F47C20] opacity-10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Your Route Details</h3>
              <NavLink to="/tracking" className="text-xs font-bold text-[#F47C20] flex items-center hover:underline uppercase tracking-widest">
                Track Live <ChevronRight className="w-3 h-3 ml-1" />
              </NavLink>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="p-3 bg-white rounded-full shadow-sm text-[#F47C20]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-tight">Assigned Stop</p>
                  <p className="text-sm font-bold text-gray-900">{dashboard?.stop_name || user.pickupStop || 'Calculating...'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="p-3 bg-white rounded-full shadow-sm text-indigo-600">
                  <DriverIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-tight">Driver Details</p>
                  <p className="text-sm font-bold text-gray-900">{hasActiveTrip ? dashboard.driver_name : 'Waiting for Assignment'}</p>
                </div>
                {hasActiveTrip && (
                  <a href={`tel:${dashboard.driver_phone}`} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6 uppercase tracking-widest text-xs opacity-60">Trip Timeline</h3>
            <div className="relative pl-8 space-y-8">
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-100"></div>
              
              {hasActiveTrip && dashboard.timeline ? dashboard.timeline.map((stop: any, i: number) => (
                <div key={i} className={`relative ${stop.isCompleted ? 'opacity-50' : ''}`}>
                  <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 bg-white transition-colors ${
                    stop.isCompleted ? 'bg-green-500 border-green-200' : 
                    stop.isStudentStop ? 'bg-[#F47C20] border-orange-200 animate-pulse' : 'border-gray-300'
                  }`}></div>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-bold ${stop.isStudentStop ? 'text-[#F47C20]' : 'text-gray-900'}`}>
                      {stop.name} {stop.isStudentStop ? '(Your Stop)' : ''}
                    </p>
                    {stop.isCompleted && <span className="text-[10px] font-black text-green-600 uppercase">Passed</span>}
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center text-gray-400 italic text-sm">
                  Timeline will appear once the trip starts.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Today's Attendance</h3>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => markAttendance(true)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all shadow-md uppercase ${
                    attendanceStatus === true 
                      ? 'bg-green-600 text-white shadow-green-200 ring-2 ring-green-300 ring-offset-2' 
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  Coming
                </button>
                <button 
                  onClick={() => markAttendance(false)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all shadow-md uppercase ${
                    attendanceStatus === false 
                      ? 'bg-red-600 text-white shadow-red-200 ring-2 ring-red-300 ring-offset-2' 
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  Not Coming
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center uppercase font-black tracking-widest">
                Status: {attendanceStatus === null ? 'Default (Coming)' : attendanceStatus ? 'Coming' : 'Not Coming'}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Recent Alerts</h3>
              <Bell className="w-4 h-4 text-[#F47C20]" />
            </div>
            <div className="space-y-4">
              {alerts.length > 0 ? alerts.map((alert, i) => (
                <div key={i} className={`p-3 border-l-4 rounded-r-lg ${
                  alert.type === 'warning' ? 'bg-orange-50 border-orange-500' :
                  alert.type === 'alert' ? 'bg-red-50 border-red-500' : 'bg-indigo-50 border-indigo-500'
                }`}>
                  <p className={`text-xs font-bold ${
                    alert.type === 'warning' ? 'text-orange-700' :
                    alert.type === 'alert' ? 'text-red-700' : 'text-indigo-700'
                  }`}>{alert.title}</p>
                  <p className="text-[11px] text-gray-600 mt-1 line-clamp-2">{alert.message}</p>
                </div>
              )) : (
                <p className="text-xs text-gray-400 italic text-center py-4">No recent alerts</p>
              )}
            </div>
          </div>

          <div className="bg-[#F47C20] rounded-2xl p-6 text-white shadow-lg shadow-orange-200">
            <h4 className="font-bold text-lg mb-2">Emergency?</h4>
            <p className="text-sm text-orange-100 mb-4 leading-snug">Report any issues or missing stops directly to campus security.</p>
            <a href="tel:911" className="block w-full py-2 bg-white text-center text-[#F47C20] font-bold rounded-xl text-sm hover:bg-orange-50 transition-colors">
              Call Dispatcher
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
