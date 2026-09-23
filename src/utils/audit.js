const AuditLog = require('../models/AuditLog');

// Stamp the current actor + their BU onto a log entry. Never throws.
function buFor(user = {}) {
  if (user.role === 'bu') return user._id;
  if (user.role === 'manager' || user.role === 'employee') return user.businessUnit || null;
  return null; // admin (or unknown)
}

async function logAudit(req, { action, entity, entityId, entityLabel, meta } = {}) {
  try {
    const u = (req && req.user) || {};
    await AuditLog.create({
      actor: u._id || null,
      actorName: u.name || '',
      actorRole: u.role || '',
      businessUnit: buFor(u),
      action,
      entity: entity || '',
      entityId: entityId != null ? String(entityId) : null,
      entityLabel: entityLabel || '',
      meta: meta || {},
    });
  } catch (e) {
    console.error('[audit] failed', e.message);
  }
}

module.exports = { logAudit };