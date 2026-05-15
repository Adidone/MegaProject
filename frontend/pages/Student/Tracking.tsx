import React, { useEffect, useState } from 'react';
import { RefreshCw, MapPin, Clock, Navigation } from 'lucide-react';
import { User } from '../../types';
import LiveTrackingMap from '../../components/LiveTrackingMap';
import { apiRequest } from '../../api';

const StudentTracking: React.FC<{ user: User }> = ({ user }) => {
  const [stops, setStops] = useState<any[]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRouteData = async () => {
    setLoading(true);
    try {
      // Find the route ID for the student's assigned route
      const routesRes = await apiRequest<{ success: boolean; data: any[] }>('/admin/routes');
      const studentRoute = routesRes.data.find(r => r.name === user.assignedRoute);

      if (studentRoute) {
        const stopsRes = await apiRequest<{ success: boolean; data: { stops: any[]; completed_stops: any[] } }>(`/student/route-stops/${studentRoute.id}`);
        setStops(stopsRes.data?.stops || []);
      }
    } catch (e) {
      console.error("Failed to load tracking data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRouteData();
  }, [user.assignedRoute]);

  const calculateStraightDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleLocationUpdate = (busLat: number, busLng: number) => {
    // Find student's stop coordinates
    const myStop = stops.find(s => s.name === user.pickupStop);
    if (myStop) {
      const dist = calculateStraightDistance(busLat, busLng, myStop.latitude, myStop.longitude);
      setDistance(dist);
      setEta(Math.max(1, Math.round((dist / 30) * 60))); // Simple 30km/h average
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Live Bus Tracking</h2>
          <p className="text-sm text-gray-500">Real-time location of your assigned bus.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Distance</p>
                <p className="text-sm font-bold text-gray-900">{distance ? distance.toFixed(2) + ' km' : '--'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F47C20]" />
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">ETA</p>
                <p className="text-sm font-bold text-gray-900">{eta ? eta + ' mins' : '--'}</p>
              </div>
            </div>
          </div>
          <button
            onClick={loadRouteData}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[500px] bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden relative">
        {!user.assignedRoute ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No Route Assigned</h3>
            <p className="text-sm text-gray-500 max-w-xs mt-2">
              You haven't been assigned to a bus route yet. Contact the administrator for assignment.
            </p>
          </div>
        ) : (
          <LiveTrackingMap
            role="student"
            userId={user.id}
            stops={stops.map(s => ({
              latitude: Number(s.latitude),
              longitude: Number(s.longitude),
              name: s.name
            }))}
            studentStop={stops.find(s => s.name === user.pickupStop) ? {
              latitude: Number(stops.find(s => s.name === user.pickupStop).latitude),
              longitude: Number(stops.find(s => s.name === user.pickupStop).longitude),
              name: user.pickupStop || 'Your Stop'
            } : undefined}
            onLocationUpdate={handleLocationUpdate}
            distance={distance}
            eta={eta}
          />
        )}
      </div>
    </div>
  );
};

export default StudentTracking;
