const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const prisma = require('../config/prisma');
const { protect } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');

router.use(protect);

// GET /api/tasks
router.get('/', async (req, res, next) => {
  try {
    const { status, priority, category, tag, search, sort = 'createdAt', order = 'desc', page = 1, limit = 20, archived } = req.query;

    const where = {
      userId: req.user.id,
      parentId: null,
      isArchived: archived === 'true',
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (tag) where.tags = { has: tag };
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: { subtasks: true, goal: { select: { id: true, title: true } } },
        orderBy: { [sort]: order },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.task.count({ where }),
    ]);

    res.json({ tasks, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
});

// POST /api/tasks
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, priority, status, category, tags, dueDate, isRecurring, recurPattern, parentId, goalId } = req.body;

    // Verify parent belongs to user if provided
    if (parentId) {
      const parent = await prisma.task.findFirst({ where: { id: parentId, userId: req.user.id } });
      if (!parent) return res.status(404).json({ error: 'Parent task not found.' });
    }

    const task = await prisma.task.create({
      data: {
        userId: req.user.id, title, description, priority: priority || 'MEDIUM',
        status: status || 'TODO', category, tags: tags || [], dueDate: dueDate ? new Date(dueDate) : null,
        isRecurring: isRecurring || false, recurPattern, parentId, goalId,
      },
      include: { subtasks: true },
    });

    await logActivity(req.user.id, 'TASK_CREATED', 'Task', task.id, { title });
    res.status(201).json({ task });
  } catch (err) { next(err); }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        subtasks: true,
        goal: { select: { id: true, title: true } },
        dependencies: { include: { requiredTask: { select: { id: true, title: true, status: true } } } },
      },
    });
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    res.json({ task });
  } catch (err) { next(err); }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Task not found.' });

    const { title, description, priority, status, category, tags, dueDate, isRecurring, recurPattern, goalId } = req.body;

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (priority !== undefined) data.priority = priority;
    if (status !== undefined) {
      data.status = status;
      if (status === 'DONE' && existing.status !== 'DONE') data.completedAt = new Date();
      if (status !== 'DONE') data.completedAt = null;
    }
    if (category !== undefined) data.category = category;
    if (tags !== undefined) data.tags = tags;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (isRecurring !== undefined) data.isRecurring = isRecurring;
    if (recurPattern !== undefined) data.recurPattern = recurPattern;
    if (goalId !== undefined) data.goalId = goalId;

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data,
      include: { subtasks: true },
    });

    await logActivity(req.user.id, 'TASK_UPDATED', 'Task', task.id);
    res.json({ task });
  } catch (err) { next(err); }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    await prisma.task.delete({ where: { id: req.params.id } });
    await logActivity(req.user.id, 'TASK_DELETED', 'Task', req.params.id);
    res.json({ message: 'Task deleted.' });
  } catch (err) { next(err); }
});

// PATCH /api/tasks/:id/archive
router.patch('/:id/archive', async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { isArchived: !task.isArchived },
    });
    await logActivity(req.user.id, updated.isArchived ? 'TASK_ARCHIVED' : 'TASK_RESTORED', 'Task', task.id);
    res.json({ task: updated });
  } catch (err) { next(err); }
});

// POST /api/tasks/:id/dependencies
router.post('/:id/dependencies', async (req, res, next) => {
  try {
    const { requiredTaskId } = req.body;
    if (req.params.id === requiredTaskId) return res.status(400).json({ error: 'Task cannot depend on itself.' });

    const dep = await prisma.taskDependency.create({
      data: { dependentTaskId: req.params.id, requiredTaskId },
    });
    res.status(201).json({ dependency: dep });
  } catch (err) { next(err); }
});

module.exports = router;
