// notes.js
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const { search, tag, archived, pinned } = req.query;
    const where = { userId: req.user.id };
    if (archived !== undefined) where.isArchived = archived === 'true';
    else where.isArchived = false;
    if (pinned === 'true') where.isPinned = true;
    if (tag) where.tags = { has: tag };
    if (search) where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];

    const notes = await prisma.note.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    });
    res.json({ notes });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, content, tags, isPinned } = req.body;
    const note = await prisma.note.create({
      data: { userId: req.user.id, title: title || 'Untitled', content: content || '', tags: tags || [], isPinned: isPinned || false },
    });
    res.status(201).json({ note });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const note = await prisma.note.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!note) return res.status(404).json({ error: 'Note not found.' });
    const updated = await prisma.note.update({ where: { id: req.params.id }, data: req.body });
    res.json({ note: updated });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const note = await prisma.note.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!note) return res.status(404).json({ error: 'Note not found.' });
    await prisma.note.delete({ where: { id: req.params.id } });
    res.json({ message: 'Note deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
