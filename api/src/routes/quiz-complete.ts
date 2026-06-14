import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { supabase } from '../lib/supabase';
import { generateTravelPersonality } from '../lib/deepseek';

const router = Router();

const quizCompleteSchema = z.object({
  email: z.string().email().optional(),
  user_id: z.string().uuid().optional(),
  travel_style_tags: z.array(z.string()),
  interests: z.array(z.string()),
  trip_pace: z.enum(['relaxed', 'moderate', 'packed']),
  accommodation_preference: z.enum(['budget', 'boutique', 'luxury']),
});

router.post('/quiz-complete', async (req: Request, res: Response) => {
  try {
    const body = quizCompleteSchema.parse(req.body);
    const token = crypto.randomBytes(32).toString('hex');

    // If user_id provided, user completed quiz while logged in
    if (body.user_id) {
      const { error: profileError } = await supabase
        .from('travel_profiles')
        .upsert({
          user_id: body.user_id,
          travel_style_tags: body.travel_style_tags,
          interests: body.interests,
          trip_pace: body.trip_pace,
          preferred_accommodation: body.accommodation_preference,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Failed to save profile:', profileError);
      }

      await supabase
        .from('users')
        .update({ quiz_completed: true })
        .eq('id', body.user_id);
    }

    // Save as quiz lead
    const { error: leadError } = await supabase.from('quiz_leads').insert({
      email: body.email || '',
      quiz_data: {
        travel_style_tags: body.travel_style_tags,
        interests: body.interests,
        trip_pace: body.trip_pace,
        accommodation_preference: body.accommodation_preference,
      },
      completed_at: new Date().toISOString(),
      converted_to_user: !!body.user_id,
    });

    if (leadError) {
      console.error('Failed to save quiz lead:', leadError);
    }

    res.json({
      success: true,
      token,
      deep_link: `travelvault://quiz-complete?token=${token}`,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: err.errors });
      return;
    }
    console.error('Quiz complete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
