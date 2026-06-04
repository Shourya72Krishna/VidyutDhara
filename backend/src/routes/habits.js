const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { protect } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.user.id },
      include: {
        logs: {
          orderBy: { completedAt: 'desc' },
          take: 30,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ habits });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, frequency, targetCount, color, icon } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required.' });

    const habit = await prisma.habit.create({
      data: {
        userId: req.user.id, title, description,
        frequency: frequency || 'DAILY', targetCount: targetCount || 1,
        color, icon,
      },
    });
    await logActivity(req.user.id, 'HABIT_CREATED', 'Habit', habit.id, { title });
    res.status(201).json({ habit });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const habit = await prisma.habit.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!habit) return res.status(404).json({ error: 'Habit not found.' });

    const updated = await prisma.habit.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ habit: updated });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const habit = await prisma.habit.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!habit) return res.status(404).json({ error: 'Habit not found.' });
    await prisma.habit.delete({ where: { id: req.params.id } });
    res.json({ message: 'Habit deleted.' });
  } catch (err) { next(err); }
});

// POST /api/habits/:id/log - mark habit as complete
router.post('/:id/log', async (req, res, next) => {
  try {
    const habit = await prisma.habit.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!habit) return res.status(404).json({ error: 'Habit not found.' });

    const { notes, count } = req.body;
    const log = await prisma.habitLog.create({
      data: { habitId: habit.id, userId: req.user.id, notes, count: count || 1 },
    });

    // Update streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const lastLog = await prisma.habitLog.findFirst({
      where: {
        habitId: habit.id,
        completedAt: { gte: yesterday },
        id: { not: log.id },
      },
    });

    const newStreak = lastLog ? habit.currentStreak + 1 : 1;
    await prisma.habit.update({
      where: { id: habit.id },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(habit.longestStreak, newStreak),
      },
    });

    await logActivity(req.user.id, 'HABIT_COMPLETED', 'Habit', habit.id, { title: habit.title });
    res.status(201).json({ log });
  } catch (err) { next(err); }
});

module.exports = router;
