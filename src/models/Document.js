const mongoose = require('mongoose');

// A "Document" is a training material (ppt/doc/pdf/etc.) uploaded by a manager or admin,
// attached to a specific domain. Checklists and write-up questions hang off a document.
const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    domain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', required: true },

    // stored file
    fileName: { type: String, required: true },        // stored name on disk
    originalName: { type: String, required: true },     // name shown to user
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploaderRole: { type: String, enum: ['admin', 'manager'], required: true },

    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
