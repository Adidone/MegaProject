
import React, { useEffect, useMemo, useState } from 'react';
import {
  Bus as BusIcon,
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Settings,
  Filter,
  Download,
  X,
  AlertCircle,
  Check
} from 'lucide-react';
import { Bus } from '../../types';
import { apiRequest } from '../../api';
import { API_BASE_URL } from '../../apiBase';

const BusManagement: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [newBus, setNewBus] = useState({
    number: '',
    capacity: 50,
  });

  const statusColors = {
    Available: 'bg-green-100 text-green-700',
    Trip: 'bg-blue-100 text-blue-700',
    Maintenance: 'bg-orange-100 text-orange-700',
  };

  const normalizeStatus = (s: any): Bus['status'] => {
    const v = String(s || '').toLowerCase();
    if (v.includes('maintenance')) return 'Maintenance';
    if (v.includes('available')) return 'Available';
    return 'Trip';
  };

  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Trip' | 'Maintenance'>('All');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (statusFilter !== 'All') queryParams.append('status', statusFilter);

      const res = await apiRequest<{ success: boolean; data: any[] }>(`/admin/buses?${queryParams.toString()}`);
      const mapped: Bus[] = (res.data || []).map((b) => ({
        id: String(b.id),
        number: String(b.bus_number),
        capacity: Number(b.capacity || 0),
        occupancy: Number(b.occupancy || 0),
        status: normalizeStatus(b.status),
        driverId: b.driver_name || 'Unassigned',
        routeId: b.route_name || 'Unassigned',
      }));
      setBuses(mapped);
    } catch (e: any) {
      setError(e?.message || 'Failed to load buses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest('/admin/addbus', {
        method: 'POST',
        json: { bus_number: newBus.number, capacity: newBus.capacity },
      });
      setIsAddModalOpen(false);
      setNewBus({ number: '', capacity: 50 });
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to add bus');
    }
  };

  const filteredBuses = buses;

  const stats = useMemo(() => {
    const total = buses.length;
    const activeNow = buses.filter((b) => b.status === 'Trip').length;
    const maintenance = buses.filter((b) => b.status === 'Maintenance').length;
    return { total, activeNow, maintenance };
  }, [buses]);

  const handleExport = () => {
    window.open(`${API_BASE_URL}/admin/export/buses`, '_blank');
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bus Management</h1>
          <p className="text-sm text-gray-500">Manage fleet, tracking, and maintenance.</p>
          {error && <p className="text-sm text-red-600 font-semibold mt-2">{error}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#F47C20] text-white rounded-lg text-sm font-bold hover:bg-[#e06b12] shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Bus
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <BusIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">Total Fleet</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">Active Now</p>
            <p className="text-xl font-bold text-gray-900">{stats.activeNow}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">Maintenance</p>
            <p className="text-xl font-bold text-gray-900">{stats.maintenance}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by bus no, driver..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#F47C20]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select 
                className="appearance-none pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#F47C20] outline-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="All">All Status</option>
                <option value="Available">Available</option>
                <option value="Trip">On Trip</option>
                <option value="Maintenance">Maintenance</option>
              </select>
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Bus Details</th>
                <th className="px-6 py-4">Capacity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Driver</th>
                <th className="px-6 py-4">Current Route</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && filteredBuses.map((bus) => (
                <tr key={bus.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg">
                        <BusIcon className="w-5 h-5 text-[#2E2D7F]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{bus.number}</p>
                        <p className="text-xs text-gray-500">ID: KW-BUS-00{bus.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{bus.occupancy}/{bus.capacity} Seats</span>
                        <span className="font-bold">{Math.round((bus.occupancy / bus.capacity) * 100)}%</span>
                      </div>
                      <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#F47C20]"
                          style={{ width: `${(bus.occupancy / bus.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusColors[bus.status]}`}>
                      {bus.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{bus.driverId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700 truncate max-w-[150px]">
                      {bus.routeId}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this bus?')) {
                            try {
                              await apiRequest(`/admin/buses/${bus.id}`, { method: 'DELETE' });
                              await load();
                            } catch (e: any) {
                              alert(e?.message || 'Failed to delete bus');
                            }
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                    Loading buses…
                  </td>
                </tr>
              )}
              {!loading && filteredBuses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                    No buses found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Bus Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all scale-100">
            <div className="p-6 bg-[#2E2D7F] text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Add New Bus</h3>
                <p className="text-xs text-indigo-200">Register a new vehicle to the fleet</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddBus} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Bus Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-01-F-1234"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] focus:border-transparent outline-none transition-all"
                  value={newBus.number}
                  onChange={(e) => setNewBus({ ...newBus, number: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Total Capacity</label>
                <input
                  type="number"
                  required
                  min="10"
                  max="100"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] focus:border-transparent outline-none transition-all"
                  value={newBus.capacity}
                  onChange={(e) => setNewBus({ ...newBus, capacity: parseInt(e.target.value) })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#F47C20] text-white font-bold rounded-xl shadow-lg shadow-orange-100 hover:bg-[#e06b12] transition-all transform active:scale-95"
                >
                  Save Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusManagement;
