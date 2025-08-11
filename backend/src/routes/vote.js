import { Router } from 'express';
import { db } from '../services/db.js';
import { emitVoteUpdate } from '../index.js';
import rateLimit from 'express-rate-limit';

export const voteRouter = Router();
const voteLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false });

// POST /api/vote
voteRouter.post('/', voteLimiter, async (req, res) => {
  // Accept both camelCase and snake_case to stay compatible with legacy PHP client
  let { contestantId, contestId, dryRun } = req.body || {};
  const scContestantId = req.body?.contestant_id ?? req.query?.contestant_id;
  const scContestId = req.body?.contest_id ?? req.query?.contest_id;
  if (!contestantId && scContestantId) contestantId = scContestantId;
  if (!contestId && scContestId) contestId = scContestId;

  // If contestId is still missing, try to infer from DB by contestantId
  if (!contestId && contestantId) {
    try {
      const c = await db.getContestantById(contestantId);
      if (c?.contest_id) contestId = c.contest_id;
    } catch {}
  }

  if (!contestantId || !contestId) return res.status(400).json({ success: false, message: 'missing_params' });

  if (dryRun === true || String(dryRun).toLowerCase() === 'true') {
    const current = await db.getContestantById(contestantId);
    const previewVotes = (current?.total_votes || 0) + 1;
    return res.json({ success: true, message: 'DRY_RUN', data: { ...current, total_votes: previewVotes } });
  }

  const updated = await db.votesAdd(contestantId, contestId);

  emitVoteUpdate(contestId, { contestantId, totalVotes: updated.total_votes, contestId });
  res.json({ success: true, message: 'Vote recorded', data: updated });
});
