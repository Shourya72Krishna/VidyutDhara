const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/prisma');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated. Please log in.' });
    }

    const decoded = verifyToken(token);

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    const user = session.user;

    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been banned.' });
    }

    if (user.isSuspended && user.suspendedUntil && user.suspendedUntil > new Date()) {
      return res.status(403).json({ error: `Account suspended until ${user.suspendedUntil.toISOString()}` });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
    next(err);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
};

const isAdmin = restrictTo('ADMIN', 'SUPER_ADMIN');
const isSuperAdmin = restrictTo('SUPER_ADMIN');

module.exports = { protect, restrictTo, isAdmin, isSuperAdmin };
