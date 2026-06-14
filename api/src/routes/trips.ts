import { Router, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all trips for user
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', req.userId!)
      .order('departure_date', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ trips: data });
  } catch (err) {
    console.error('Get trips error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single trip with bookings
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId!)
      .single();

    if (tripError || !trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('trip_id', req.params.id)
      .order('starts_at', { ascending: true });

    const { data: guide } = await supabase
      .from('destination_guides')
      .select('*')
      .eq('trip_id', req.params.id)
      .single();

    res.json({ trip, bookings: bookings || [], guide });
  } catch (err) {
    console.error('Get trip error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create manual trip
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      destination_city: z.string().min(1),
      destination_country: z.string().min(1),
      departure_date: z.string(),
      return_date: z.string(),
    });

    const body = schema.parse(req.body);

    const { data, error } = await supabase
      .from('trips')
      .insert({
        user_id: req.userId!,
        name: body.name,
        destination_city: body.destination_city,
        destination_country: body.destination_country,
        departure_date: body.departure_date,
        return_date: body.return_date,
        status: 'upcoming',
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ trip: data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: err.errors });
      return;
    }
    console.error('Create trip error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE trip
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId!);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete trip error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
