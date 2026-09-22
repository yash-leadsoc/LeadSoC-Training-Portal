const express = require('express');
const router = express.Router();

const controller = require('../controllers/pptSubmissionController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.post(
  '/',
  requireAuth,
  requireRole('employee'),
  controller.submit
);


router.get(
  '/employee/:employeeId',
  requireAuth,
  requireRole('admin', 'manager'),
  controller.getEmployeeSubmissions
);

module.exports = router;