
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  MapPin,
  Bus as BusIcon,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Trash2,
  Edit2,
  ArrowRightLeft,
  X,
  Sun,
  Moon,
  Info,
  Search,
  Download,
  Filter
} from 'lucide-react';
import { TripSchedule } from '../../types';
import { apiRequest } from '../../api';
import { API_BASE_URL } from '../../apiBase';

const SchedulingModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Pickup' | 'Drop'>('Pickup');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<TripSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [schedules, setSchedules] = useState<TripSchedule[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    busId: '',
    driverId: '',
    routeId: '',
    time: '08:00 AM',
    type: 'Pickup' as 'Pickup' | 'Drop'
  });

  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      queryParams.append('type', activeTab === 'Pickup' ? 'morning' : 'evening');

      const [tripsRes, busesRes, routesRes, driversRes] = await Promise.all([
        apiRequest<{ success: boolean; data: any[] }>(`/admin/livetrips?${queryParams.toString()}`),
        apiRequest<{ success: boolean; data: any[] }>('/admin/buses'),
        apiRequest<{ success: boolean; data: any[] }>('/admin/routes'),
        apiRequest<{ success: boolean; data: any[] }>('/admin/drivers'),
      ]);

      const mappedTrips: TripSchedule[] = (tripsRes.data || []).map((t: any) => {
        const isMorning = String(t.shift || t.trip_shift).toLowerCase() === 'morning';
        return {
          id: String(t.id || t.trip_id),
          busId: String(t.bus_id),
          routeId: String(t.route_id),
          time: isMorning ? '07:30 AM' : '04:30 PM',
          type: isMorning ? 'Pickup' : 'Drop',
          status: (t.status || t.trip_status) === 'scheduled' ? 'Active' : 'Completed'
        };
      });

      setSchedules(mappedTrips);
      setBuses(busesRes.data || []);
      setRoutes(routesRes.data || []);
      setDrivers(driversRes.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load scheduling data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, activeTab]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.busId || !formData.routeId || !formData.driverId) {
      setError('Please select bus, driver, and route');
      return;
    }
    setError(null);
    try {
      await apiRequest('/admin/addtrip', {
        method: 'POST',
        json: {
          route_id: Number(formData.routeId),
          bus_id: Number(formData.busId),
          driver_id: Number(formData.driverId),
          shift: formData.type === 'Pickup' ? 'morning' : 'evening'
        }
      });
      setIsAddModalOpen(false);
      setFormData({ ...formData, busId: '', driverId: '', routeId: '' });
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to add trip');
    }
  };

  const filteredSchedules = schedules;

  const handleExport = () => {
    window.open(`${API_BASE_URL}/admin/export/trips`, '_blank');
  };

  const hasConflict = (busId: string, time: string, id?: string) => {
    return schedules.some(s => String(s.busId) === String(busId) && s.time === time && s.id !== id);
  };

  const handleEmergencyReschedule = (schedule: TripSchedule) => {
    setSelectedSchedule(schedule);
    setIsEmergencyModalOpen(true);
  };

  const deleteSchedule = async (id: string) => {
    if (confirm('Delete this scheduled trip?')) {
      try {
        await apiRequest(`/admin/deletetrip/${id}`, { method: 'DELETE' });
        await load();
      } catch (e: any) {
        alert(e?.message || 'Failed to delete trip');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Scheduling</h1>
          <p className="text-sm text-gray-500">Manage daily pickup and drop timelines.</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab('Pickup')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Pickup' ? 'bg-orange-50 text-[#F47C20]' : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            <Sun className="w-4 h-4" /> Morning Pickup
          </button>
          <button
            onClick={() => setActiveTab('Drop')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Drop' ? 'bg-[#2E2D7F]/10 text-[#2E2D7F]' : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            <Moon className="w-4 h-4" /> Evening Drop
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bus or route..."
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[#F47C20] outline-none w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-white transition-all"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2 bg-[#F47C20] text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-100 hover:bg-[#e06b12] transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Create Trip
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSchedules.map((schedule) => {
          const bus = buses.find(b => String(b.id) === String(schedule.busId));
          const route = routes.find(r => String(r.id) === String(schedule.routeId));
          const conflict = hasConflict(schedule.busId, schedule.time, schedule.id);

          return (
            <div key={schedule.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${schedule.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-black text-gray-900">{schedule.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${schedule.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'
                    }`}>
                    {schedule.status}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#2E2D7F] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Route</p>
                    <p className="text-sm font-bold text-gray-900 leading-tight">{route?.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F47C20] flex items-center justify-center shrink-0">
                    <BusIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Bus & Driver</p>
                    <p className="text-sm font-bold text-gray-900 leading-tight">{bus?.number}</p>
                    <p className="text-[10px] text-gray-500">ID: {bus?.driverId}</p>
                  </div>
                </div>

                {conflict && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-[10px] font-bold">Bus assigned elsewhere at this time!</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => handleEmergencyReschedule(schedule)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-gray-200 text-[#2E2D7F] rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Emergency Swap
                </button>
                <button
                  onClick={() => deleteSchedule(schedule.id)}
                  className="p-2 text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {filteredSchedules.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">No {activeTab.toLowerCase()} trips scheduled for today.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 text-[#F47C20] font-bold text-sm hover:underline"
            >
              Add first trip
            </button>
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
        <Info className="w-6 h-6 text-blue-600 mt-0.5" />
        <div>
          <h4 className="font-bold text-blue-900">Conflict-Free Scheduling System</h4>
          <p className="text-sm text-blue-700 mt-1 leading-snug">
            The system automatically validates bus availability. Red alerts indicate a single bus or driver is overlapping between routes. Use "Emergency Swap" to reassign vehicles instantly.
          </p>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2E2D7F]/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 bg-[#2E2D7F] text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">New Trip Schedule</h3>
                <p className="text-xs text-indigo-200">Set route and bus allocation</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Trip Type</label>
                  <select
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  >
                    <option value="Pickup">Pickup (Morning)</option>
                    <option value="Drop">Drop (Evening)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Scheduled Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 08:00 AM"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Select Route</label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none"
                  value={formData.routeId}
                  onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                >
                  <option value="">Choose Route</option>
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Assign Bus (Available Only)</label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none"
                  value={formData.busId}
                  onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
                >
                  <option value="">Choose Bus</option>
                  {buses.filter(b => b.status === 'available').map(b => (
                    <option key={b.id} value={b.id}>{b.bus_number}</option>
                  ))}
                  {buses.filter(b => b.status !== 'available').length > 0 && (
                    <optgroup label="Already Assigned">
                      {buses.filter(b => b.status !== 'available').map(b => (
                        <option key={b.id} value={b.id} disabled>{b.bus_number} (Busy)</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Assign Driver (Available Only)</label>
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none"
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                >
                  <option value="">Choose Driver</option>
                  {drivers.filter(d => d.status === 'available').map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                  {drivers.filter(d => d.status !== 'available').length > 0 && (
                    <optgroup label="Already Assigned">
                      {drivers.filter(d => d.status !== 'available').map(d => (
                        <option key={d.id} value={d.id} disabled>{d.name} (Busy)</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-[#F47C20] text-white font-bold rounded-xl shadow-lg hover:bg-[#e06b12]">Save Trip</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Reschedule Modal */}
      {isEmergencyModalOpen && selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 bg-red-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Emergency Reassignment</h3>
                <p className="text-xs text-red-100">Swap bus for scheduled trip</p>
              </div>
              <button onClick={() => setIsEmergencyModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-900">Active Warning</p>
                  <p className="text-[11px] text-red-700 leading-snug">
                    Current Bus ({buses.find(b => String(b.id) === String(selectedSchedule.busId))?.bus_number}) will be replaced for this trip only. Notify students?
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Select Available Backup Bus</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  onChange={async (e) => {
                    const newBusId = e.target.value;
                    if (newBusId && selectedSchedule) {
                      try {
                        await apiRequest('/admin/swap-bus', {
                          method: 'POST',
                          json: {
                            trip_id: Number(selectedSchedule.id),
                            new_bus_id: Number(newBusId)
                          }
                        });
                        setIsEmergencyModalOpen(false);
                        await load();
                        alert("Bus swapped successfully!");
                      } catch (e: any) {
                        alert(e?.message || "Failed to swap bus");
                      }
                    }
                  }}
                >
                  <option value="">Choose Replacement Bus</option>
                  {buses.filter(b => b.status === 'available').map(b => (
                    <option key={b.id} value={b.id}>{b.bus_number} (Available)</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="notify-students" className="h-4 w-4 text-red-600" defaultChecked />
                <label htmlFor="notify-students" className="text-xs font-bold text-gray-600">Send push alerts to students</label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulingModule;
