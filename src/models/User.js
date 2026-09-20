const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['admin', 'manager', 'employee'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    employeeCode: { type: String, trim: true }, // e.g. LS-2291 / LS-MGR-04
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },

    assignedDomains: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Domain',
      },
    ],
    // hierarchy: which user created this account
    // admin -> creates managers, manager -> creates employees
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // for employees: the manager they report to (usually == createdBy)
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    active: { type: Boolean, default: true },
    enrolledAt: { type: Date, default: Date.now }, // used for "days enrolled" / pace
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};

userSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    employeeCode: this.employeeCode,
    role: this.role,
    createdBy: this.createdBy,
    manager: this.manager,
    active: this.active,
    enrolledAt: this.enrolledAt,
    createdAt: this.createdAt,
  };
};

userSchema.statics.ROLES = ROLES;

module.exports = mongoose.model('User', userSchema);
