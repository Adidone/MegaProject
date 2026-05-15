import React, { useEffect, useState } from 'react';
import { Users, CheckCircle, XCircle, Search, MapPin, ChevronLeft, Navigation, Clock } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { User } from '../../types';
import LiveTrackingMap from '../../components/LiveTrackingMap';
import { apiRequest } from '../../api';

const DriverTrip: React.FC<{ user: User }> = ({ user }) => {
  const [stops, setStops] = useState<any[]>([]);
  const [routeName, setRouteName] = useState<string>('');
  const [currentStopIdx, setCurrentStopIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);

  const fetchTripData = async () => {
    setLoading(true);
    try {
      const hour = new Date().getHours();
      const currentShift = hour < 14 ? 'Morning' : 'Evening';

      const res = await apiRequest<{ success: boolean; data: any[]; route_name?: string }>(
        `/driver/stop-student-count?driver_id=${user.id}&shift=${currentShift}`
      );

      if (res.success) {
        setRouteName(res.route_name || '');
        setStops(res.data.map(s => ({
          id: String(s.stop_id),
          stop_name: s.stop_name,
          latitude: s.latitude,
          longitude: s.longitude,
          studentCount: s.total_students,
          comingCount: s.coming_today,
          notComingCount: s.not_coming_today,
          completed: s.is_completed
        })));
      }
    } catch (e) {
      console.error("Failed to fetch driver trip data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripData();
    const interval = setInterval(fetchTripData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleArriveAtStop = async (stopId: string) => {
    try {
      const stop = stops.find(s => s.id === stopId);
      if (!stop) return;

      const res = await apiRequest<{ success: boolean; trip_completed?: boolean }>('/driver/update-location', {
        method: 'POST',
        json: {
          driver_id: user.id,
          latitude: stop.latitude,
          longitude: stop.longitude
        }
      });
      
      if (res?.trip_completed) {
        alert("Trip Completed Successfully!");
        window.location.href = '/'; 
      } else {
        setCurrentStopIdx(i => Math.min(stops.length - 1, i + 1));
        await fetchTripData();
      }
    } catch (e) {
      console.error("Arrival update failed:", e);
      alert('Failed to update stop status');
    }
  };

  const handleLocationUpdate = (lat: number, lng: number) => {
    if (stops.length > currentStopIdx) {
      const nextStop = stops[currentStopIdx];
      const R = 6371;
      const dLat = (nextStop.latitude - lat) * Math.PI / 180;
      const dLon = (nextStop.longitude - lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(nextStop.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;
      setDistance(dist);
      setEta(Math.max(1, Math.round((dist / 25) * 60))); 
    }
  };

  const currentStop = stops[currentStopIdx];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <NavLink to="/" className="flex items-center text-sm font-bold text-[#2E2D7F] hover:underline">
          <ChevronLeft className="w-4 h-4 mr-1" /> Dashboard
        </NavLink>
        <div className="text-right">
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Active Trip</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            {routeName || 'Route Not Assigned'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Map Section */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden h-[450px] relative">
            <LiveTrackingMap
              role="driver"
              userId={user.id}
              stops={stops.map(s => ({
                latitude: Number(s.latitude),
                longitude: Number(s.longitude),
                name: s.stop_name,
                coming_today: s.comingCount,
                not_coming_today: s.notComingCount
              }))}
              onLocationUpdate={handleLocationUpdate}
            />
          </div>

          {/* Current Stop Info */}
          {currentStop && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-orange-100 text-[#F47C20] rounded-2xl flex items-center justify-center">
                  <MapPin className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Next Stop</p>
                  <h3 className="text-xl font-bold text-gray-900">{currentStop.stop_name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 text-xs font-bold text-blue-600">
                      <Navigation className="w-3 h-3" /> {distance ? distance.toFixed(1) + 'km' : '--'}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-[#F47C20]">
                      <Clock className="w-3 h-3" /> {eta ? eta + ' min' : '--'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleArriveAtStop(currentStop.id)}
                className="w-full md:w-auto px-8 py-4 bg-[#F47C20] text-white font-black rounded-2xl shadow-lg shadow-orange-100 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
              >
                {currentStopIdx === stops.length - 1 ? 'Complete Trip' : 'Arrived at Stop'}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Stops List */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <Navigation className="w-5 h-5 text-[#2E2D7F]" /> Route Progress
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {stops.map((stop, idx) => {
                  const isCompleted = idx < currentStopIdx;
                  const isCurrent = idx === currentStopIdx;
                  return (
                    <div
                      key={idx}
                      className={`relative pl-8 pb-4 last:pb-0 ${isCompleted ? 'opacity-50' : ''}`}
                    >
                      {/* Timeline Line */}
                      {idx !== stops.length - 1 && (
                        <div className={`absolute left-[11px] top-6 bottom-0 w-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-100'}`} />
                      )}
                      {/* Timeline Dot */}
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 flex items-center justify-center z-10 ${isCompleted ? 'bg-green-500 border-green-100' :
                        isCurrent ? 'bg-[#F47C20] border-orange-100 animate-pulse' : 'bg-white border-gray-100'
                        }`}>
                        {isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>

                      <div className={`p-4 rounded-2xl border transition-all ${isCurrent ? 'bg-orange-50 border-orange-100 shadow-sm' : 'bg-white border-gray-50'
                        }`}>
                        <h4 className={`font-bold text-sm ${isCurrent ? 'text-orange-900' : 'text-gray-700'}`}>
                          {stop.stop_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-400 uppercase">
                            {stop.studentCount || 0} Assigned | <span className="text-green-600">{stop.comingCount || 0} Coming</span> | <span className="text-red-500">{stop.notComingCount || 0} Not Coming</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverTrip;
