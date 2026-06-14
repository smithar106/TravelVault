import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface Trip {
  id: string;
  user_id: string;
  name: string;
  destination_city: string;
  destination_country: string;
  departure_date: string;
  return_date: string;
  status: 'upcoming' | 'active' | 'completed';
  cover_image_url: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  trip_id: string;
  booking_type: 'flight' | 'hotel' | 'car' | 'activity' | 'other';
  provider_name: string;
  confirmation_number: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  parsed_data: Record<string, unknown>;
  status: 'confirmed' | 'cancelled';
}

export interface DestinationGuide {
  id: string;
  neighborhood_tips: Record<string, unknown>;
  packing_list: Record<string, unknown>;
  practical_info: Record<string, unknown>;
  weather_summary: string;
}

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTrips();
      setTrips(data.trips || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  return { trips, loading, error, refetch: fetchTrips };
}

export function useTripDetail(tripId: string | undefined) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [guide, setGuide] = useState<DestinationGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [guideLoading, setGuideLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrip = useCallback(async () => {
    if (!tripId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTrip(tripId);
      setTrip(data.trip);
      setBookings(data.bookings || []);
      setGuide(data.guide);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  const generateGuide = useCallback(async () => {
    if (!tripId) return;
    try {
      setGuideLoading(true);
      const data = await api.generateGuide(tripId);
      setGuide(data.guide);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGuideLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  return {
    trip,
    bookings,
    guide,
    loading,
    guideLoading,
    error,
    refetch: fetchTrip,
    generateGuide,
  };
}
