const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);

// Admin registers managers
router.post('/managers', requireRole('admin'), ctrl.createManager);
// Admin or manager registers employees
router.post('/employees', requireRole('admin', 'manager'), ctrl.createEmployee);

router.get('/', requireRole('admin', 'manager'), ctrl.listUsers);
router.get('/managers', requireRole('admin'), ctrl.listManagers);
router.patch(
  '/:id/domains',
  requireAuth,
  requireRole('admin', 'manager'),
  ctrl.assignDomains
);
router.get('/:id', requireRole('admin', 'manager'), ctrl.getUser);
router.patch('/:id/active', requireRole('admin', 'manager'), ctrl.setActive);


module.exports = router;
