const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { protect, isSuperAdmin } = require('../middleware/auth');
const { logAudit } = require('../utils/activityLogger');

router.use(protect, isSuperAdmin);

// Create admin
router.post('/admins', async (req, res, next) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) return res.status(400).json({ error: 'Email, name, and password required.' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.role === 'SUPER_ADMIN') return res.status(403).json({ error: 'Cannot modify Super Admin.' });
      const updated = await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
      await logAudit(req.user.id, 'ADMIN_PROMOTED', 'User', updated.id);
      return res.json({ user: updated });
    }

    const hashed = await bcrypt.hash(password, 12);
    const admin = await prisma.user.create({ data: { email, name, password: hashed, role: 'ADMIN' } });
    await logAudit(req.user.id, 'ADMIN_CREATED', 'User', admin.id);
    res.status(201).json({ user: admin });
  } catch (err) { next(err); }
});

// Remove admin (demote to user)
router.delete('/admins/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.role === 'SUPER_ADMIN') return res.status(403).json({ error: 'Cannot demote Super Admin.' });

    const updated = await prisma.user.update({ where: { id: req.params.id }, data: { role: 'USER' } });
    await logAudit(req.user.id, 'ADMIN_DEMOTED', 'User', req.params.id);
    res.json({ user: updated });
  } catch (err) { next(err); }
});

// System analytics overview
router.get('/analytics', async (req, res, next) => {
  try {
    const [users, tasks, goals, habits, notes, sessions, aiInteractions] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.goal.count(),
      prisma.habit.count(),
      prisma.note.count(),
      prisma.session.count({ where: { isActive: true } }),
      prisma.aIInteraction.count(),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [dau, mau, newUsersToday, newUsersMonth] = await Promise.all([
      prisma.session.groupBy({ by: ['userId'], where: { loginTime: { gte: today } }, _count: true }),
      prisma.session.groupBy({ by: ['userId'], where: { loginTime: { gte: monthStart } }, _count: true }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    ]);

    const roleBreakdown = await prisma.user.groupBy({ by: ['role'], _count: true });

    res.json({
      totals: { users, tasks, goals, habits, notes, aiInteractions },
      activity: { activeSessions: sessions, dau: dau.length, mau: mau.length },
      growth: { newUsersToday, newUsersMonth },
      roles: roleBreakdown,
    });
  } catch (err) { next(err); }
});

// System settings
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await prisma.systemSettings.findMany();
    res.json({ settings });
  } catch (err) { next(err); }
});

router.put('/settings', async (req, res, next) => {
  try {
    const { settings } = req.body;
    const ops = settings.map(({ key, value }) =>
      prisma.systemSettings.upsert({ where: { key }, update: { value }, create: { key, value } })
    );
    await Promise.all(ops);
    res.json({ message: 'Settings updated.' });
  } catch (err) { next(err); }
});

module.exports = router;
