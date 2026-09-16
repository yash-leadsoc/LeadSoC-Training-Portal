const router = require('express').Router();
const ctrl = require('../controllers/trackingController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/me', requireRole('employee'), ctrl.myProgress);
router.get('/cohort', requireRole('admin', 'manager'), ctrl.cohort);
router.get('/employee/:id', requireRole('admin', 'manager'), ctrl.employeeProgress);

module.exports = router;
