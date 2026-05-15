
export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT',
  DRIVER = 'DRIVER'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  assignedBus?: string;
  assignedRoute?: string;
  pickupStop?: string;
  status?: 'Active' | 'Inactive' | 'On Trip' | 'On Leave';
}

export interface Student extends User {
  studentId: string;
  contactNumber: string;
  parentContact?: string;
  joinDate: string;
  morningRouteId?: string;
  eveningRouteId?: string;
  morningRouteName?: string;
  eveningRouteName?: string;
  address?: string;
}

export interface Driver extends User {
  liscence_no: string;
  phone: string;
  experience: string;
  joinDate: string;
  rating: number;
  assignedBusId?: string;
  assignedBus?: string;
  assignedRoute?: string;
  address?: string;
}

export interface Bus {
  id: string;
  number: string;
  capacity: number;
  occupancy: number;
  status: 'Available' | 'Trip' | 'Maintenance';
  driverId: string;
  routeId: string;
  lastLocation?: { lat: number; lng: number };
}

export interface Route {
  id: string;
  name: string;
  stops: string[];
  active: boolean;
}

export interface TripSchedule {
  id: string;
  busId: string;
  routeId: string;
  time: string;
  type: 'Pickup' | 'Drop';
  status: 'Scheduled' | 'Delayed' | 'Cancelled' | 'Active';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'alert';
  category: 'Delay' | 'Route Change' | 'Holiday' | 'Maintenance' | 'General';
  target: 'All' | 'Specific Route' | 'Specific Bus' | 'Drivers Only';
  targetId?: string;
  status: 'Sent' | 'Scheduled';
}
