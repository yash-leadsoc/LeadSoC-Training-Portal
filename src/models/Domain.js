const mongoose = require('mongoose');

const domainSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true }, // sta, synthesis...
    name: { type: String, required: true, trim: true }, // STA
    description: { type: String, default: '' }, // Static timing analysis
    icon: { type: String, default: '📘' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Domain', domainSchema);
