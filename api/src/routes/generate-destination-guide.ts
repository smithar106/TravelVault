import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { generateDestinationGuide } from '../lib/deepseek';

const router = Router();

router.post('/generate-destination-guide/:trip_id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { trip_id } = req.params;

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', trip_id)
      .eq('user_id', req.userId!)
      .single();

    if (tripError || !trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    const { data: profile } = await supabase
      .from('travel_profiles')
      .select('*')
      .eq('user_id', req.userId!)
      .single();

    const dates = `${trip.departure_date} to ${trip.return_date}`;
    const guideData = await generateDestinationGuide(
      trip.destination_city,
      trip.destination_country,
      dates,
      {
        travel_style_tags: profile?.travel_style_tags || [],
        preferred_accommodation: profile?.preferred_accommodation || 'boutique',
        trip_pace: profile?.trip_pace || 'moderate',
        interests: profile?.interests || [],
      }
    );

    // Upsert guide
    await supabase
      .from('destination_guides')
      .upsert({
        trip_id,
        city: trip.destination_city,
        country: trip.destination_country,
        neighborhood_tips: {
          restaurants: guideData.restaurants,
          hidden_gems: guideData.hidden_gems,
          avoid: guideData.avoid,
          safety: guideData.safety,
        },
        packing_list: {
          items: guideData.packing_list,
        },
        practical_info: {
          currency: guideData.currency,
          tipping: guideData.tipping,
          transit: guideData.transit,
          plug_adapter: guideData.plug_adapter,
          language_tips: guideData.language_tips,
        },
        weather_summary: guideData.weather_summary,
        generated_at: new Date().toISOString(),
      });

    res.json({ guide: guideData });
  } catch (err) {
    console.error('Generate guide error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
