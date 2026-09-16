const mongoose = require('mongoose');

// Tracks that an employee has reviewed/downloaded a document (training material).
const materialReviewSchema = new mongoose.Schema(
  {
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewed: { type: Boolean, default: true },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

materialReviewSchema.index({ document: 1, employee: 1 }, { unique: true });

module.exports = mongoose.model('MaterialReview', materialReviewSchema);
