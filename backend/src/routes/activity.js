const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.activityLog.count({ where: { userId: req.user.id } }),
    ]);
    res.json({ logs, total });
  } catch (err) { next(err); }
});

module.exports = router;
