import Constants from 'expo-constants';
import { supabase } from './supabase';

const API_BASE = Constants.expoConfig?.extra?.API_URL || 'http://localhost:3000';

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: session } = await supabase.auth.getSession();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (session?.session?.access_token) {
    headers['Authorization'] = `Bearer ${session.session.access_token}`;
  }
  return headers;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> || {}) },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Trips
  getTrips: () => request<{ trips: any[] }>('/api/trips'),
  getTrip: (id: string) => request<{ trip: any; bookings: any[]; guide: any }>(`/api/trips/${id}`),
  createTrip: (data: any) => request<{ trip: any }>('/api/trips', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteTrip: (id: string) => request<{ success: boolean }>(`/api/trips/${id}`, {
    method: 'DELETE',
  }),

  // Travel Profile
  getProfile: () => request<{ profile: any; recent_ratings: any[] }>('/api/travel-profile'),
  updateProfile: (data: any) => request<{ profile: any; personality: string }>('/api/travel-profile/update', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Destination Guide
  generateGuide: (tripId: string) => request<{ guide: any }>(`/api/generate-destination-guide/${tripId}`, {
    method: 'POST',
  }),

  // Flight Status
  getFlightStatus: (flightNumber: string, date: string) =>
    request<any>(`/api/flight-status/${flightNumber}/${date}`),

  // Documents
  getDocuments: () => request<{ documents: any[] }>('/api/documents'),
  uploadDocument: (data: any) => request<{ document: any }>('/api/documents/upload', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteDocument: (id: string) => request<{ success: boolean }>(`/api/documents/${id}`, {
    method: 'DELETE',
  }),

  // Quiz complete (no auth needed)
  quizComplete: (data: any) => request<{ success: boolean; token: string; deep_link: string }>('/api/quiz-complete', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
