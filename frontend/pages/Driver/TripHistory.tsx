import React, { useState } from 'react';
import { User } from '../../types';
import { apiRequest } from '../../api';
import {
  History,
  Calendar as CalendarIcon,
  Search,
  Filter,
  Download,
  MapPin,
  Users,
  Navigation,
  Clock,
  CheckCircle,
  TrendingUp,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';

interface TripLog {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  route: string;
  busNumber: string;
  studentsBoarded: number;
  distance: string;
  fuelConsumed: string;
  status: 'Completed' | 'Partially Completed';
}

const DriverHistory: React.FC<{ user: User }> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('Last 30 Days');
  const [history, setHistory] = useState<TripLog[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; data: any[]; summary: any }>(
        `/driver/history/${user.id}?range=${dateFilter}`
      );
      if (res.success) {
        setHistory(res.data);
        setSummary(res.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchHistory();
  }, [user.id, dateFilter]);

  const filteredHistory = history.filter(log =>
    log.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = (format: 'PDF' | 'Excel') => {
    if (filteredHistory.length === 0) {
      alert("No data available to export");
      return;
    }

    // Prepare CSV data
    const headers = ["Trip ID", "Date", "Start Time", "End Time", "Route", "Bus", "Students", "Distance", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredHistory.map(log => [
        `TRIP-${log.id}`,
        log.date,
        log.startTime,
        log.endTime,
        `"${log.route}"`,
        log.busNumber,
        log.studentsBoarded,
        log.distance,
        log.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `Trip_History_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`Trip history exported as ${format} successfully.`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 uppercase tracking-tight">
            <div className="p-2 bg-[#F47C20]/10 rounded-xl">
              <History className="w-6 h-6 text-[#F47C20]" />
            </div>
            Trip History & Logs
          </h1>
          <p className="text-sm text-gray-500 ml-12">Review your past shifts and performance metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('PDF')}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#2E2D7F] text-white rounded-xl text-xs font-bold hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-100"
          >
            <FileDown className="w-4 h-4" /> Download Report
          </button>
        </div>
      </div>

      {/* Driver Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Distance', value: summary?.totalDistance || '0 KM', icon: Navigation, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed Trips', value: summary?.totalTrips || '0', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Avg Students', value: summary?.avgStudents || '0', icon: Users, color: 'text-[#F47C20]', bg: 'bg-orange-50' },
          { label: 'Total Students', value: summary?.totalStudents || '0', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
            <div className="flex items-start justify-between">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
            </div>
            <p className="mt-3 text-2xl font-black text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by route name or trip ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#F47C20] outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm min-w-[150px]">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <select
              className="bg-transparent text-xs font-bold text-gray-600 outline-none w-full"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option>Today</option>
              <option>Yesterday</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F47C20] mx-auto"></div>
              <p className="mt-4 text-sm text-gray-500 font-bold uppercase tracking-widest">Loading Logs...</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <th className="px-6 py-5">Date & Trip ID</th>
                  <th className="px-6 py-5">Route Path</th>
                  <th className="px-6 py-5">Performance</th>
                  <th className="px-6 py-5">Metrics</th>
                  <th className="px-6 py-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredHistory.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-gray-900">{log.date}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: #{log.id}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-[#2E2D7F] rounded-lg">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#2E2D7F]">{log.route}</p>
                          <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {log.startTime} — {log.endTime}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Students</p>
                          <p className="text-sm font-bold text-gray-900">{log.studentsBoarded}</p>
                        </div>
                        <div className="h-8 w-px bg-gray-100"></div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Distance</p>
                          <p className="text-sm font-bold text-gray-900">{log.distance}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                          {log.fuelConsumed}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                          {log.busNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px] uppercase tracking-wider">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {log.status}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <History className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No trip logs found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="p-6 bg-[#2E2D7F] rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <h3 className="text-xl font-black mb-2 flex items-center gap-2 uppercase tracking-tight">
            <TrendingUp className="w-6 h-6 text-[#F47C20]" /> Shift Insights
          </h3>
          <p className="text-sm text-indigo-200 leading-relaxed font-medium">
            Your performance this week is optimized. Keeping on-time arrivals helps students plan better and ensures a smooth campus experience.
          </p>
        </div>
        <div className="flex gap-4 relative z-10 shrink-0">
          <div className="text-center px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-[10px] font-bold text-indigo-300 uppercase">Avg Fuel/KM</p>
            <p className="text-lg font-black text-[#F47C20]">0.34 L</p>
          </div>
          <div className="text-center px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-[10px] font-bold text-indigo-300 uppercase">On-Time %</p>
            <p className="text-lg font-black text-green-400">99.2%</p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
      </div>
    </div>
  );
};
export default DriverHistory;
