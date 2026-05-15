
import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  AlertTriangle,
  Info,
  Calendar,
  MapPin,
  Bus,
  ChevronRight,
  Filter,
  Trash2
} from 'lucide-react';
import { Notification } from '../../types';
import { apiRequest } from '../../api';

const StudentNotifications: React.FC<{ user: any }> = ({ user }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>(`/student/notifications/${user.id}`);
      if (res.success) {
        setNotifications(res.data.map(n => ({
          ...n,
          read: n.is_read // map backend is_read to local read
        })));
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
  }, [user.id]);

  const [activeFilter, setActiveFilter] = useState('All');

  const filteredNotifications = notifications.filter(n =>
    activeFilter === 'All' ? true : n.category === activeFilter
  );

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n =>
        apiRequest('/student/notifications/read', {
          method: 'POST',
          json: { studentId: user.id, alertId: n.id }
        })
      ));
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.read) {
      try {
        await apiRequest('/student/notifications/read', {
          method: 'POST',
          json: { studentId: user.id, alertId: id }
        });
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiRequest('/student/notifications/delete', {
        method: 'POST', // We'll add this route
        json: { studentId: user.id, alertId: id }
      });
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
      alert("Failed to delete notification");
    }
  };

  const getIcon = (category: string, type: string) => {
    if (type === 'warning') return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    if (type === 'alert') return <Bus className="w-5 h-5 text-red-500" />;

    switch (category) {
      case 'Holiday': return <Calendar className="w-5 h-5 text-indigo-500" />;
      case 'Route Change': return <MapPin className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-[#2E2D7F]" />;
    }
  };

  const getTimeLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 3600000) return 'Just now';
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-[#F47C20]/10 rounded-xl">
              <Bell className="w-6 h-6 text-[#F47C20]" />
            </div>
            Notifications
          </h1>
          <p className="text-sm text-gray-500 ml-12">Stay updated with route changes and bus status.</p>
        </div>
        <button
          onClick={markAllAsRead}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#2E2D7F] hover:bg-indigo-50 rounded-xl transition-colors"
        >
          <CheckCheck className="w-4 h-4" /> Mark all as read
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['All', 'Delay', 'Route Change', 'Holiday', 'General'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeFilter === filter
              ? 'bg-[#2E2D7F] text-white shadow-md'
              : 'bg-white text-gray-500 border border-gray-100 hover:border-indigo-200'
              }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id)}
              className={`relative bg-white p-5 rounded-2xl border transition-all cursor-pointer group ${notif.read ? 'border-gray-100 opacity-80' : 'border-indigo-100 shadow-md ring-1 ring-indigo-50'
                }`}
            >
              {!notif.read && (
                <div className="absolute top-5 right-5 w-2 h-2 bg-[#F47C20] rounded-full"></div>
              )}

              <div className="flex gap-4">
                <div className={`p-3 rounded-2xl shrink-0 ${notif.type === 'warning' ? 'bg-orange-50' :
                  notif.type === 'alert' ? 'bg-red-50' : 'bg-indigo-50'
                  }`}>
                  {getIcon(notif.category, notif.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-bold ${notif.read ? 'text-gray-700' : 'text-[#2E2D7F] text-lg'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {getTimeLabel(notif.timestamp)}
                    </span>
                  </div>

                  <p className={`text-sm leading-relaxed ${notif.read ? 'text-gray-500' : 'text-gray-600 font-medium'}`}>
                    {notif.message}
                  </p>

                  <div className="flex items-center gap-3 pt-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${notif.category === 'Delay' ? 'bg-orange-100 text-orange-700' :
                      notif.category === 'Holiday' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                      {notif.category}
                    </span>

                    {notif.category === 'Delay' && !notif.read && (
                      <button className="text-[10px] font-bold text-[#F47C20] flex items-center gap-0.5 hover:underline">
                        Track Bus <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                    className="p-2 text-gray-300 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
            <Bell className="w-12 h-12 text-gray-100 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest">No notifications found</p>
            <p className="text-xs text-gray-300 mt-1">Try changing the filters</p>
          </div>
        )}
      </div>

      {filteredNotifications.length > 0 && (
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
          <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest">
            Showing {filteredNotifications.length} Notifications
          </p>
          <button
            onClick={fetchNotifications}
            className="text-xs font-black text-[#2E2D7F] hover:underline uppercase tracking-widest"
          >
            Refresh List
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentNotifications;
