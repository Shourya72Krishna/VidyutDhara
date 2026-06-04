// search.js
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ results: [] });

    const userId = req.user.id;
    const mode = 'insensitive';

    const [tasks, goals, notes, habits] = await Promise.all([
      prisma.task.findMany({ where: { userId, title: { contains: q, mode }, isArchived: false }, take: 5, select: { id: true, title: true, status: true, priority: true } }),
      prisma.goal.findMany({ where: { userId, title: { contains: q, mode } }, take: 5, select: { id: true, title: true, status: true, progress: true } }),
      prisma.note.findMany({ where: { userId, OR: [{ title: { contains: q, mode } }, { content: { contains: q, mode } }], isArchived: false }, take: 5, select: { id: true, title: true, updatedAt: true } }),
      prisma.habit.findMany({ where: { userId, title: { contains: q, mode } }, take: 5, select: { id: true, title: true, frequency: true } }),
    ]);

    res.json({
      results: [
        ...tasks.map(t => ({ ...t, type: 'task' })),
        ...goals.map(g => ({ ...g, type: 'goal' })),
        ...notes.map(n => ({ ...n, type: 'note' })),
        ...habits.map(h => ({ ...h, type: 'habit' })),
      ],
    });
  } catch (err) { next(err); }
});

module.exports = router;
