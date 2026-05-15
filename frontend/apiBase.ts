export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL?.toString?.() ||
  (import.meta as any).env?.VITE_BACKEND_URL?.toString?.() ||
  'http://localhost:5555';

