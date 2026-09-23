const AuditLog = require('../models/AuditLog');
const { logAudit } = require('../utils/audit');

// GET /api/audit  — admin sees all; BU sees only its own BU
exports.list = async (req, res) => {
  try {
    const { actor, action, entity, from, to, q, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (req.user.role === 'admin') {
      // no scope — sees everything
    } else if (req.user.role === 'bu') {
      filter.businessUnit = req.user._id;
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (actor) filter.actor = actor;
    if (action) filter.action = action;
    if (entity) filter.entity = entity;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    if (q) filter.$or = [{ entityLabel: new RegExp(q, 'i') }, { actorName: new RegExp(q, 'i') }];

    const lim = Math.min(Number(limit) || 50, 200);
    const skip = (Math.max(Number(page), 1) - 1) * lim;

    const [rows, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ rows, total, page: Math.max(Number(page), 1), limit: lim });
  } catch (e) {
    console.error('[audit] list', e);
    res.status(500).json({ message: 'Could not load logs' });
  }
};

// POST /api/audit/event — client-emitted events (e.g. write-up focus lost)
// Identity is taken from the token, never from the body.
exports.record = async (req, res) => {
  const { action, entity, entityId, entityLabel, meta } = req.body || {};
  if (!action) return res.status(400).json({ message: 'action is required' });
  await logAudit(req, { action, entity, entityId, entityLabel, meta });
  res.status(201).json({ ok: true });
};