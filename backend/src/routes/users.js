// users.js
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/me', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, role: true, avatar: true, createdAt: true, lastLogin: true },
  });
  res.json({ user });
});

router.put('/me', async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, avatar },
      select: { id: true, email: true, name: true, role: true, avatar: true },
    });
    res.json({ user });
  } catch (err) { next(err); }
});

router.get('/me/sessions', async (req, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user.id },
      orderBy: { loginTime: 'desc' },
      take: 20,
    });
    res.json({ sessions });
  } catch (err) { next(err); }
});

module.exports = router;
