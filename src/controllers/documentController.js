const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const MaterialReview = require('../models/MaterialReview');
const { UPLOAD_DIR } = require('../middleware/upload');

// Manager or admin uploads a material for a domain.
exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const { title, description, domainId } = req.body;
    if (!title || !domainId) {
      // clean the orphan file
      fs.unlink(path.join(UPLOAD_DIR, req.file.filename), () => {});
      return res.status(400).json({ message: 'title and domainId are required' });
    }

    const doc = await Document.create({
      title,
      description: description || '',
      domain: domainId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
      uploaderRole: req.user.role, // admin | manager
    });
    const populated = await doc.populate([
      { path: 'domain', select: 'key name' },
      { path: 'uploadedBy', select: 'name role' },
    ]);
    res.status(201).json({ document: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
};

// List materials, optionally by domain. Everyone authenticated can list.
exports.list = async (req, res) => {
  const filter = { active: true };
  if (req.query.domainId) filter.domain = req.query.domainId;
  const docs = await Document.find(filter)
    .sort({ createdAt: -1 })
    .populate('domain', 'key name')
    .populate('uploadedBy', 'name role');
  res.json({ documents: docs });
};

exports.getOne = async (req, res) => {
  const doc = await Document.findById(req.params.id)
    .populate('domain', 'key name')
    .populate('uploadedBy', 'name role');
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  res.json({ document: doc });
};

// Download the actual file. Records a review/download for employees.
exports.download = async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  const filePath = path.join(UPLOAD_DIR, doc.fileName);
  if (!fs.existsSync(filePath)) return res.status(410).json({ message: 'File missing on server' });

  if (req.user.role === 'employee') {
    await MaterialReview.findOneAndUpdate(
      { document: doc._id, employee: req.user._id },
      { $set: { reviewed: true }, $inc: { downloadCount: 1 } },
      { upsert: true, new: true }
    );
  }

  res.download(filePath, doc.originalName);
};

// Employee marks a material reviewed (without downloading).
exports.markReviewed = async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  const review = await MaterialReview.findOneAndUpdate(
    { document: doc._id, employee: req.user._id },
    { $set: { reviewed: req.body.reviewed !== false } },
    { upsert: true, new: true }
  );
  res.json({ review });
};

exports.remove = async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  // Only uploader or admin can remove
  if (req.user.role !== 'admin' && String(doc.uploadedBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  doc.active = false;
  await doc.save();
  res.json({ message: 'Document archived' });
};
