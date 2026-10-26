const mongoose = require('mongoose');

const driveSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
    },
    package: {
      type: String,
      required: [true, 'Package is required'],
    },
    packageValue: {
      type: Number, // in LPA, for filtering
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'soon'],
      default: 'open',
    },
    description: { type: String },
    eligibilityCriteria: {
      minCGPA: { type: Number, default: 6.0 },
      allowedBranches: [{ type: String }],
      maxBacklogs: { type: Number, default: 0 },
      batch: { type: Number },
    },
    applicants: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        appliedAt: { type: Date, default: Date.now },
        stage: {
          type: String,
          enum: ['applied', 'shortlisted', 'technical', 'hr', 'selected', 'rejected'],
          default: 'applied',
        },
        selectedAt: { type: Date },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Drive', driveSchema);
