import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { parseBookingEmail } from '../lib/deepseek';

const router = Router();

interface PostmarkInboundBody {
  From: string;
  FromFull: { Email: string; Name: string };
  To: string;
  ToFull: Array<{ Email: string; Name: string }>;
  Subject: string;
  TextBody: string;
  HtmlBody: string;
  Date: string;
  MessageID: string;
  StrippedTextReply: string;
  Headers: Array<{ Name: string; Value: string }>;
}

router.post('/postmark-inbound', async (req: Request, res: Response) => {
  // Respond 200 immediately so Postmark doesn't retry
  res.status(200).json({ status: 'received' });

  try {
    const body = req.body as PostmarkInboundBody;
    const toAddresses = body.ToFull.map((t) => t.Email);

    // Find user by travelvault_email in TO field
    const { data: user } = await supabase
      .from('users')
      .select('id, travelvault_email')
      .in('travelvault_email', toAddresses)
      .single();

    if (!user) {
      console.log('No user found for addresses:', toAddresses);
      return;
    }

    // Check subscription limits
    const { count: tripCount } = await supabase
      .from('trips')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { data: userData } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    const isFree = userData?.subscription_status === 'free';
    if (isFree && tripCount && tripCount >= 1) {
      console.log(`Free user ${user.id} has reached trip limit`);
      return;
    }

    // Parse email with DeepSeek
    const emailText = body.StrippedTextReply || body.TextBody;
    let parsedData: Record<string, unknown>;

    try {
      parsedData = await parseBookingEmail(emailText);
    } catch (parseErr) {
      console.error('Failed to parse email:', parseErr);
      return;
    }

    const bookingType = (parsedData.booking_type as string) || 'other';
    const destCity = (parsedData.destination_city as string) || 'Unknown';
    const destCountry = (parsedData.destination_country as string) || 'Unknown';
    const startsAt = (parsedData.starts_at as string) || new Date().toISOString();
    const endsAt = (parsedData.ends_at as string) || new Date().toISOString();

    // Find or create matching trip
    const tripStart = new Date(startsAt);
    const tripEnd = new Date(endsAt);
    const tripName = `Trip to ${destCity}`;

    const { data: existingTrips } = await supabase
      .from('trips')
      .select('id')
      .eq('user_id', user.id)
      .eq('destination_city', destCity)
      .gte('departure_date', tripStart.toISOString().split('T')[0])
      .lte('return_date', new Date(tripEnd.getTime() + 86400000 * 7).toISOString().split('T')[0])
      .limit(1);

    let tripId: string;

    if (existingTrips && existingTrips.length > 0) {
      tripId = existingTrips[0].id;

      // Update trip dates to encompass new booking
      await supabase
        .from('trips')
        .update({
          departure_date: new Date(
            Math.min(tripStart.getTime(), new Date(existingTrips[0] ? '' : startsAt).getTime())
          )
            .toISOString()
            .split('T')[0],
          return_date: tripEnd.toISOString().split('T')[0],
        })
        .eq('id', tripId);
    } else {
      const { data: newTrip, error: tripError } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          name: tripName,
          destination_city: destCity,
          destination_country: destCountry,
          departure_date: tripStart.toISOString().split('T')[0],
          return_date: tripEnd.toISOString().split('T')[0],
          status: 'upcoming',
        })
        .select('id')
        .single();

      if (tripError || !newTrip) {
        console.error('Failed to create trip:', tripError);
        return;
      }

      tripId = newTrip.id;
    }

    // Create booking
    const { error: bookingError } = await supabase.from('bookings').insert({
      trip_id: tripId,
      user_id: user.id,
      booking_type: bookingType as 'flight' | 'hotel' | 'car' | 'activity' | 'other',
      raw_email: emailText,
      parsed_data: parsedData,
      confirmation_number: (parsedData.confirmation_number as string) || '',
      provider_name: (parsedData.provider_name as string) || 'Unknown',
      starts_at: startsAt,
      ends_at: endsAt,
      location: (parsedData.location_address as string) || null,
      status: 'confirmed',
    });

    if (bookingError) {
      console.error('Failed to save booking:', bookingError);
      return;
    }

    // Update travel profile stats
    const { data: profile } = await supabase
      .from('travel_profiles')
      .select('countries_visited, total_trips')
      .eq('user_id', user.id)
      .single();

    const updatedCountries = [...(profile?.countries_visited || [])];
    if (!updatedCountries.includes(destCountry)) {
      updatedCountries.push(destCountry);
    }

    await supabase
      .from('travel_profiles')
      .upsert({
        user_id: user.id,
        total_trips: (profile?.total_trips || 0) + 1,
        countries_visited: updatedCountries,
        updated_at: new Date().toISOString(),
      });

    // Trigger async guide generation
    generateGuideInBackground(tripId, destCity, destCountry, user.id);
  } catch (err) {
    console.error('Postmark inbound error:', err);
  }
});

async function generateGuideInBackground(
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

    if (!profile) return;

    // Check if guide already exists
    const { data: existingGuide } = await supabase
      .from('destination_guides')
      .select('id')
      .eq('trip_id', tripId)
      .single();

    if (existingGuide) return;

    // Import dynamically to avoid issues
    const { generateDestinationGuide } = await import('../lib/deepseek');
    const guideData = await generateDestinationGuide(city, country, 'upcoming trip', {
      travel_style_tags: profile.travel_style_tags,
      preferred_accommodation: profile.preferred_accommodation,
      trip_pace: profile.trip_pace,
      interests: profile.interests,
    });

    await supabase.from('destination_guides').insert({
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

    console.log(`Guide generated for trip ${tripId}`);
  } catch (err) {
    console.error('Guide generation failed:', err);
  }
}

export default router;
