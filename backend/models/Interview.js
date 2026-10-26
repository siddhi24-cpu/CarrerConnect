const mongoose = require('mongoose');
const interviewSchema = new mongoose.Schema({
  driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drive', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  round: { type: String, required: true, trim: true },
  scheduledAt: { type: Date, required: true },
  mode: { type: String, enum: ['Online', 'Offline'], default: 'Online' },
  meetingLink: { type: String, trim: true },
  venue: { type: String, trim: true },
  interviewer: { type: String, trim: true },
  notes: { type: String, trim: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
}, { timestamps: true });
interviewSchema.index({ studentId: 1, scheduledAt: 1 });
module.exports = mongoose.model('Interview', interviewSchema);
