const AVIATIONSTACK_URL = 'https://api.aviationstack.com/v1/flights';

export interface FlightStatus {
  flight_date: string;
  flight_status: string;
  departure: {
    airport: string;
    timezone: string;
    terminal: string;
    gate: string;
    scheduled: string;
    estimated: string;
    actual: string | null;
    delay: number | null;
  };
  arrival: {
    airport: string;
    timezone: string;
    terminal: string;
    gate: string;
    scheduled: string;
    estimated: string;
    actual: string | null;
  };
  airline: {
    name: string;
    iata: string;
  };
  flight: {
    number: string;
    iata: string;
  };
}

export async function getFlightStatus(
  flightNumber: string,
  date: string
): Promise<FlightStatus | null> {
  const apiKey = process.env.AVIATIONSTACK_API_KEY;
  if (!apiKey) throw new Error('AVIATIONSTACK_API_KEY not configured');

  const iataCode = flightNumber.match(/^[A-Z]{2}/)?.[0] || '';
  const numericPart = flightNumber.match(/\d+/)?.[0] || '';

  const params = new URLSearchParams({
    access_key: apiKey,
    flight_iata: flightNumber,
    flight_date: date,
    limit: '1',
  });

  const response = await fetch(`${AVIATIONSTACK_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`AviationStack API error ${response.status}`);
  }

  const data = (await response.json()) as {
    data: FlightStatus[];
    pagination: { count: number };
  };

  if (!data.data || data.data.length === 0) return null;
  return data.data[0];
}
