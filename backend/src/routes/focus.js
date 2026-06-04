const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { protect } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const sessions = await prisma.focusSession.findMany({
      where: { userId: req.user.id },
      orderBy: { startTime: 'desc' },
      take: 50,
    });
    res.json({ sessions });
  } catch (err) { next(err); }
});

router.post('/start', async (req, res, next) => {
  try {
    const { taskId, notes } = req.body;
    // End any active session
    await prisma.focusSession.updateMany({
      where: { userId: req.user.id, isCompleted: false },
      data: { isCompleted: true, endTime: new Date() },
    });

    const session = await prisma.focusSession.create({
      data: { userId: req.user.id, taskId, notes },
    });
    res.status(201).json({ session });
  } catch (err) { next(err); }
});

router.post('/:id/end', async (req, res, next) => {
  try {
    const session = await prisma.focusSession.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    const endTime = new Date();
    const duration = Math.round((endTime - session.startTime) / 1000 / 60); // minutes

    const updated = await prisma.focusSession.update({
      where: { id: req.params.id },
      data: { endTime, duration, isCompleted: true },
    });

    await logActivity(req.user.id, 'FOCUS_SESSION_COMPLETED', 'FocusSession', session.id, { duration });
    res.json({ session: updated });
  } catch (err) { next(err); }
});

router.get('/stats', async (req, res, next) => {
  try {
    const sessions = await prisma.focusSession.findMany({
      where: { userId: req.user.id, isCompleted: true },
    });

    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalSessions = sessions.length;
    const avgDuration = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

    // Sessions per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent = sessions.filter(s => s.startTime >= sevenDaysAgo);

    res.json({ totalMinutes, totalSessions, avgDuration, recentCount: recent.length });
  } catch (err) { next(err); }
});

module.exports = router;
