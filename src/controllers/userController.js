const User = require('../models/User');

function genCode(role) {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return role === 'manager' ? `LS-MGR-${rand}` : `LS-${rand}`;
}

// Admin registers a manager.
exports.createManager = async (req, res) => {
  try {
    const { name, email, password, employeeCode } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'A user with this email already exists' });

    const user = new User({
      name,
      email: email.toLowerCase(),
      employeeCode: employeeCode || genCode('manager'),
      role: 'manager',
      createdBy: req.user._id,
    });
    await user.setPassword(password);
    await user.save();
    res.status(201).json({ user: user.toSafeJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create manager' });
  }
};

// Manager (or admin) registers an employee.
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, employeeCode, managerId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'A user with this email already exists' });

    // If an admin creates an employee they may pass a managerId; otherwise the creating manager owns them.
    let manager = req.user._id;
    if (req.user.role === 'admin' && managerId) manager = managerId;

    const user = new User({
      name,
      email: email.toLowerCase(),
      employeeCode: employeeCode || genCode('employee'),
      role: 'employee',
      createdBy: req.user._id,
      manager,
    });
    await user.setPassword(password);
    await user.save();
    res.status(201).json({ user: user.toSafeJSON() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create employee' });
  }
};

// List users. Admin sees everyone; manager sees their own employees.
exports.listUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let filter = {};

    if (req.user.role === 'admin') {
      if (role) filter.role = role;
    } else if (req.user.role === 'manager') {
      // managers only see the employees they manage
      filter = { role: 'employee', manager: req.user._id };
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ users: users.map((u) => u.toSafeJSON()) });
  } catch (err) {
    res.status(500).json({ message: 'Could not list users' });
  }
};

// Managers list (for admin dropdowns)
exports.listManagers = async (req, res) => {
  const managers = await User.find({ role: 'manager' }).sort({ name: 1 });
  res.json({ managers: managers.map((m) => m.toSafeJSON()) });
};

exports.getUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  // managers can only view their own employees
  if (req.user.role === 'manager' && String(user.manager) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json({ user: user.toSafeJSON() });
};

exports.setActive = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ message: 'Cannot deactivate admin' });
  user.active = !!req.body.active;
  await user.save();
  res.json({ user: user.toSafeJSON() });
};
