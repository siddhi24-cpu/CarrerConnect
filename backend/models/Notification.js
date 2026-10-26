const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: { type: String, enum: ['drive','application','interview','offer','profile','system'], default: 'system' },
  read: { type: Boolean, default: false },
  link: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
