const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const projectSchema = new mongoose.Schema({
  title: { type: String, trim: true },
  description: { type: String, trim: true },
  technologies: [{ type: String, trim: true }],
  github: { type: String, trim: true },
  liveDemo: { type: String, trim: true },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, 'Password is required'], minlength: 6 },
    role: { type: String, enum: ['student', 'tpo', 'company'], default: 'student' },

    rollNumber: { type: String, trim: true }, degree: { type: String, trim: true }, branch: { type: String, trim: true }, batch: { type: String },
    cgpa: { type: Number, min: 0, max: 10 }, skills: [{ type: String }],
    tenthScore: { type: Number, min: 0, max: 100 }, twelfthScore: { type: Number, min: 0, max: 100 }, backlogs: { type: Number, default: 0, min: 0 },
    phone: { type: String, trim: true }, linkedIn: { type: String, trim: true }, github: { type: String, trim: true }, about: { type: String, trim: true, maxlength: 1000 },
    resumeUrl: { type: String }, avatarColor: { type: String, default: '#B0C4DE' },
    projects: [projectSchema],
    certifications: [{ type: String, trim: true }],
    experience: [{ type: String, trim: true }],
    achievements: [{ type: String, trim: true }],
    resumeTemplate: { type: String, enum: ['ats','modern','executive','graduate','minimal'], default: 'ats' },
    careerGoals: [{ type: String, trim: true }],
    resumeHeadline: { type: String, trim: true, maxlength: 120 },
    location: { type: String, trim: true, maxlength: 120 },
    portfolio: { type: String, trim: true, maxlength: 300 },
    customSections: [{
      title: { type: String, trim: true, maxlength: 80 },
      bullets: [{ type: String, trim: true, maxlength: 300 }],
    }],

    // Company recruiter profile
    companyName: { type: String, trim: true },
    companyWebsite: { type: String, trim: true },
    companyDescription: { type: String, trim: true, maxlength: 2000 },
    companyVerified: { type: Boolean, default: false },

    profileStrength: { type: Number, default: 0 },
    placementStatus: { type: String, enum: ['eligible', 'applied', 'placed', 'not_eligible'], default: 'eligible' },
    placedAt: { type: String },
    resetPasswordToken: { type: String }, resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.comparePassword = async function (candidatePassword) { return bcrypt.compare(candidatePassword, this.password); };
module.exports = mongoose.model('User', userSchema);
