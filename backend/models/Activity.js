const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'DRIVE_OPEN',
        'DRIVE_UPDATED',
        'DRIVE_CLOSED',
        'PLACEMENT_CONFIRMED',
        'APPLICATION_SUBMITTED',
        'DRIVE_CREATED',
        'STUDENT_PLACED',
        'ANNOUNCEMENT',
      ],
      required: true,
    },
    text: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      trim: true,
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['Drive', 'Student'],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    colorCode: {
      type: String,
      default: '#B0C4DE',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drive',
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

activitySchema.pre('validate', function (next) {
  if (!this.content && this.text) {
    this.content = this.text;
  }

  if (!this.text && this.content) {
    this.text = this.content;
  }

  if (!this.text && !this.content) {
    return next(new Error('Either text or content is required'));
  }

  if (!this.relatedEntity?.entityType && this.drive) {
    this.relatedEntity = { entityType: 'Drive', entityId: this.drive };
  }

  if (!this.relatedEntity?.entityType && this.student) {
    this.relatedEntity = { entityType: 'Student', entityId: this.student };
  }

  next();
});

module.exports = mongoose.model('Activity', activitySchema);
