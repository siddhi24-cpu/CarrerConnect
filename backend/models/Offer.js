const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drive',
      required: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    packageLPA: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Offered', 'Accepted', 'Declined'],
      default: 'Offered',
    },
    offerDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

offerSchema.index({ status: 1, offerDate: 1 });
offerSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.model('Offer', offerSchema);
