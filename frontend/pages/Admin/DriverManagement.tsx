import React, { useState, useEffect } from 'react';
import {
  UserCircle,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Bus as BusIcon,
  X,
  Save,
  Calendar,
  MoreVertical,
  Filter,
  Download
} from 'lucide-react';
import { Driver, UserRole } from '../../types';
import { apiRequest } from '../../api';
import { API_BASE_URL } from '../../apiBase';

const DriverManagement: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    liscence_no: '',
    address: '',
    status: 'Active' as any,
    password: 'password123'
  });

  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'On Trip' | 'On Leave'>('All');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (statusFilter !== 'All') queryParams.append('status', statusFilter);

      const [driversRes, busesRes] = await Promise.all([
        apiRequest<{ success: boolean; data: any[] }>(`/admin/drivers?${queryParams.toString()}`),
        apiRequest<{ success: boolean; data: any[] }>('/admin/buses'),
      ]);
      const res = driversRes;
      setBuses(busesRes.data || []);
      const mapped: Driver[] = (res.data || []).map((d) => ({
        id: String(d.id),
        name: String(d.name),
        email: String(d.email),
        phone: String(d.phone),
        licenseNumber: String(d.liscence_no),
        experience: '5 Years', // Default if not in DB
        role: UserRole.DRIVER,
        rating: 4.8,
        joinDate: '2024-01-01',
        status: (d.status as any) || 'Active',
        assignedBusId: d.assigned_bus ? String(d.assigned_bus) : undefined
      })) as Driver[];
      setDrivers(mapped);
    } catch (e: any) {
      setError(e?.message || 'Failed to load drivers');
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

  const handleExport = () => {
    window.open(`${API_BASE_URL}/admin/export/drivers`, '_blank');
  };

  const filteredDrivers = drivers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingDriver) {
        // Update logic (not fully implemented in backend yet, but we'll simulate or add later)
        // For now, let's just refresh
        await load();
      } else {
        await apiRequest('/admin/adddriver', {
          method: 'POST',
          json: {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            password: formData.password,
            liscence_no: formData.liscence_no
          }
        });
      }
      closeModal();
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to save driver');
    }
  };

  const openEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      liscence_no: driver.liscence_no,
      address: (driver as any).address || '',
      status: driver.status || 'Active',
      password: ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDriver(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      liscence_no: '',
      address: '',
      status: 'Active',
      password: 'password123'
    });
  };

  const deleteDriver = async (id: string) => {
    if (confirm('Permanently remove this driver from the system?')) {
      try {
        await apiRequest(`/admin/drivers/${id}`, { method: 'DELETE' });
        await load();
      } catch (e: any) {
        alert(e?.message || 'Failed to delete driver');
      }
    }
  };


  const statusMap = {
    'Active': { color: 'bg-green-100 text-green-700', icon: CheckCircle },
    'On Trip': { color: 'bg-blue-100 text-blue-700', icon: BusIcon },
    'On Leave': { color: 'bg-red-100 text-red-700', icon: Clock },
    'Inactive': { color: 'bg-gray-100 text-gray-500', icon: XCircle }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
          <p className="text-sm text-gray-500">Register, assign, and monitor transport staff.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#F47C20] text-white rounded-lg text-sm font-bold shadow-sm hover:bg-[#e06b12] transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Register Driver
        </button>
      </div>

      {/* Driver Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Drivers', value: drivers.length, icon: UserCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'On Trip', value: drivers.filter(d => d.status === 'On Trip').length, icon: BusIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Available', value: drivers.filter(d => d.status === 'Active').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Avg Rating', value: '4.7 ★', icon: Star, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 ${stat.bg} ${stat.color} rounded-lg`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stat.label}</p>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, license..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#F47C20] outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select
                className="appearance-none pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#F47C20] outline-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="On Trip">On Trip</option>
                <option value="On Leave">On Leave</option>
              </select>
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={handleExport}
              className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <th className="px-6 py-4">Driver Profile</th>
                <th className="px-6 py-4">Contact & License</th>
                <th className="px-6 py-4">Assignment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                    Loading drivers...
                  </td>
                </tr>
              )}
              {!loading && filteredDrivers.map((driver) => {
                const statusInfo = (statusMap as any)[driver.status] || statusMap['Active'];
                const StatusIcon = statusInfo.icon;
                return (
                  <tr key={driver.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-[#F47C20] flex items-center justify-center font-bold text-sm">
                          {(driver.name || 'Driver').split(' ').filter(Boolean).map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{driver.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star className="w-3 h-3 text-orange-400 fill-current" />
                            <span className="text-[10px] font-bold text-gray-500">{driver.rating} Rating</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 flex items-center gap-1.5 font-medium">
                          <Phone className="w-3 h-3 text-gray-400" /> {driver.phone}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 uppercase">
                          <Shield className="w-3 h-3 text-gray-300" /> {driver.licenseNumber}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {driver.assignedBusId ? (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                            <BusIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-gray-700">
                            {buses.find(b => String(b.id) === String(driver.assignedBusId))?.bus_number || 'Bus #' + driver.assignedBusId}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-300 uppercase italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {driver.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(driver)}
                          className="p-1.5 text-gray-400 hover:text-[#2E2D7F] transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteDriver(driver.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Registration / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2E2D7F]/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-[#2E2D7F] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <UserCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{editingDriver ? 'Update Driver Information' : 'Register New Staff'}</h3>
                  <p className="text-xs text-indigo-200">Personnel data and license validation</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
              <section className="space-y-4">
                <h4 className="text-xs font-black text-[#2E2D7F] uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Personal Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Full Name</label>
                    <input
                      type="text" required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none transition-all font-medium"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</label>
                    <input
                      type="tel" required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none transition-all font-medium"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Email Address</label>
                    <input
                      type="email" required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none transition-all font-medium"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Home Address</label>
                    <input
                      type="text" required placeholder="Full residential address"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none transition-all font-medium"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  {!editingDriver && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">System Password</label>
                      <input
                        type="password" required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none transition-all font-medium"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-xs font-black text-[#2E2D7F] uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Professional Records</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Driving License Number</label>
                    <input
                      type="text" required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none transition-all font-medium"
                      value={formData.liscence_no}
                      onChange={(e) => setFormData({ ...formData, liscence_no: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Staff Status</label>
                    <select
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none transition-all font-medium"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      <option value="Active">Available / Active</option>
                      <option value="On Trip">Currently on Duty</option>
                      <option value="On Leave">On Leave / Sick</option>
                      <option value="Inactive">Terminated / Inactive</option>
                    </select>
                  </div>
                </div>
              </section>


            </form>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4 shrink-0">
              <button
                onClick={closeModal}
                type="button"
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-white transition-all text-sm"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSubmit}
                type="submit"
                className="flex-1 px-6 py-3 bg-[#F47C20] text-white font-bold rounded-xl shadow-lg shadow-orange-100 hover:bg-[#e06b12] transition-all transform active:scale-95 text-sm flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> {editingDriver ? 'Save Records' : 'Register Driver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;
