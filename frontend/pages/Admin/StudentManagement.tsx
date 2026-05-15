
import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Download,
  MoreVertical,
  Mail,
  Phone,
  UserPlus,
  CheckCircle,
  XCircle,
  X,
  Bell,
  ArrowRight
} from 'lucide-react';
import { apiRequest } from '../../api';
import { Student, UserRole } from '../../types';
import { API_BASE_URL } from '../../apiBase';

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [morningRoutes, setMorningRoutes] = useState<any[]>([]);
  const [eveningRoutes, setEveningRoutes] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    contactNumber: '',
    morningRouteId: '',
    eveningRouteId: '',
    stopId: '',
    status: 'Active' as 'Active' | 'Inactive',
    password: 'password123',
    address: ''
  });

  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (statusFilter !== 'All') queryParams.append('status', statusFilter);

      const [studentsRes, routesRes, busesRes, stopsRes, morningRes, eveningRes] = await Promise.all([
        apiRequest<{ success: boolean; data: any[] }>(`/admin/students?${queryParams.toString()}`),
        apiRequest<{ success: boolean; data: any[] }>('/admin/routes'),
        apiRequest<{ success: boolean; data: any[] }>('/admin/buses'),
        apiRequest<{ success: boolean; data: any[] }>('/admin/stops'),
        apiRequest<{ success: boolean; data: any[] }>('/admin/morning-routes'),
        apiRequest<{ success: boolean; data: any[] }>('/admin/evening-routes'),
      ]);

      const mapped: Student[] = (studentsRes.data || []).map((s: any) => ({
        id: String(s.id),
        name: String(s.name),
        studentId: String(s.roll_no),
        email: String(s.email || ''),
        contactNumber: String(s.phone || ''),
        morningRouteName: s.morning_route_name || '',
        eveningRouteName: s.evening_route_name || '',
        pickupStop: String(s.stop_name || ''),
        status: (s.status as any) || 'Active',
        role: UserRole.STUDENT,
        joinDate: '2024-01-01'
      })) as Student[];

      setStudents(mapped);
      setRoutes(routesRes?.data || []);
      setBuses(busesRes?.data || []);
      setStops(stopsRes?.data || []);
      setMorningRoutes(morningRes?.data || []);
      setEveningRoutes(eveningRes?.data || []);
    } catch (e: any) {
      console.error('Data load error:', e);
      setError(e?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleExport = () => {
    window.open(`${API_BASE_URL}/admin/export/students`, '_blank');
  };

  const filteredStudents = students; // Logic moved to backend

  const handleAddEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingStudent) {
        // Update logic
        await load();
      } else {
        await apiRequest('/admin/addstudent', {
          method: 'POST',
          json: {
            name: formData.name,
            roll_no: formData.studentId,
            phone: formData.contactNumber,
            email: formData.email,
            address: formData.address,
            password: formData.password,
            stop_id: Number(formData.stopId),
            morning_route_id: Number(formData.morningRouteId),
            evening_route_id: Number(formData.eveningRouteId)
          }
        });
      }
      closeModal();
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to save student');
    }
  };

  const openEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      studentId: student.studentId,
      email: student.email,
      contactNumber: student.contactNumber,
      stopId: student.pickupStop || '',
      status: (student.status as any) || 'Active',
      password: '',
      address: student.address || '',
      morningRouteId: student.morningRouteId || '',
      eveningRouteId: student.eveningRouteId || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    setFormData({
      name: '',
      studentId: '',
      email: '',
      contactNumber: '',
      morningRouteId: '',
      eveningRouteId: '',
      stopId: '',
      status: 'Active',
      password: 'password123',
      address: ''
    });
  };

  const deleteStudent = async (id: string) => {
    if (confirm('Are you sure you want to remove this student?')) {
      try {
        await apiRequest(`/admin/students/${id}`, { method: 'DELETE' });
        await load();
      } catch (e: any) {
        alert(e?.message || 'Failed to delete student');
      }
    }
  };

  const toggleStatus = (id: string) => {
    setStudents(students.map(s => s.id === id ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' } : s));
  };

  const fetchMorningRoutes = async () => {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>('/admin/morning-routes');
      setMorningRoutes(res.data || []);
    } catch (e) {
      console.error('Failed to fetch morning routes', e);
    }
  };

  const fetchEveningRoutes = async () => {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>('/admin/evening-routes');
      setEveningRoutes(res.data || []);
    } catch (e) {
      console.error('Failed to fetch evening routes', e);
    }
  };

  const fetchStops = async () => {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>('/admin/stops');
      setStops(res.data || []);
    } catch (e) {
      console.error('Failed to fetch stops', e);
    }
  };




  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="text-sm text-gray-500">Manage student profiles and transport assignments.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNotifyModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-indigo-200 text-[#2E2D7F] rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors"
          >
            <Bell className="w-4 h-4" /> Bulk Notify
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#F47C20] text-white rounded-lg text-sm font-bold shadow-sm hover:bg-[#e06b12] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, student ID..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#F47C20] outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                className="appearance-none pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#F47C20] outline-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Transport Assignment</th>
                <th className="px-6 py-4">Pickup Stop</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                    Loading students...
                  </td>
                </tr>
              )}
              {!loading && filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-[#2E2D7F] rounded-full flex items-center justify-center font-bold">
                        {(student.name || 'S').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{student.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{student.studentId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Morning</p>
                      <p className="text-xs font-bold text-gray-700">{student.morningRouteName || '—'}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Evening</p>
                      <p className="text-xs font-bold text-gray-700">{student.eveningRouteName || '—'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-600 font-medium">{student.pickupStop || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(student.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${student.status === 'Active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                      {student.status === 'Active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {student.status}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(student)}
                        className="p-1.5 text-gray-400 hover:text-[#2E2D7F] transition-colors"
                        title="Edit Student"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteStudent(student.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2E2D7F]/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-[#2E2D7F] text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold">{editingStudent ? 'Edit Student Profile' : 'Register New Student'}</h3>
                <p className="text-xs text-indigo-200">Fill in the details to manage transport access</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddEdit} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                  <input
                    type="text" required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Student ID</label>
                  <input
                    type="text" required
                    placeholder="KITXXXXXX"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none transition-all"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                  <input
                    type="email" required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Contact Number</label>
                  <input
                    type="tel" required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none transition-all"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                  <input
                    type="password" required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none transition-all"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Home Address</label>
                  <input
                    type="text" required
                    placeholder="Enter full address"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none transition-all"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-bold text-[#2E2D7F] mb-4 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-[#F47C20]" />
                  Transport Assignment
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Morning Route</label>
                    <select
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none transition-all text-sm"
                      value={formData.morningRouteId}
                      onChange={(e) => setFormData({ ...formData, morningRouteId: e.target.value })}
                      onFocus={fetchMorningRoutes}
                    >
                      <option value="">Select Morning Route</option>
                      {morningRoutes.length === 0 && <option disabled>No morning routes found</option>}
                      {morningRoutes.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Evening Route</label>
                    <select
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none transition-all text-sm"
                      value={formData.eveningRouteId}
                      onChange={(e) => setFormData({ ...formData, eveningRouteId: e.target.value })}
                      onFocus={fetchEveningRoutes}
                    >
                      <option value="">Select Evening Route</option>
                      {eveningRoutes.length === 0 && <option disabled>No evening routes found</option>}
                      {eveningRoutes.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Pickup Stop</label>
                    <select
                      disabled={!formData.morningRouteId && !formData.eveningRouteId}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none transition-all text-sm disabled:opacity-50"
                      value={formData.stopId}
                      onChange={(e) => setFormData({ ...formData, stopId: e.target.value })}
                      onFocus={fetchStops}
                    >
                      <option value="">Select Stop</option>
                      {/* Show stops that are part of either selected route */}
                      {(() => {
                        const filteredStops = stops.filter(s =>
                          (formData.morningRouteId && String(s.route_id) === String(formData.morningRouteId)) ||
                          (formData.eveningRouteId && String(s.route_id) === String(formData.eveningRouteId))
                        );

                        // Use a Map to keep stops unique by ID
                        const uniqueStops = Array.from(new Map(filteredStops.map(s => [s.id, s])).values());

                        return uniqueStops.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
              <button onClick={closeModal} type="button" className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-white transition-all">
                Cancel
              </button>
              <button onClick={handleAddEdit} type="submit" className="flex-1 px-6 py-3 bg-[#F47C20] text-white font-bold rounded-xl shadow-lg shadow-orange-100 hover:bg-[#e06b12] transition-all transform active:scale-95">
                {editingStudent ? 'Update Profile' : 'Register Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Notify Modal */}
      {isNotifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2E2D7F]/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 bg-[#2E2D7F] text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Send Announcements</h3>
                <p className="text-xs text-indigo-200">Notify students about route changes or delays</p>
              </div>
              <button onClick={() => setIsNotifyModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Target Audience</label>
                <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none text-sm">
                  <option>All Students</option>
                  <option>Route 1 Students</option>
                  <option>Route 2 Students</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Message Body</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none text-sm resize-none"
                  placeholder="Type your announcement here..."
                ></textarea>
              </div>
              <button
                onClick={() => setIsNotifyModalOpen(false)}
                className="w-full py-3 bg-[#F47C20] text-white font-bold rounded-xl shadow-lg hover:bg-[#e06b12] transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" /> Broadcast Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
