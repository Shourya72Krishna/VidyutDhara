const prisma = require('../config/prisma');

const logActivity = async (userId, action, entity = null, entityId = null, metadata = null) => {
  try {
    await prisma.activityLog.create({
      data: { userId, action, entity, entityId, metadata },
    });
  } catch (err) {
    // Non-critical, don't throw
    console.error('Activity log error:', err.message);
  }
};

const logAudit = async (userId, action, target = null, targetId = null, oldValue = null, newValue = null, ipAddress = null) => {
  try {
    await prisma.auditLog.create({
      data: { userId, action, target, targetId, oldValue, newValue, ipAddress },
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { logActivity, logAudit };
