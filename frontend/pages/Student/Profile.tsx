
import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Bus, 
  Shield, 
  Camera, 
  Save, 
  Bell, 
  Moon, 
  Settings,
  ChevronRight,
  LogOut,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { User as UserType } from '../../types';
import { MOCK_ROUTES } from '../../constants';
import { apiRequest } from '../../api';

interface StudentProfileProps {
  user: UserType;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const fetchProfile = async () => {
    try {
      const res = await apiRequest<{ success: boolean; data: any }>(`/student/profile/${user.id}`);
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

  const handleSave = () => {
    setIsEditing(false);
    // In a real app, this would hit an API to update name/phone/email
    alert('Profile updated successfully!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F47C20]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl border border-dashed border-gray-200 p-12">
        <AlertCircle className="w-12 h-12 text-red-100 mb-4" />
        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Profile Data Not Found</h3>
        <p className="text-sm text-gray-500 mt-2">We couldn't retrieve your profile details. Please try again later.</p>
        <button onClick={fetchProfile} className="mt-6 px-6 py-2 bg-[#2E2D7F] text-white font-bold rounded-xl text-xs uppercase tracking-widest">
          Retry Loading
        </button>
      </div>
    );
  }

  const p = profile;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500">Manage your personal information and transport settings.</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#F47C20] text-white rounded-xl font-bold shadow-lg shadow-orange-100 hover:bg-[#e06b12] transition-all transform active:scale-95"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#2E2D7F] text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-opacity-90 transition-all transform active:scale-95"
            >
              <Settings className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-center p-8">
            <div className="relative mx-auto w-32 h-32 mb-4">
              <div className="w-full h-full rounded-full bg-indigo-50 flex items-center justify-center text-[#2E2D7F] text-4xl font-black border-4 border-white shadow-md uppercase">
                {p.student_name?.charAt(0)}
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{p.student_name}</h2>
            <p className="text-xs font-bold text-[#F47C20] uppercase tracking-widest mt-1">{p.roll_no}</p>
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-bold">Status</span>
                <span className="text-green-600 font-black uppercase tracking-tighter">Verified</span>
              </div>
            </div>
          </div>

          <div className="bg-[#2E2D7F] rounded-3xl p-6 text-white shadow-xl">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-[#F47C20]" />
              Account Settings
            </h3>
            <div className="space-y-1">
              {[
                { label: 'Notifications', icon: Bell, active: true },
                { label: 'Biometric Access', icon: Smartphone, active: true }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-indigo-300" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${item.active ? 'bg-[#F47C20]' : 'bg-white/20'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${item.active ? 'left-4.5' : 'left-0.5'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 uppercase tracking-widest text-xs opacity-60">Personal Information</h3>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-transparent rounded-xl">
                  <User className="w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    readOnly={!isEditing}
                    className="bg-transparent text-sm font-bold text-gray-700 outline-none w-full"
                    value={p.student_name || p.name || ''}
                    onChange={(e) => setProfile({...p, student_name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Roll Number</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-transparent rounded-xl">
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    readOnly
                    className="bg-transparent text-sm font-bold text-gray-500 outline-none w-full"
                    value={p.roll_no || ''}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-transparent rounded-xl">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <input 
                    type="email" 
                    readOnly={!isEditing}
                    className="bg-transparent text-sm font-bold text-gray-700 outline-none w-full"
                    value={p.email || ''}
                    onChange={(e) => setProfile({...p, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-transparent rounded-xl">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <input 
                    type="tel" 
                    readOnly={!isEditing}
                    className="bg-transparent text-sm font-bold text-gray-700 outline-none w-full"
                    value={p.phone || ''}
                    onChange={(e) => setProfile({...p, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Residential Address</label>
                <div className="flex items-start gap-3 p-3 bg-gray-50 border border-transparent rounded-xl">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <p className="text-sm font-bold text-gray-700 leading-relaxed">{p.address || 'No address provided'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 uppercase tracking-widest text-xs opacity-60">Transport Details</h3>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-[#F47C20]">
                    <Bus className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#F47C20] uppercase tracking-tighter">Current Bus</p>
                    <p className="text-lg font-black text-gray-900">{p.bus_number || 'TBD'}</p>
                  </div>
                </div>
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">Assigned Stop</p>
                    <p className="text-lg font-black text-gray-900">{p.stop_name || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Morning Route</label>
                  <p className="text-sm font-black text-gray-800 mt-1">{p.morning_route_name || 'None'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Evening Route</label>
                  <p className="text-sm font-black text-gray-800 mt-1">{p.evening_route_name || 'None'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
