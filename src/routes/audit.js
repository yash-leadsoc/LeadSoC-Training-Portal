const router = require('express').Router();
const ctrl = require('../controllers/auditController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', requireRole('admin', 'manager'), ctrl.list);   // read logs: admin + manager
router.post('/event', ctrl.record); 
router.get('/insights', requireRole('admin', 'bu'), ctrl.insights);                      // any signed-in user can emit an event

module.exports = router;