import { Router } from 'express';
import { db } from '../services/db.js';

export const contestsRouter = Router();

// GET /api/public/contests
contestsRouter.get('/contests', async (req, res) => {
  const rows = await db.listContests();
  res.json({ success: true, data: rows });
});

// GET /api/public/contestants
contestsRouter.get('/contestants', async (req, res) => {
  const rows = await db.listContestants();
  res.json({ success: true, data: rows });
});

// GET /api/public/rankings
contestsRouter.get('/rankings', async (req, res) => {
  const rows = await db.listRankings();
  res.json({ success: true, data: rows });
});
