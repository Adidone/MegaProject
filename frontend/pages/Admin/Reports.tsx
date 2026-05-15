
import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon, 
  Bus, 
  Map, 
  Users, 
  ShieldCheck, 
  Wrench,
  ChevronDown,
  ExternalLink,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import { MOCK_BUSES, MOCK_ROUTES } from '../../constants';
import { apiRequest } from '../../api';
import { API_BASE_URL } from '../../apiBase';

type ReportCategory = 'Bus Utilization' | 'Route Performance' | 'Student Occupancy' | 'Maintenance' | 'Driver Attendance';

const ReportsModule: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('Bus Utilization');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [isGenerating, setIsGenerating] = useState(false);

  const categories: { name: ReportCategory; icon: any; color: string }[] = [
    { name: 'Bus Utilization', icon: Bus, color: 'text-blue-600' },
    { name: 'Route Performance', icon: Map, color: 'text-indigo-600' },
    { name: 'Student Occupancy', icon: Users, color: 'text-orange-600' },
    { name: 'Maintenance', icon: Wrench, color: 'text-red-600' },
    { name: 'Driver Attendance', icon: ShieldCheck, color: 'text-green-600' },
  ];

  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>(["Entity", "Metric A", "Metric B", "Status", "Performance"]);
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState({ totalTrips: 0, efficiency: 0, onTime: 0 });

  const loadReportData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; data: any[]; headers: string[]; summary: any }>(
        `/admin/reports?category=${selectedCategory}&range=${dateRange}`
      );
      if (res.success) {
        setData(res.data || []);
        if (res.headers) setHeaders(res.headers);
        if (res.summary) setSummary(res.summary);
      }
    } catch (e) {
      console.error(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadReportData();
  }, [selectedCategory, dateRange]);

  const handleExport = (format: 'PDF' | 'Excel') => {
    setIsGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      setIsGenerating(false);
      alert(`${selectedCategory} report exported as ${format} successfully.`);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Reports</h1>
          <p className="text-sm text-gray-500">Analyze fleet performance and student transport data.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
          <CalendarIcon className="w-4 h-4 text-gray-400" />
          <select 
            className="text-sm font-bold text-gray-700 outline-none bg-transparent"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option>Today</option>
            <option>Yesterday</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Custom Range</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Categories */}
        <div className="lg:col-span-1 space-y-3">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all border ${
                selectedCategory === cat.name 
                  ? 'bg-[#2E2D7F] text-white border-transparent shadow-lg shadow-indigo-100' 
                  : 'bg-white text-gray-600 border-gray-100 hover:border-indigo-200'
              }`}
            >
              <div className={`p-2 rounded-lg ${selectedCategory === cat.name ? 'bg-white/10' : 'bg-gray-50'}`}>
                <cat.icon className={`w-5 h-5 ${selectedCategory === cat.name ? 'text-[#F47C20]' : cat.color}`} />
              </div>
              <span className="text-sm font-bold">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Report Details & Controls */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedCategory} Summary</h3>
                <p className="text-xs text-gray-500 mt-1">Preview of data from {dateRange}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleExport('Excel')}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel
                </button>
                <button 
                  onClick={() => handleExport('PDF')}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-[#F47C20] text-white rounded-lg text-sm font-bold shadow-md hover:bg-[#e06b12] disabled:opacity-50"
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                  Export PDF
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Report Preview Table */}
              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">
                      {headers.map((h, i) => (
                        <th key={i} className={`px-6 py-4 ${i === headers.length - 1 ? 'text-right' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-10 italic text-gray-400">Loading data...</td></tr>
                    ) : data.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-10 italic text-gray-400">No data available for this category.</td></tr>
                    ) : data.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900">{item.name}</p>
                          <p className="text-[10px] text-gray-400">ID: {item.id}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                          {item.metricA}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                          {item.metricB}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            String(item.status).toLowerCase().includes('active') || String(item.status).toLowerCase().includes('available') || String(item.status).toLowerCase().includes('optimized')
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" /> {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs font-black text-[#2E2D7F]">
                            {item.performance === 'N/A' ? 'N/A' : `${item.performance}%`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-[#2E2D7F] p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="font-bold text-lg mb-4">Historical Trends</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs text-indigo-200">Total Trips Executed</span>
                    <span className="font-black text-[#F47C20]">{summary.totalTrips}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs text-indigo-200">Overall Efficiency</span>
                    <span className="font-black text-green-400">{summary.efficiency}%</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs text-indigo-200">On-Time Performance</span>
                    <span className="font-black">{summary.onTime}%</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#F47C20] rounded-full blur-3xl opacity-20"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsModule;
