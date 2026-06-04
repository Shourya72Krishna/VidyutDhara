const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/prisma');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const createSession = async (userId, req) => {
  const token = generateToken(userId);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const ua = req.headers['user-agent'] || '';
  const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';

  // Simple UA parsing
  const deviceType = /mobile/i.test(ua) ? 'mobile' : /tablet/i.test(ua) ? 'tablet' : 'desktop';
  const os = /windows/i.test(ua) ? 'Windows' : /mac/i.test(ua) ? 'macOS' : /linux/i.test(ua) ? 'Linux' : /android/i.test(ua) ? 'Android' : /ios|iphone|ipad/i.test(ua) ? 'iOS' : 'Unknown';
  const browser = /chrome/i.test(ua) ? 'Chrome' : /firefox/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : /edge/i.test(ua) ? 'Edge' : 'Unknown';

  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      ipAddress,
      deviceType,
      os,
      browser,
    },
  });

  // Update last login
  await prisma.user.update({
    where: { id: userId },
    data: { lastLogin: new Date() },
  });

  return { token, session };
};

const sendTokenCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '7') * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  };
  res.cookie('jwt', token, cookieOptions);
};

module.exports = { generateToken, verifyToken, createSession, sendTokenCookie };
