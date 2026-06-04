const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { protect, isAdmin } = require('../middleware/auth');
const { logAudit } = require('../utils/activityLogger');

router.use(protect, isAdmin);

router.get('/users', async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, email: true, name: true, role: true, avatar: true, isBanned: true, isSuspended: true, createdAt: true, lastLogin: true },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
});

router.patch('/users/:id/ban', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.role === 'SUPER_ADMIN') return res.status(403).json({ error: 'Cannot ban Super Admin.' });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isBanned: !user.isBanned },
    });
    await logAudit(req.user.id, updated.isBanned ? 'USER_BANNED' : 'USER_UNBANNED', 'User', req.params.id);
    res.json({ user: updated });
  } catch (err) { next(err); }
});

router.patch('/users/:id/suspend', async (req, res, next) => {
  try {
    const { until } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.role === 'SUPER_ADMIN') return res.status(403).json({ error: 'Cannot suspend Super Admin.' });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isSuspended: !!until, suspendedUntil: until ? new Date(until) : null },
    });
    await logAudit(req.user.id, 'USER_SUSPENDED', 'User', req.params.id, null, { until });
    res.json({ user: updated });
  } catch (err) { next(err); }
});

router.get('/activity', async (req, res, next) => {
  try {
    const { userId, action, page = 1, limit = 50 } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({ logs, total });
  } catch (err) { next(err); }
});

router.get('/audit', async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ logs });
  } catch (err) { next(err); }
});

module.exports = router;
