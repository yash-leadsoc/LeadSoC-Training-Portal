const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    section: { type: String, default: 'General' },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

// A set of write-up questions created by a manager for a document.
const writeupSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    // document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    // domain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', required: true },
    // document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
    // domain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', required: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
    domain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [questionSchema],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Writeup', writeupSchema);
