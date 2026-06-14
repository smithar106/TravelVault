import { Router, Request, Response } from 'express';
import { getFlightStatus } from '../lib/aviationstack';

const router = Router();

router.get('/flight-status/:flight_number/:date', async (req: Request, res: Response) => {
  try {
    const { flight_number, date } = req.params;

    if (!flight_number || !date) {
      res.status(400).json({ error: 'Flight number and date are required' });
      return;
    }

    const status = await getFlightStatus(flight_number, date);

    if (!status) {
      res.status(404).json({ error: 'Flight not found' });
      return;
    }

    res.json({
      status: status.flight_status,
      airline: status.airline,
      flight: status.flight,
      departure: {
        airport: status.departure.airport,
        terminal: status.departure.terminal,
        gate: status.departure.gate,
        scheduled: status.departure.scheduled,
        estimated: status.departure.estimated,
        actual: status.departure.actual,
        delay: status.departure.delay,
      },
      arrival: {
        airport: status.arrival.airport,
        terminal: status.arrival.terminal,
        gate: status.arrival.gate,
        scheduled: status.arrival.scheduled,
        estimated: status.arrival.estimated,
        actual: status.arrival.actual,
      },
    });
  } catch (err) {
    console.error('Flight status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
