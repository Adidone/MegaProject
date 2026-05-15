
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserRole, User } from './types';
import Login from './pages/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import BusManagement from './pages/Admin/BusManagement';
import RouteManagement from './pages/Admin/RouteManagement';
import StudentManagement from './pages/Admin/StudentManagement';
import DriverManagement from './pages/Admin/DriverManagement';
import SchedulingModule from './pages/Admin/Scheduling';
import AlertsManagement from './pages/Admin/Alerts';
import ReportsModule from './pages/Admin/Reports';
import StudentDashboard from './pages/Student/Dashboard';
import StudentTracking from './pages/Student/Tracking';
import StudentNotifications from './pages/Student/Notifications';
import StudentProfile from './pages/Student/Profile';
import DriverDashboard from './pages/Driver/Dashboard';
import DriverTrip from './pages/Driver/Trip';
import DriverHistory from './pages/Driver/TripHistory';
import DriverProfile from './pages/Driver/Profile';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { apiRequest } from './api';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('rw_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      if (user) localStorage.setItem('rw_user', JSON.stringify(user));
    } catch {
      // ignore
    }
  }, [user]);

  const handleLogin = async (payload: { role: UserRole; identifier: string; password: string }) => {
    const { role, identifier, password } = payload;

    if (role === UserRole.ADMIN) {
      const res = await apiRequest<any>('/admin/login', {
        method: 'POST',
        json: { username: identifier, password },
      });

      if (!(res?.success ?? res?.sucess)) {
        throw new Error(res?.message || 'Invalid credentials');
      }

      setUser({
        id: 'admin',
        email: identifier,
        name: 'Admin',
        role: UserRole.ADMIN,
      });
      return;
    }

    if (role === UserRole.STUDENT) {
      const loginRes = await apiRequest<any>('/student/login', {
        method: 'POST',
        json: { roll_no: identifier, password }
      });

      if (!loginRes?.success) {
        throw new Error(loginRes?.message || 'Invalid roll number or password');
      }

      const d = loginRes.data;
      const currentHour = new Date().getHours();
      const isMorning = currentHour < 14;

      setUser({
        id: String(d.id),
        email: String(d.roll_no),
        name: String(d.name || 'Student'),
        role: UserRole.STUDENT,
        assignedBus: d.bus_number ? String(d.bus_number) : undefined,
        assignedRoute: isMorning ? (d.morning_route_name ? String(d.morning_route_name) : undefined) : (d.evening_route_name ? String(d.evening_route_name) : undefined),
        pickupStop: d.stop_name ? String(d.stop_name) : undefined,
      });
      return;
    }

    // DRIVER
    if (role === UserRole.DRIVER) {
      const loginRes = await apiRequest<any>('/driver/login', {
        method: 'POST',
        json: { email: identifier, password }
      });

      if (!loginRes?.success) {
        throw new Error(loginRes?.message || 'Invalid email or password');
      }

      const d = loginRes.data;
      setUser({
        id: String(d.id),
        email: String(d.email),
        name: String(d.name || `Driver ${d.id}`),
        role: UserRole.DRIVER,
        assignedRoute: d.route_id ? String(d.route_id) : undefined,
        status: 'Active',
      });
      return;
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('rw_user');
    } catch {
      // ignore
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar user={user} onLogout={handleLogout} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header user={user} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Routes>
              {user.role === UserRole.ADMIN && (
                <>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/buses" element={<BusManagement />} />
                  <Route path="/routes" element={<RouteManagement />} />
                  <Route path="/students" element={<StudentManagement />} />
                  <Route path="/drivers" element={<DriverManagement />} />
                  <Route path="/scheduling" element={<SchedulingModule />} />
                  <Route path="/notifications" element={<AlertsManagement />} />
                  <Route path="/reports" element={<ReportsModule />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </>
              )}
              {user.role === UserRole.STUDENT && (
                <>
                  <Route path="/" element={<StudentDashboard user={user} />} />
                  <Route path="/tracking" element={<StudentTracking user={user} />} />
                  <Route path="/notifications" element={<StudentNotifications user={user} />} />
                  <Route path="/profile" element={<StudentProfile user={user} />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </>
              )}
              {user.role === UserRole.DRIVER && (
                <>
                  <Route path="/" element={<DriverDashboard user={user} />} />
                  <Route path="/trip" element={<DriverTrip user={user} />} />
                  <Route path="/history" element={<DriverHistory user={user} />} />
                  <Route path="/profile" element={<DriverProfile user={user} onLogout={handleLogout} />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  );
};

export default App;
