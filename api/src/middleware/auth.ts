import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.userId = data.user.id;
  next();
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header) {
    next();
    return;
  }

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  const { data } = await supabase.auth.getUser(token);
  if (data.user) {
    req.userId = data.user.id;
  }
  next();
}
