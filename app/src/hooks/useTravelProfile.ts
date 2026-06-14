import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface TravelProfile {
  id: string;
  user_id: string;
  travel_style_tags: string[];
  preferred_accommodation: 'budget' | 'boutique' | 'luxury';
  trip_pace: 'relaxed' | 'moderate' | 'packed';
  interests: string[];
  total_trips: number;
  countries_visited: string[];
  updated_at: string;
}

export interface TripRating {
  id: string;
  trip_id: string;
  overall_rating: number;
  style_tags_confirmed: string[];
  notes: string | null;
  rated_at: string;
}

export function useTravelProfile() {
  const [profile, setProfile] = useState<TravelProfile | null>(null);
  const [recentRatings, setRecentRatings] = useState<TripRating[]>([]);
  const [personality, setPersonality] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProfile();
      setProfile(data.profile);
      setRecentRatings(data.recent_ratings || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<TravelProfile>) => {
    try {
      const result = await api.updateProfile(data);
      setProfile(result.profile);
      if (result.personality) {
        setPersonality(result.personality);
      }
      return result;
    } catch (err: any) {
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, recentRatings, personality, loading, error, refetch: fetchProfile, updateProfile };
}
