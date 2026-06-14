import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';

export interface FlightStatusData {
  status: string;
  airline: { name: string; iata: string };
  flight: { number: string; iata: string };
  departure: {
    airport: string;
    terminal: string;
    gate: string;
    scheduled: string;
    estimated: string;
    actual: string | null;
    delay: number | null;
  };
  arrival: {
    airport: string;
    terminal: string;
    gate: string;
    scheduled: string;
    estimated: string;
    actual: string | null;
  };
}

export function useFlightStatus(flightNumber: string | undefined, date: string | undefined) {
  const [status, setStatus] = useState<FlightStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!flightNumber || !date) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getFlightStatus(flightNumber, date);
      setStatus(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [flightNumber, date]);

  useEffect(() => {
    if (flightNumber && date) {
      fetchStatus();
      // Poll every 10 minutes
      intervalRef.current = setInterval(fetchStatus, 10 * 60 * 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [flightNumber, date, fetchStatus]);

  return { status, loading, error, refetch: fetchStatus };
}
