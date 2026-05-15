import React, { useState } from 'react';
import { apiRequest } from '../../api';
import {
  User,
  Mail,
  Phone,
  Shield,
  Star,
  Bus,
  LogOut,
  Camera,
  Save,
  Settings,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  Briefcase
} from 'lucide-react';
import { User as UserType } from '../../types';

interface DriverProfileProps {
  user: UserType;
  onLogout: () => void;
}

const DriverProfile: React.FC<DriverProfileProps> = ({ user, onLogout }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await apiRequest<{ success: boolean; data: any }>(`/driver/profile/${user.id}`);
      if (res.success) {
        setProfile(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProfile();
  }, [user.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F47C20]"></div>
      </div>
    );
  }

  const driverData = profile || user;

  const statusOptions = [
    { value: 'Active', label: 'Available', color: 'text-green-600', bg: 'bg-green-50' },
    { value: 'On Trip', label: 'On Trip', color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: 'On Leave', label: 'On Leave', color: 'text-red-600', bg: 'bg-red-50' }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Account Settings</h1>
          <p className="text-sm text-gray-500">Manage your professional identity and account security.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all transform active:scale-95"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar and Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center relative overflow-hidden">
            <div className="relative mx-auto w-32 h-32 mb-6">
              <div className="w-full h-full rounded-full bg-orange-100 flex items-center justify-center text-[#F47C20] text-4xl font-black border-4 border-white shadow-md">
                {driverData.name?.split(' ').map((n: string) => n[0]).join('') || 'D'}
              </div>
            </div>

            <h2 className="text-2xl font-black text-gray-900">{driverData.name}</h2>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Star className="w-4 h-4 text-orange-400 fill-current" />
              <span className="text-sm font-bold text-gray-600">Verified Professional</span>
            </div>

            <div className="mt-8 space-y-3">
              <div className="p-1 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-2 px-3">Driver Status</p>
                <div className="p-2">
                  <div className={`py-2 rounded-xl text-xs font-black uppercase text-center ${statusOptions.find(o => o.value === driverData.status)?.bg || 'bg-gray-100'
                    } ${statusOptions.find(o => o.value === driverData.status)?.color || 'text-gray-400'
                    }`}>
                    {driverData.status || 'Active'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#2E2D7F] rounded-3xl p-6 text-white shadow-xl">
            <h3 className="font-bold flex items-center gap-2 mb-6 uppercase tracking-widest text-xs opacity-70">
              <Briefcase className="w-4 h-4 text-[#F47C20]" />
              Employment Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-xs text-indigo-200">Trips Completed</span>
                <span className="font-bold text-green-400">{driverData.total_trips || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-xs text-indigo-200">Service Area</span>
                <span className="font-bold">Primary Campus</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-indigo-200">On-Time Score</span>
                <span className="font-bold text-[#F47C20]">98.4%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Information Forms */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Professional Records</h3>
              <FileText className="w-5 h-5 text-gray-300" />
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-transparent">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">{driverData.name}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Driving License</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-transparent">
                  <Shield className="w-4 h-4 text-[#F47C20]" />
                  <span className="text-sm font-bold text-gray-700">{driverData.liscence_no}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-transparent">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">{driverData.email}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Number</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-transparent">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">{driverData.phone}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Safety & Emergency Info</h3>
              <AlertTriangle className="w-5 h-5 text-orange-200" />
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Home Address</label>
                <div className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-bold text-gray-700">
                  {driverData.address || "Not specified"}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee ID</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-bold text-gray-700">EMP-D-{driverData.id.toString().padStart(4, '0')}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Emergency Contact</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Phone className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-bold text-gray-700">Campus Security (911)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100 flex items-start gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-[#2E2D7F]">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-[#2E2D7F]">Certified Professional</h4>
              <p className="text-sm text-indigo-700 mt-1 leading-relaxed font-medium">
                Your driving credentials and safety certifications are up to date. You are authorized to operate all fleet vehicles assigned to you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;
