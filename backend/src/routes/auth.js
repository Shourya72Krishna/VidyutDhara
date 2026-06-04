const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/prisma');
const { createSession, sendTokenCookie } = require('../utils/jwt');
const { protect } = require('../middleware/auth');
const { logActivity, logAudit } = require('../utils/activityLogger');
const crypto = require('crypto');

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name, password: hashed, role: 'USER' },
    });

    const { token } = await createSession(user.id, req);
    sendTokenCookie(res, token);
    await logActivity(user.id, 'REGISTER');

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
    });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials.' });
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials.' });

    if (user.isBanned) return res.status(403).json({ error: 'Account banned.' });
    if (user.isSuspended && user.suspendedUntil > new Date()) {
      return res.status(403).json({ error: `Account suspended until ${user.suspendedUntil.toISOString()}` });
    }

    const { token } = await createSession(user.id, req);
    sendTokenCookie(res, token);
    await logActivity(user.id, 'LOGIN', null, null, { ip: req.ip });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
    });
  } catch (err) { next(err); }
});

// POST /api/auth/logout
router.post('/logout', protect, async (req, res, next) => {
  try {
    await prisma.session.update({
      where: { token: req.token },
      data: { isActive: false, logoutTime: new Date() },
    });
    await logActivity(req.user.id, 'LOGOUT');
    res.clearCookie('jwt');
    res.json({ message: 'Logged out successfully.' });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, role: true, avatar: true, createdAt: true, lastLogin: true },
  });
  res.json({ user });
});

// GET /api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

// GET /api/auth/google/callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed` }),
  async (req, res, next) => {
    try {
      const { token } = await createSession(req.user.id, req);
      await logActivity(req.user.id, 'LOGIN_GOOGLE');
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (err) { next(err); }
  }
);

// POST /api/auth/forgot-password
router.post('/forgot-password', [body('email').isEmail().normalizeEmail()], async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    // Always respond OK to prevent enumeration
    if (!user) return res.json({ message: 'If that email exists, a reset link was sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({ data: { userId: user.id, token, expiresAt } });

    // In production, send email here
    // For now, return token in development
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    console.log(`Password reset URL: ${resetUrl}`);

    res.json({ message: 'If that email exists, a reset link was sent.', ...(process.env.NODE_ENV === 'development' && { resetUrl }) });
  } catch (err) { next(err); }
});

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }),
], async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const reset = await prisma.passwordReset.findUnique({ where: { token } });

    if (!reset || reset.used || reset.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: reset.userId }, data: { password: hashed } });
    await prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } });

    res.json({ message: 'Password reset successfully.' });
  } catch (err) { next(err); }
});

module.exports = router;
