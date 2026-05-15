
import React, { useState } from 'react';
import { 
  Bell, 
  Send, 
  Clock, 
  Trash2, 
  Filter, 
  AlertTriangle, 
  Info, 
  X, 
  Users, 
  Bus as BusIcon, 
  MapPin, 
  CheckCircle,
  Calendar,
  Zap
} from 'lucide-react';
import { MOCK_ROUTES, MOCK_BUSES } from '../../constants';
import { Notification } from '../../types';
import { apiRequest } from '../../api';

const AlertsManagement: React.FC = () => {
  const [alerts, setAlerts] = useState<Notification[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'alert',
    category: 'General' as any,
    target: 'All' as any,
    targetId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const alertsRes = await apiRequest<{ success: boolean; data: any[] }>('/admin/alerts');
      if (alertsRes.success) setAlerts(alertsRes.data);

      const routesRes = await apiRequest<{ success: boolean; data: any[] }>('/admin/routes');
      if (routesRes.success) setRoutes(routesRes.data);

      const busesRes = await apiRequest<{ success: boolean; data: any[] }>('/admin/buses');
      if (busesRes.success) setBuses(busesRes.data);
    } catch (e) {
      console.error("Failed to fetch alerts data:", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest<{ success: boolean; data: any }>('/admin/alerts', {
        method: 'POST',
        json: newAlert
      });
      
      if (res.success) {
        setAlerts([res.data, ...alerts]);
        setIsModalOpen(false);
        setNewAlert({
          title: '',
          message: '',
          type: 'info',
          category: 'General',
          target: 'All',
          targetId: ''
        });
        alert("Alert broadcasted successfully!");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to send alert");
    }
  };

  const deleteAlert = async (id: string) => {
    if (confirm('Delete this alert from history?')) {
      try {
        const res = await apiRequest<{ success: boolean }> (`/admin/alerts/${id}`, {
          method: 'DELETE'
        });
        if (res.success) {
          setAlerts(alerts.filter(a => String(a.id) !== id));
        }
      } catch (e) {
        console.error(e);
        alert("Failed to delete alert");
      }
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'alert': return <Zap className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
          <p className="text-sm text-gray-500">Broadcast important updates to students and staff.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#F47C20] text-white rounded-xl font-bold shadow-lg shadow-orange-100 hover:bg-[#e06b12] transition-all transform active:scale-95"
        >
          <Send className="w-4 h-4" /> Create New Alert
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Form / Quick Actions */}
        <div className="md:col-span-1 space-y-6">


          <div className="bg-[#2E2D7F] p-6 rounded-2xl text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg text-[#F47C20]">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="font-bold">Broadcast Stats</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-xs text-indigo-200">Total Alerts</span>
                <span className="text-xl font-black">{alerts.length}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs text-indigo-200">Warnings/Critical</span>
                <span className="text-xl font-black text-orange-400">
                  {alerts.filter(a => a.type === 'warning' || a.type === 'alert').length}
                </span>
              </div>
              <div className="h-px bg-white/10 my-2"></div>
              <p className="text-[10px] text-indigo-300 leading-snug">
                Alerts are delivered to student panels and driver dashboards instantly based on your targeting.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Alert History */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Recent Alert History
            </h3>
            <div className="flex items-center gap-2">
              <button className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-100 rounded-lg">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl shrink-0 ${
                    alert.type === 'warning' ? 'bg-orange-50' : 
                    alert.type === 'alert' ? 'bg-red-50' : 'bg-blue-50'
                  }`}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-gray-900 truncate">{alert.title}</h4>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      {alert.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-gray-100 text-gray-500 rounded">
                        {alert.category}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-indigo-50 text-indigo-600 rounded flex items-center gap-1">
                        <Users className="w-3 h-3" /> To: {alert.target}
                        {alert.targetId && ` (${alert.targetId})`}
                      </span>
                      <span className="ml-auto text-[10px] font-bold text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Delivered
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteAlert(alert.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Alert Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2E2D7F]/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-[#2E2D7F] text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <Bell className="w-6 h-6 text-[#F47C20]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Compose Broadcast</h3>
                  <p className="text-xs text-indigo-200">Select target and message type</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSendAlert} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alert Category</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none"
                    value={newAlert.category}
                    onChange={(e) => setNewAlert({...newAlert, category: e.target.value as any})}
                  >
                    <option value="General">General Announcement</option>
                    <option value="Delay">Bus Delay</option>
                    <option value="Route Change">Route Change</option>
                    <option value="Holiday">Holiday / Closure</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority Level</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none"
                    value={newAlert.type}
                    onChange={(e) => setNewAlert({...newAlert, type: e.target.value as any})}
                  >
                    <option value="info">Information (Blue)</option>
                    <option value="warning">Warning (Orange)</option>
                    <option value="alert">Critical / Urgent (Red)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Audience</label>
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none"
                    value={newAlert.target}
                    onChange={(e) => setNewAlert({...newAlert, target: e.target.value as any, targetId: ''})}
                  >
                    <option value="All">All Students & Staff</option>
                    <option value="Specific Route">Route-wise Students</option>
                    <option value="Specific Bus">Bus-wise Students</option>
                    <option value="Drivers Only">All Drivers Only</option>
                  </select>
                  
                  {newAlert.target === 'Specific Route' && (
                    <select 
                      className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none"
                      value={newAlert.targetId}
                      onChange={(e) => setNewAlert({...newAlert, targetId: e.target.value})}
                      required
                    >
                      <option value="">Select Route</option>
                      {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  )}

                  {newAlert.target === 'Specific Bus' && (
                    <select 
                      className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none"
                      value={newAlert.targetId}
                      onChange={(e) => setNewAlert({...newAlert, targetId: e.target.value})}
                      required
                    >
                      <option value="">Select Bus</option>
                      {buses.map(b => <option key={b.id} value={b.id}>{b.bus_number}</option>)}
                    </select>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alert Title</label>
                <input 
                  type="text" required
                  placeholder="e.g. Traffic Delay Notification"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none font-bold"
                  value={newAlert.title}
                  onChange={(e) => setNewAlert({...newAlert, title: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Message Body</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Provide detailed information here..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F47C20] outline-none resize-none"
                  value={newAlert.message}
                  onChange={(e) => setNewAlert({...newAlert, message: e.target.value})}
                />
              </div>

              <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#F47C20] shrink-0 mt-0.5" />
                <p className="text-[11px] text-orange-700 leading-snug">
                  Sending this will trigger push notifications and SMS alerts to selected mobile numbers. Ensure all information is accurate before broadcasting.
                </p>
              </div>
            </form>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4 shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                type="button" 
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-white transition-all text-sm"
              >
                Discard
              </button>
              <button 
                onClick={handleSendAlert}
                type="submit" 
                className="flex-1 px-6 py-3 bg-[#F47C20] text-white font-bold rounded-xl shadow-lg shadow-orange-100 hover:bg-[#e06b12] transition-all transform active:scale-95 text-sm flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Broadcast Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsManagement;
