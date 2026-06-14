import { Router, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all documents for user
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', req.userId!)
      .order('expires_at', { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ documents: data });
  } catch (err) {
    console.error('Get documents error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST upload document
router.post('/upload', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schema = z.object({
      document_type: z.enum(['passport', 'visa', 'insurance', 'vaccine', 'other']),
      name: z.string().min(1),
      file_url: z.string().url(),
      expires_at: z.string().optional(),
    });

    const body = schema.parse(req.body);

    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: req.userId!,
        document_type: body.document_type,
        name: body.name,
        file_url: body.file_url,
        expires_at: body.expires_at || null,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ document: data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request', details: err.errors });
      return;
    }
    console.error('Upload document error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE document
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId!);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete document error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
