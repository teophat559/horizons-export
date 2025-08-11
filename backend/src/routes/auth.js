import { Router } from 'express';
import { AuthConfig, setSessionCookie, clearSessionCookie } from '../services/auth.js';

export const authRouter = Router();

// POST /api/login
authRouter.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const u = AuthConfig.adminUser;
  if (username === u.username && password === u.password) {
    setSessionCookie(res, u);
    return res.json({ success: true, message: 'logged_in', data: { user: { id: u.id, name: u.name, role: u.role } } });
  }
  res.status(401).json({ success: false, message: 'invalid_credentials' });
});

// POST /api/logout
authRouter.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ success: true, message: 'logged_out' });
});
