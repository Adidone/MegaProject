
import React, { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  X,
  Trash2,
  GripVertical,
  ArrowRight,
  Search,
  Download
} from 'lucide-react';
import { apiRequest } from '../../api';
import { API_BASE_URL } from '../../apiBase';

const RouteManagement: React.FC = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State for New Route
  const [routeName, setRouteName] = useState('');
  const [startStopId, setStartStopId] = useState<string>('');
  const [endStopId, setEndStopId] = useState<string>('');
  const [middleStops, setMiddleStops] = useState<string[]>([]);
  const [routeShift, setRouteShift] = useState<string>('Morning');

  const resetForm = () => {
    setIsAddModalOpen(false);
    setRouteName('');
    setStartStopId('');
    setEndStopId('');
    setMiddleStops([]);
    setRouteShift('Morning');
  };

  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);

      const [routesRes, stopsRes] = await Promise.all([
        apiRequest<{ success: boolean; data: any[] }>(`/admin/routes?${queryParams.toString()}`),
        apiRequest<{ success: boolean; data: any[] }>('/admin/stops'),
      ]);
      setRoutes(routesRes.data || []);
      setStops(stopsRes.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load routes/stops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleExport = () => {
    window.open(`${API_BASE_URL}/admin/export/routes`, '_blank');
  };

  const filteredRoutes = routes;

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest<any>('/admin/addroute', {
        method: 'POST',
        json: {
          name: routeName,
          start_stop_id: Number(startStopId),
          end_stop_id: Number(endStopId),
          middle_stop_ids: middleStops.map(Number),
          shift: routeShift
        },
      });

      resetForm();
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to create route');
    }
  };

  const stopNameById = useMemo(() => {
    const m = new Map<string, string>();
    stops.forEach((s: any) => m.set(String(s.id), String(s.name)));
    return m;
  }, [stops]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Management</h1>
          <p className="text-sm text-gray-500">Design and optimize bus coverage paths.</p>
          {error && <p className="text-sm text-red-600 font-semibold mt-2">{error}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search routes or stops..."
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#F47C20] outline-none w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#F47C20] text-white rounded-lg text-sm font-bold shadow-sm hover:bg-[#e06b12] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add New Route
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-100 text-gray-500">
            Loading routes…
          </div>
        )}
        {!loading && routes.map((route: any) => (
          <div key={route.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 text-[#2E2D7F]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{route.name}</h3>
                  <p className="text-xs text-gray-500">{(route.stops || []).length} Stops Total</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            </div>

            <div className="p-5 flex-1 space-y-4">
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-100 border-dashed border-l"></div>
                {(route.stops || []).map((stop: any, i: number) => (
                  <div key={i} className="relative flex items-center text-sm">
                    <div className={`absolute -left-[23px] w-4 h-4 rounded-full border-2 border-white shadow-sm ${i === 0 ? 'bg-green-500' :
                      i === (route.stops || []).length - 1 ? 'bg-[#F47C20]' :
                        'bg-indigo-400'
                      }`}></div>
                    <span className={`truncate ${i === 0 || i === (route.stops || []).length - 1 ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                      {stop.stop_name}
                    </span>
                    {i === 0 && <span className="ml-2 text-[10px] font-bold text-green-600 uppercase">Start</span>}
                    {i === (route.stops || []).length - 1 && <span className="ml-2 text-[10px] font-bold text-[#F47C20] uppercase">End</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-green-100 text-green-700">
                Active
              </span>
              <div className="flex items-center gap-2">
                <button className="text-xs font-bold text-[#2E2D7F] hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                <button className="text-xs font-bold text-[#F47C20] hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-colors">View Map</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Route Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2E2D7F]/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-[#2E2D7F] text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold">Create New Route</h3>
                <p className="text-xs text-indigo-200">Define pickup points and destination</p>
              </div>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateRoute} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Route Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South Campus Express"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] focus:border-transparent outline-none transition-all font-medium"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Start Stop</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] focus:border-transparent outline-none transition-all font-medium"
                    value={startStopId}
                    onChange={(e) => setStartStopId(e.target.value)}
                  >
                    <option value="">Select start stop</option>
                    {stops.map((s: any) => (
                      <option key={s.id} value={String(s.id)}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">End Stop</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] focus:border-transparent outline-none transition-all font-medium"
                    value={endStopId}
                    onChange={(e) => setEndStopId(e.target.value)}
                  >
                    <option value="">Select end stop</option>
                    {stops.map((s: any) => (
                      <option key={s.id} value={String(s.id)}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                    Middle Stops
                    <button type="button" onClick={() => setMiddleStops([...middleStops, ''])} className="text-indigo-600 hover:text-indigo-800 text-xs flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add Stop
                    </button>
                  </label>
                  {middleStops.map((stopId, idx) => (
                    <div key={idx} className="flex gap-2 mt-2">
                      <select
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] focus:border-transparent outline-none transition-all font-medium"
                        value={stopId}
                        onChange={(e) => {
                          const newStops = [...middleStops];
                          newStops[idx] = e.target.value;
                          setMiddleStops(newStops);
                        }}
                      >
                        <option value="">Select middle stop {idx + 1}</option>
                        {stops.map((s: any) => (
                          <option key={s.id} value={String(s.id)}>{s.name}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => setMiddleStops(middleStops.filter((_, i) => i !== idx))} className="px-4 py-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shift Time</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] focus:border-transparent outline-none transition-all font-medium"
                    value={routeShift}
                    onChange={(e) => setRouteShift(e.target.value)}
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50 shrink-0">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-white transition-all"
              >
                Discard
              </button>
              <button
                onClick={(e) => handleCreateRoute(e as any)}
                disabled={!routeName || !startStopId || !endStopId || startStopId === endStopId}
                className="flex-1 px-6 py-3 bg-[#F47C20] text-white font-bold rounded-xl shadow-lg shadow-orange-100 hover:bg-[#e06b12] disabled:bg-gray-300 disabled:shadow-none transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                Create Route <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteManagement;
