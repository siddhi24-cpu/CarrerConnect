const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const User     = require('../models/User');
const Drive    = require('../models/Drive');
const Activity = require('../models/Activity');
const { protect, tpoOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// ── Multer: resume upload ──────────────────────────────────
const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'resumes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `resume_${req.user._id}${ext}`);
  },
});

const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  },
});

// ── Helpers ────────────────────────────────────────────────
const STAGE_LABEL_MAP = {
  applied:      'Applied',
  shortlisted:  'Shortlisted',
  technical:    'Technical Interview',
  hr:           'HR Round',
  selected:     'Offer Received',
  rejected:     'Rejected',
};

const calculateProfileStrength = (student) => {
  const checks = [
    !!student.rollNumber,
    !!student.degree,
    !!student.branch,
    !!student.batch,
    student.cgpa != null,
    student.tenthScore != null,
    student.twelfthScore != null,
    Array.isArray(student.skills) && student.skills.length > 0,
    !!student.phone,
    !!student.about,
    !!student.resumeUrl,
  ];

  const done   = checks.filter(Boolean).length;
  const base   = (done / checks.length) * 70;
  const cgpa   = ((Math.max(0, Math.min(Number(student.cgpa) || 0, 10))) / 10) * 20;
  const penalty = Math.max(0, Number(student.backlogs) || 0) * 2;

  return Math.max(0, Math.min(100, Math.round(base + cgpa + 10 - penalty)));
};

const normaliseSkills = (skills) => {
  if (Array.isArray(skills)) {
    return skills
      .map((s) => {
        if (typeof s === 'string') return s.trim();
        if (s && typeof s === 'object') return String(s.name || s.label || s.value || '').trim();
        return '';
      })
      .filter(Boolean);
  }

  if (typeof skills === 'string') {
    return skills.split(',').map((s) => s.trim()).filter(Boolean);
  }

  return [];
};

const mapProfile = (s) => ({
  name:            s.name,
  email:           s.email,
  rollNumber:      s.rollNumber   || '',
  degree:          s.degree       || '',
  branch:          s.branch       || '',
  batch:           s.batch        || '',
  cgpa:            s.cgpa         ?? null,
  backlogs:        s.backlogs     ?? 0,
  tenthScore:      s.tenthScore   ?? null,
  twelfthScore:    s.twelfthScore ?? null,
  skills:          normaliseSkills(s.skills),
  phone:           s.phone        || '',
  linkedIn:        s.linkedIn     || '',
  github:          s.github       || '',
  about:           s.about        || '',
  resumeUrl:       s.resumeUrl    || '',
  avatarColor:     s.avatarColor  || '#B0C4DE',
  profileStrength: calculateProfileStrength(s),
  projects:         s.projects || [],
  certifications:   s.certifications || [],
  experience:       s.experience || [],
  achievements:     s.achievements || [],
  resumeTemplate:   s.resumeTemplate || 'ats',
  careerGoals:      s.careerGoals || [],
  placementStatus: s.placementStatus,
  placedAt:        s.placedAt     || '',
});

// ── GET /api/students ── All students (TPO) ────────────────
router.get('/', protect, tpoOnly, async (req, res) => {
  try {
    const { branch, status, batch, search, page = 1, limit = 20 } = req.query;
    const filter = { role: 'student' };

    if (branch)  filter.branch = branch;
    if (status)  filter.placementStatus = status;
    if (batch) {
      const n = Number(batch);
      filter.batch = Number.isNaN(n) ? String(batch) : { $in: [String(batch), n] };
    }
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ name: re }, { email: re }, { rollNumber: re }];
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);
    const students = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ name: 1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/students/me ── Own profile ────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: mapProfile(student) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ── PUT /api/students/me ── Update profile ─────────────────
