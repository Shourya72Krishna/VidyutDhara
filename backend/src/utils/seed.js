const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { logger } = require('./logger');

const initializeSuperAdmin = async () => {
  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@vidyutdhar.app';
  const existing = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (existing) return;

  const password = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123!', 12);
  await prisma.user.create({
    data: {
      email,
      name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
      password,
      role: 'SUPER_ADMIN',
    },
  });
  logger.info(`Super Admin created: ${email}`);
};

module.exports = { initializeSuperAdmin };
