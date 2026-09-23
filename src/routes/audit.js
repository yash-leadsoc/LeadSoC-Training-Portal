const router = require('express').Router();
const ctrl = require('../controllers/auditController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', requireRole('admin', 'bu'), ctrl.list);   // read logs: admin + BU
router.post('/event', ctrl.record);                       // any signed-in user can emit an event

module.exports = router;