import { Router, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { generateTravelPersonality } from '../lib/deepseek';

const router = Router();

const updateSchema = z.object({
  travel_style_tags: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  trip_pace: z.enum(['relaxed', 'moderate', 'packed']).optional(),
  preferred_accommodation: z.enum(['budget', 'boutique', 'luxury']).optional(),
});

// GET travel profile
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: profile } = await supabase
      .from('travel_profiles')
      .select('*')
      .eq('user_id', req.userId!)
      .single();

    const { data: ratings } = await supabase
      .from('trip_ratings')
      .select('*')
      .eq('user_id', req.userId!)
      .order('rated_at', { ascending: false })
      .limit(5);

    res.json({ profile: profile || null, recent_ratings: ratings || [] });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST update travel profile
router.post('/update', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = updateSchema.parse(req.body);

    const { data, error } = await supabase
      .from('travel_profiles')
      .upsert({
        user_id: req.userId!,
        ...body,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Generate personality paragraph
    let personality = '';
    if (data) {
      try {
        personality = await generateTravelPersonality({
          travel_style_tags: data.travel_style_tags,
          trip_pace: data.trip_pace,
          interests: data.interests,
          preferred_accommodation: data.preferred_accommodation,
          total_trips: data.total_trips,
          countries_visited: data.countries_visited,
        });
      } catch (aiErr) {
        console.error('Failed to generate personality:', aiErr);
      }
    }

    res.json({ profile: data, personality });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: err.errors });
      return;
    }
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
