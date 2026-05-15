
import React from 'react';
import {
  Bus,
  Map as MapIcon,
  Users,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { apiRequest } from '../../api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    buses: 0,
    routes: 0,
    students: 0,
    drivers: 0
  });
  const [busStatusData, setBusStatusData] = useState<any[]>([]);
  const [occupancyData, setOccupancyData] = useState<any[]>([]);
  const [latestAlerts, setLatestAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const res = await apiRequest<{
        success: boolean;
        data: {
          stats: { buses: number; routes: number; students: number; drivers: number };
          busStatus: { status: string; count: string }[];
          routeOccupancy: { name: string; students: number; capacity: number }[];
          latestAlerts: any[];
        }
      }>('/admin/dashboard-stats');

      if (res.success) {
        setStats(res.data.stats);

        // Format bus status data
        const statusColors: any = {
          'available': '#3B82F6',
          'not available': '#10B981',
          'maintenance': '#F47C20'
        };

        setBusStatusData(res.data.busStatus.map(s => ({
          name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
          value: parseInt(s.count),
          color: statusColors[s.status] || '#94A3B8'
        })));

        setOccupancyData(res.data.routeOccupancy);
        setLatestAlerts(res.data.latestAlerts);
      }
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const STATS_CARDS = [
    { label: 'Total Buses', value: stats.buses, icon: Bus, color: 'bg-blue-500', trend: 'Live' },
    { label: 'Total Routes', value: stats.routes, icon: MapIcon, color: 'bg-orange-500', trend: 'Live' },
    { label: 'Active Students', value: stats.students, icon: Users, color: 'bg-green-500', trend: 'Live' },
    { label: 'Drivers', value: stats.drivers, icon: UserCheck, color: 'bg-purple-500', trend: 'Live' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-sm text-gray-500">Welcome back! Here's what's happening today.</p>
        </div>
        <button
          onClick={() => navigate('/reports')}
          className="px-4 py-2 bg-[#F47C20] text-white rounded-lg text-sm font-semibold hover:bg-[#e06b12] transition-colors shadow-md"
        >
          Generate Daily Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-500 italic">Loading stats...</div>
        ) : STATS_CARDS.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-xs text-gray-500 mb-1">{stat.trend}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#F47C20]" />
              Route-wise Student Occupancy
            </h3>
            <select className="text-xs bg-gray-50 border border-gray-200 rounded p-1 outline-none">
              <option>This Week</option>
              <option>Last Month</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="students" fill="#2E2D7F" radius={[4, 4, 0, 0]} name="Students" />
                <Bar dataKey="capacity" fill="#F47C20" opacity={0.3} radius={[4, 4, 0, 0]} name="Capacity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Bus Fleet Status</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={busStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {busStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {busStatusData.map((status, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                  <span className="text-gray-600">{status.name}</span>
                </div>
                <span className="font-bold">{status.value} Units</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900">Live Critical Alerts</h3>
          <button
            onClick={() => navigate('/notifications')}
            className="text-xs text-[#F47C20] font-semibold hover:underline"
          >
            View All
          </button>
        </div>
        <div className="space-y-4">
          {latestAlerts.length === 0 ? (
            <div className="text-center py-6 text-gray-500 italic">No recent critical alerts.</div>
          ) : latestAlerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-orange-50 border border-orange-100">
              <div className="w-10 h-10 bg-[#F47C20] rounded-full flex items-center justify-center text-white">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900">{alert.title}</h4>
                <p className="text-xs text-gray-600">{alert.message}</p>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
