import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../apiBase';

// Fix for default marker icons in Leaflet with React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Location {
    latitude: number;
    longitude: number;
}

interface Stop extends Location {
    id?: string | number;
    name: string;
    coming_today?: number;
    is_completed?: boolean;
}

interface LiveTrackingMapProps {
    role: 'student' | 'driver';
    userId: string;
    stops: Stop[];
    studentStop?: Location & { name: string };
    onLocationUpdate?: (lat: number, lng: number) => void;
    distance?: number | null;
    eta?: number | null;
}

const BusIcon = L.divIcon({
    className: 'bus-marker-icon',
    html: `<div style="
        width: 20px; height: 20px; 
        background: #ff4757; 
        border: 3px solid white; 
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(255,71,87,0.5);
        animation: pulse-red 2s infinite;
    "></div>
    <style>
        @keyframes pulse-red {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
        }
    </style>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const StudentStopIcon = L.divIcon({
    className: 'student-stop-icon',
    html: `<div style="
        width: 30px; height: 30px; 
        background: #2E2D7F; 
        color: white;
        border: 3px solid #fff; 
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    ">S</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const MapRecenter: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center[0] !== 0) {
            map.setView(center, zoom || map.getZoom());
            // Fix for map tiles not loading correctly in some containers
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }
    }, [center, zoom, map]);
    return null;
};

const MapInitializer: React.FC = () => {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 200);
    }, [map]);
    return null;
};

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ role, userId, stops, studentStop, onLocationUpdate, distance, eta }) => {
    const [busLocation, setBusLocation] = useState<[number, number] | null>(null);
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = io(API_BASE_URL.replace(/\/$/, ''));
        socketRef.current = socket;

        if (role === 'student') {
            // Students listen for bus location updates
            socket.on('receive-location', (data: any) => {
                setBusLocation([data.latitude, data.longitude]);
                if (onLocationUpdate) onLocationUpdate(data.latitude, data.longitude);
            });
            // Also listen to location-update from API calls
            socket.on('location-update', (data: any) => {
                setBusLocation([data.latitude, data.longitude]);
                if (onLocationUpdate) onLocationUpdate(data.latitude, data.longitude);
            });
        } else {
            // Drivers emit their location
            if ("geolocation" in navigator) {
                const watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        setBusLocation([latitude, longitude]);
                        socket.emit('send-location', {
                            driver_id: userId,
                            latitude,
                            longitude
                        });
                        if (onLocationUpdate) onLocationUpdate(latitude, longitude);
                    },
                    (error) => console.error("Error watching position:", error),
                    { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
                );
                return () => navigator.geolocation.clearWatch(watchId);
            }
        }

        return () => {
            socket.disconnect();
        };
    }, [role, userId, onLocationUpdate]);

    // Draw route if stops are provided
    useEffect(() => {
        const fetchRoadRoute = async () => {
            if (stops.length < 2) return;

            try {
                // Construct OSRM API URL (Note: coordinates are [lng,lat] for OSRM)
                const coords = stops.map(s => `${s.longitude},${s.latitude}`).join(';');
                // Using a more reliable OSRM mirror if possible, but public one should work
                const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`;

                console.log("Fetching road route from OSRM...");
                const res = await fetch(url);

                if (!res.ok) {
                    throw new Error(`OSRM API returned status ${res.status}`);
                }

                const data = await res.json();

                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                    const geometry = data.routes[0].geometry.coordinates;
                    // OSRM returns [lng, lat], Leaflet needs [lat, lng]
                    const roadCoords: [number, number][] = geometry.map((c: any) => [c[1], c[0]]);
                    setRouteCoords(roadCoords);
                    console.log("Road route successfully loaded.");
                } else {
                    console.warn("OSRM returned no routes, falling back to straight lines.");
                    setRouteCoords(stops.map(s => [s.latitude, s.longitude]));
                }
            } catch (err) {
                console.error("OSRM Route error:", err);
                // Fallback to straight lines if OSRM fails
                setRouteCoords(stops.map(s => [s.latitude, s.longitude]));
            }
        };

        fetchRoadRoute();
    }, [stops]);

    const initialCenter: [number, number] = stops.length > 0
        ? [stops[0].latitude, stops[0].longitude]
        : [16.6545, 74.2618]; // KIT Default

    return (
        <MapContainer
            center={initialCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
        >
            <MapInitializer />
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {routeCoords.length > 1 && (
                <Polyline
                    positions={routeCoords}
                    color="#2E2D7F"
                    weight={6}
                    opacity={0.8}
                    lineJoin="round"
                    lineCap="round"
                />
            )}

            {stops.map((stop, idx) => (
                <Marker key={idx} position={[stop.latitude, stop.longitude]}>
                    <Popup>
                        <div className="text-center">
                            <p className="font-bold">{stop.name}</p>
                            {stop.coming_today !== undefined && (
                                <p className="text-xs text-green-600 font-bold">{stop.coming_today} Coming</p>
                            )}
                            {(stop as any).not_coming_today !== undefined && (
                                <p className="text-xs text-red-500 font-bold">{(stop as any).not_coming_today} Not Coming</p>
                            )}
                        </div>
                    </Popup>
                </Marker>
            ))}

            {studentStop && (
                <Marker position={[studentStop.latitude, studentStop.longitude]} icon={StudentStopIcon}>
                    <Popup><b>Your Stop:</b> {studentStop.name}</Popup>
                </Marker>
            )}

            {busLocation && (
                <>
                    <Marker position={busLocation} icon={BusIcon}>
                        <Popup>Bus Current Location</Popup>
                    </Marker>
                    <MapRecenter center={busLocation} />
                </>
            )}

            {role === 'student' && (
                <div className="absolute top-4 right-4 bg-white p-5 rounded-2xl shadow-xl z-[1000] min-w-[250px] border border-gray-100">
                    <h3 className="m-0 mb-4 text-gray-800 text-lg font-bold border-b-2 border-indigo-500 pb-2 flex items-center gap-2">
                        🚌 Bus Tracking
                    </h3>
                    <div className="mb-3 flex justify-between items-center">
                        <span className="text-gray-500 font-medium text-sm">Distance:</span>
                        <span className="text-indigo-600 font-bold text-base">
                            {distance !== undefined && distance !== null ? distance.toFixed(2) : '--'} km
                        </span>
                    </div>
                    <div className="mb-3 flex justify-between items-center">
                        <span className="text-gray-500 font-medium text-sm">ETA:</span>
                        <span className="text-red-500 font-bold text-base">
                            {eta !== undefined && eta !== null ? eta : '--'} min
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium text-sm">Status:</span>
                        <span className="text-gray-800 font-bold flex items-center">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                            Live
                        </span>
                    </div>
                </div>
            )}
        </MapContainer>
    );
};

export default LiveTrackingMap;
