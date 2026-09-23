const Domain = require('../models/Domain');

exports.list = async (req, res) => {
  try {
    const domains = await Domain.find().sort({ name: 1 });

    // Admin / Manager
    if (
      req.user.role === 'admin' ||
      req.user.role === 'manager'
    ) {
      return res.json({
        domains: domains.map((domain) => ({
          ...domain.toObject(),
          assigned: true,
        })),
      });
    }

    // Employee
    const assignedDomainIds = (
      req.user.assignedDomains || []
    ).map((domain) =>
      String(domain?._id || domain)
    );

    const result = domains.map((domain) => ({
      ...domain.toObject(),

      // true if assigned to employee
      assigned: assignedDomainIds.includes(
        String(domain._id)
      ),
    }));

    return res.json({
      domains: result,
    });
  } catch (error) {
    console.error('[domains] Error:', error);

    return res.status(500).json({
      message: 'Failed to load domains',
    });
  }
};

exports.create = async (req, res) => {
  try {
    const { key, name, description, icon } = req.body;
    if (!key || !name) return res.status(400).json({ message: 'key and name are required' });
    const exists = await Domain.findOne({ key: key.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Domain key already exists' });
    const domain = await Domain.create({
      key: key.toLowerCase(),
      name,
      description: description || '',
      icon: icon || '📘',
      createdBy: req.user._id,
    });
    res.status(201).json({ domain });
  } catch (err) {
    res.status(500).json({ message: 'Could not create domain' });
  }
};

exports.update = async (req, res) => {
  const domain = await Domain.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!domain) return res.status(404).json({ message: 'Domain not found' });
  res.json({ domain });
};

exports.remove = async (req, res) => {
  const domain = await Domain.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!domain) return res.status(404).json({ message: 'Domain not found' });
  res.json({ message: 'Domain archived' });
};


exports.deleteDomain = async (req, res) => {
  const domain = await Domain.findById(req.params.id);
  if (!domain) return res.status(404).json({ message: 'Domain not found' });
  domain.active = false;            // soft delete; or domain.deleteOne() for hard delete
  await domain.save();
  res.json({ message: 'Domain deleted' });
};