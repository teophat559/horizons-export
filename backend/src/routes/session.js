import { Router } from 'express';
import { getUserFromRequest } from '../services/auth.js';

export const sessionRouter = Router();

// GET /api/session
sessionRouter.get('/', (req, res) => {
  const user = getUserFromRequest(req);
  res.json({ success: true, data: { user, isAuthenticated: !!user } });
});
