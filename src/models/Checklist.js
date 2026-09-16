const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    category: { type: String, default: 'tool' }, // tool | concepts | practical | advanced
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

// A checklist is created by a manager for a particular document.
const checklistSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    domain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [checklistItemSchema],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Checklist', checklistSchema);
