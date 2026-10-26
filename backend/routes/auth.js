const express  = require('express');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const User     = require('../models/User');
const { protect, tpoOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── POST /api/auth/register ────────────────────────────────
router.post('/register', async (req, res) => {
  const {
    name, email, password, role,
    rollNumber, degree, branch, batch, cgpa,
    companyName, companyWebsite, companyDescription,
  } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name, email, password,
      role: 'student',
      rollNumber, degree, branch, batch, cgpa,
      companyName, companyWebsite, companyDescription,
    });

    res.status(201).json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/company-recruiter ── TPO creates recruiter ──
router.post('/company-recruiter', protect, tpoOnly, async (req, res) => {
  const { name, email, password, companyName, companyWebsite, companyDescription } = req.body;
  if (!name || !email || !password || !companyName) return res.status(400).json({ message: 'Name, email, password and company name are required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  try {
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ message: 'Email already registered' });
    const recruiter = await User.create({ name, email, password, role: 'company', companyName, companyWebsite, companyDescription, companyVerified: true });
    res.status(201).json({ id: recruiter._id, name: recruiter.name, email: recruiter.email, role: recruiter.role, companyName: recruiter.companyName });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST /api/auth/login ───────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (role && user.role !== role) {
      return res.status(403).json({ message: `This account is registered as ${user.role}, not ${role}.` });
    }
    if (user.role === 'company' && !user.companyVerified) {
      return res.status(403).json({ message: 'Company recruiter account is not verified yet.' });
    }

    res.json({
      _id:    user._id,
      name:   user.name,
      email:  user.email,
      role:   user.role,
      cgpa:   user.cgpa,
      branch: user.branch,
      token:  generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// ── POST /api/auth/change-password ────────────────────────
router.post('/change-password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both current and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/forgot-password ────────────────────────
// Generates a reset token (in production: email it; here we return it for dev)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    // Always respond OK to avoid enumeration attacks
    if (!user) {
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    const token   = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken   = token;
    user.resetPasswordExpires = expires;
    await user.save({ validateBeforeSave: false });

    // In production: send email with link
    // For dev/demo: return token directly
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    console.log('🔑 Password reset URL (dev):', resetUrl);

    res.json({
      message:  'If that email is registered, a reset link has been sent.',
      // Remove `devResetUrl` in production:
      devResetUrl: resetUrl,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/reset-password ─────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken:   token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset token is invalid or has expired' });
    }

    user.password             = newPassword;
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
