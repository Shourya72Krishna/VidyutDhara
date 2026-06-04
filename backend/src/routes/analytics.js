// analytics.js
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/overview', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [tasks, completedTasks, goals, habits, notes, focusSessions] = await Promise.all([
      prisma.task.count({ where: { userId, isArchived: false } }),
      prisma.task.count({ where: { userId, status: 'DONE' } }),
      prisma.goal.count({ where: { userId } }),
      prisma.habit.count({ where: { userId, isActive: true } }),
      prisma.note.count({ where: { userId, isArchived: false } }),
      prisma.focusSession.findMany({ where: { userId, isCompleted: true } }),
    ]);

    const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const completionRate = tasks > 0 ? Math.round((completedTasks / tasks) * 100) : 0;

    // Task trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await prisma.activityLog.findMany({
      where: { userId, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      tasks: { total: tasks, completed: completedTasks, completionRate },
      goals: { total: goals },
      habits: { total: habits },
      notes: { total: notes },
      focus: { totalMinutes: totalFocusMinutes, sessions: focusSessions.length },
      recentActivity: recentActivity.length,
    });
  } catch (err) { next(err); }
});

module.exports = router;