router.put('/me', protect, async (req, res) => {
  try {
    const ALLOWED = [
      'name', 'rollNumber', 'degree', 'branch', 'batch',
      'cgpa', 'backlogs', 'tenthScore', 'twelfthScore', 'skills',
      'phone', 'linkedIn', 'github', 'about', 'avatarColor', 'projects', 'certifications', 'experience', 'achievements', 'resumeTemplate', 'careerGoals',
    ];

    const updates = {};
    ALLOWED.forEach((f) => {
      if (Object.prototype.hasOwnProperty.call(req.body, f)) {
        updates[f] = req.body[f];
      }
    });

    // Normalise skills
    if ('skills' in updates) {
      if (Array.isArray(updates.skills)) {
        updates.skills = updates.skills.map((s) => String(s).trim()).filter(Boolean);
      } else if (typeof updates.skills === 'string') {
        updates.skills = updates.skills.split(',').map((s) => s.trim()).filter(Boolean);
      } else {
        updates.skills = [];
      }
    }

    // Basic validation
    if (updates.cgpa !== undefined && (updates.cgpa < 0 || updates.cgpa > 10)) {
      return res.status(400).json({ success: false, message: 'CGPA must be between 0 and 10' });
    }
    if (updates.tenthScore !== undefined && (updates.tenthScore < 0 || updates.tenthScore > 100)) {
      return res.status(400).json({ success: false, message: '10th score must be between 0 and 100' });
    }
    if (updates.twelfthScore !== undefined && (updates.twelfthScore < 0 || updates.twelfthScore > 100)) {
      return res.status(400).json({ success: false, message: '12th score must be between 0 and 100' });
    }

    const student = await User.findById(req.user._id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    Object.keys(updates).forEach((k) => { student[k] = updates[k]; });
    student.profileStrength = calculateProfileStrength(student);
    await student.save();

    // Log activity
    Activity.create({
      type:      'DRIVE_UPDATED',
      text:      `${student.name} updated their profile`,
      content:   `${student.name} updated their profile`,
      colorCode: '#B0C4DE',
      createdBy: student._id,
      student:   student._id,
    }).catch(() => {});

    res.json({ success: true, data: mapProfile(student), message: 'Profile updated successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── POST /api/students/me/resume ── Upload resume ──────────
router.post(
  '/me/resume',
  protect,
  (req, res, next) => {
    uploadResume.single('resume')(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const resumeUrl = `/uploads/resumes/${req.file.filename}`;
      const student   = await User.findByIdAndUpdate(
        req.user._id,
        { resumeUrl },
        { new: true }
      );

      res.json({ success: true, resumeUrl, message: 'Resume uploaded successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── GET /api/students/stats ── Placement stats (TPO) ───────
router.get('/stats', protect, tpoOnly, async (req, res) => {
  try {
    const total    = await User.countDocuments({ role: 'student' });
    const placed   = await User.countDocuments({ role: 'student', placementStatus: 'placed' });
    const applied  = await User.countDocuments({ role: 'student', placementStatus: 'applied' });
    const eligible = await User.countDocuments({ role: 'student', placementStatus: 'eligible' });
    res.json({ total, placed, applied, eligible });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/students/me/stats ──────────────────────────────
router.get('/me/stats', protect, async (req, res) => {
  try {
    const drives = await Drive.find({ 'applicants.student': req.user._id })
      .select('company applicants.student applicants.stage')
      .lean();

    const shortlistedStages = new Set(['shortlisted', 'technical', 'hr', 'selected']);
    const shortlistedCompanies = [];

    drives.forEach((drive) => {
      const applicant = drive.applicants.find(
        (a) => String(a.student) === String(req.user._id)
      );
      if (applicant && shortlistedStages.has(applicant.stage)) {
        shortlistedCompanies.push(drive.company);
      }
    });

    const profileScore = calculateProfileStrength(req.user);

    res.json({
      success: true,
      data: {
        appliedCount:           drives.length,
        shortlistedCount:       [...new Set(shortlistedCompanies)].length,
        shortlistedCompanies:   [...new Set(shortlistedCompanies)],
        profileScore,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/students/me/applications ──────────────────────
router.get('/me/applications', protect, async (req, res) => {
  try {
    const drives = await Drive.find({ 'applicants.student': req.user._id })
      .select('company role status applicants.student applicants.stage applicants.appliedAt')
      .lean();

    const data = [];
    drives.forEach((drive) => {
      const applicant = drive.applicants.find(
        (a) => String(a.student) === String(req.user._id)
      );
      if (!applicant) return;
      data.push({
        applicationId: `app_${String(applicant._id).slice(-6)}`,
        company:       drive.company,
        role:          drive.role,
        appliedDate:   applicant.appliedAt,
        currentStage:  STAGE_LABEL_MAP[applicant.stage] || applicant.stage,
        driveStatus:   drive.status,
      });
    });

    data.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/students/me/application-stats ─────────────────
router.get('/me/application-stats', protect, async (req, res) => {
  try {
    const drives = await Drive.find({ 'applicants.student': req.user._id })
      .select('applicants.student applicants.stage')
      .lean();

    let totalApplied = 0, inProgress = 0, offersReceived = 0;
    drives.forEach((drive) => {
      const applicant = drive.applicants.find(
        (a) => String(a.student) === String(req.user._id)
      );
      if (!applicant) return;
      totalApplied += 1;
      if (['shortlisted', 'technical', 'hr'].includes(applicant.stage)) inProgress += 1;
      if (applicant.stage === 'selected') offersReceived += 1;
    });

    res.json({ success: true, data: { totalApplied, inProgress, offersReceived } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/students/:id ── Student profile (TPO) ─────────
router.get('/:id', protect, tpoOnly, async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' })
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .lean();

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.json({ success: true, data: mapProfile(student) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/students/:id/status ── TPO updates student ────
router.put('/:id/status', protect, tpoOnly, async (req, res) => {
  try {
    const { placementStatus, placedAt } = req.body;
    const student = await User.findByIdAndUpdate(
      req.params.id,
      { placementStatus, placedAt },
      { new: true }
    ).select('-password');

    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (placementStatus === 'placed' && placedAt) {
      Activity.create({
        type:      'STUDENT_PLACED',
        text:      `<b>${student.name}</b> confirmed placement at ${placedAt}`,
        content:   `<b>${student.name}</b> confirmed placement at ${placedAt}`,
        colorCode: '#B8D8C8',
        createdBy: req.user._id,
        student:   student._id,
        relatedEntity: { entityType: 'Student', entityId: student._id },
      }).catch(() => {});
    }

    res.json(student);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
