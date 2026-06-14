// Background job runner for async tasks
// Called from postmark-inbound route after saving booking
import { supabase } from '../lib/supabase';
import { generateDestinationGuide } from '../lib/deepseek';

export async function generateGuideForTrip(
  tripId: string,
  city: string,
  country: string,
  userId: string
): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from('travel_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: trip } = await supabase
      .from('trips')
      .select('departure_date, return_date')
      .eq('id', tripId)
      .single();

    const dates = trip
      ? `${trip.departure_date} to ${trip.return_date}`
      : 'upcoming trip';

    const guideData = await generateDestinationGuide(city, country, dates, {
      travel_style_tags: profile?.travel_style_tags || [],
      preferred_accommodation: profile?.preferred_accommodation || 'boutique',
      trip_pace: profile?.trip_pace || 'moderate',
      interests: profile?.interests || [],
    });

    const { error } = await supabase.from('destination_guides').upsert({
      trip_id: tripId,
      city,
      country,
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

    if (error) {
      console.error('Failed to save guide:', error);
    }
  } catch (err) {
    console.error('Background guide generation failed:', err);
  }
}
