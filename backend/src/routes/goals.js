// goals.js
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { protect } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const { status, category, search } = req.query;
    const where = { userId: req.user.id };
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const goals = await prisma.goal.findMany({
      where,
      include: { tasks: { select: { id: true, title: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Auto-calculate progress
    const goalsWithProgress = goals.map(goal => {
      if (goal.tasks.length > 0) {
        const done = goal.tasks.filter(t => t.status === 'DONE').length;
        goal.progress = Math.round((done / goal.tasks.length) * 100);
      }
      return goal;
    });

    res.json({ goals: goalsWithProgress });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, category, targetDate } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    const goal = await prisma.goal.create({
      data: { userId: req.user.id, title, description, category, targetDate: targetDate ? new Date(targetDate) : null },
    });
    await logActivity(req.user.id, 'GOAL_CREATED', 'Goal', goal.id, { title });
    res.status(201).json({ goal });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const goal = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ error: 'Goal not found.' });

    const { title, description, category, status, progress, targetDate } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (category !== undefined) data.category = category;
    if (status !== undefined) {
      data.status = status;
      if (status === 'COMPLETED') data.completedAt = new Date();
    }
    if (progress !== undefined) data.progress = progress;
    if (targetDate !== undefined) data.targetDate = targetDate ? new Date(targetDate) : null;

    const updated = await prisma.goal.update({ where: { id: req.params.id }, data });
    res.json({ goal: updated });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const goal = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ error: 'Goal not found.' });
    await prisma.goal.delete({ where: { id: req.params.id } });
    res.json({ message: 'Goal deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
