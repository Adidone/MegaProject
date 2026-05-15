
import { Bus, Route, UserRole, Student, Driver } from './types';

export const MOCK_BUSES: Bus[] = [
  { id: '1', number: 'KA-01-F-1234', capacity: 50, occupancy: 32, status: 'Trip', driverId: 'd1', routeId: 'r1' },
  { id: '2', number: 'KA-01-F-5678', capacity: 40, occupancy: 40, status: 'Trip', driverId: 'd2', routeId: 'r2' },
  { id: '3', number: 'KA-01-F-9012', capacity: 60, occupancy: 0, status: 'Available', driverId: 'd3', routeId: 'r1' },
  { id: '4', number: 'KA-01-F-3456', capacity: 50, occupancy: 0, status: 'Maintenance', driverId: 'd4', routeId: 'r3' },
];

export const MOCK_ROUTES: Route[] = [
  { id: 'r1', name: 'Downtown to Campus', stops: ['Market St', 'Grand Central', 'West End', 'College Gate'], active: true },
  { id: 'r2', name: 'North Suburbs', stops: ['Oak Park', 'Riverside', 'Station Square', 'College Gate'], active: true },
  { id: 'r3', name: 'East Side Line', stops: ['Industrial Area', 'Tech Park', 'East Mall', 'College Gate'], active: false },
];

export const MOCK_STUDENTS: Student[] = [
  { 
    id: 's1', 
    studentId: 'KIT2023001', 
    name: 'Alice Johnson', 
    email: 'alice@kit.edu', 
    role: UserRole.STUDENT, 
    assignedBus: 'KA-01-F-1234', 
    assignedRoute: 'r1', 
    pickupStop: 'Grand Central', 
    status: 'Active',
    contactNumber: '9876543210',
    joinDate: '2023-08-15'
  },
  { 
    id: 's2', 
    studentId: 'KIT2023005', 
    name: 'Bob Smith', 
    email: 'bob@kit.edu', 
    role: UserRole.STUDENT, 
    assignedBus: 'KA-01-F-5678', 
    assignedRoute: 'r2', 
    pickupStop: 'Riverside', 
    status: 'Active',
    contactNumber: '9876543211',
    joinDate: '2023-08-16'
  },
  { 
    id: 's3', 
    studentId: 'KIT2023012', 
    name: 'Charlie Davis', 
    email: 'charlie@kit.edu', 
    role: UserRole.STUDENT, 
    assignedBus: 'KA-01-F-1234', 
    assignedRoute: 'r1', 
    pickupStop: 'West End', 
    status: 'Inactive',
    contactNumber: '9876543212',
    joinDate: '2023-08-17'
  },
];

export const MOCK_DRIVERS: Driver[] = [
  {
    id: 'd1',
    name: 'Ravi Shankar',
    email: 'ravi@kit.edu',
    role: UserRole.DRIVER,
    licenseNumber: 'DL-543219876',
    phone: '+91 98765 00001',
    experience: '8 Years',
    joinDate: '2021-05-10',
    rating: 4.8,
    status: 'On Trip',
    assignedBusId: '1'
  },
  {
    id: 'd2',
    name: 'Mohan Kumar',
    email: 'mohan@kit.edu',
    role: UserRole.DRIVER,
    licenseNumber: 'DL-987654321',
    phone: '+91 98765 00002',
    experience: '5 Years',
    joinDate: '2022-02-14',
    rating: 4.5,
    status: 'Active',
    assignedBusId: '2'
  },
  {
    id: 'd3',
    name: 'Suresh Raina',
    email: 'suresh@kit.edu',
    role: UserRole.DRIVER,
    licenseNumber: 'DL-112233445',
    phone: '+91 98765 00003',
    experience: '12 Years',
    joinDate: '2019-11-20',
    rating: 4.9,
    status: 'On Leave',
    assignedBusId: '3'
  }
];

export const ROLE_CONFIG = {
  [UserRole.ADMIN]: {
    color: '#2E2D7F',
    label: 'Administrator'
  },
  [UserRole.STUDENT]: {
    color: '#F47C20',
    label: 'Student'
  },
  [UserRole.DRIVER]: {
    color: '#10B981',
    label: 'Driver'
  }
};
