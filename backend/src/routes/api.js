import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { contestsRouter } from './contests.js';
import { adminRouter } from './admin.js';
import { voteRouter } from './vote.js';
import { sessionRouter } from './session.js';
import { socialRouter } from './social.js';
import { integrationsRouter } from './integrations.js';
import { authRouter } from './auth.js';

export const router = Router();

const limiter = rateLimit({ windowMs: 60_000, max: 300 });
router.use(limiter);

router.use('/public', contestsRouter);
router.use('/admin', adminRouter);
router.use('/vote', voteRouter);
router.use('/session', sessionRouter);
router.use('/social-login', socialRouter);
router.use('/', authRouter);
router.use('/', integrationsRouter);
