const express = require('express');
const Drive = require('../models/Drive');
const Activity = require('../models/Activity');
const { protect, tpoOnly, tpoOrCompany } = require('../middleware/authMiddleware');
const sanitizeHtml = require('sanitize-html');
const User = require('../models/User');
const Notification = require('../models/Notification');

const router = express.Router();

// ── GET /api/drives ── All drives (authenticated) ──────────
router.get('/', protect, async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { company: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const drives = await Drive.find(filter).sort({ deadline: 1 });
    res.json(drives);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/drives/activity ── Activity feed alias ───────
router.get('/activity', protect, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    const activities = await Activity.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const data = activities.map((item) => ({
      id: `act_${String(item._id).slice(-6)}`,
      type: item.type,
      text: item.text,
      createdAt: item.createdAt,
      colorCode: item.colorCode || '#B0C4DE',
    }));

    res.json({ success: true, data, pagination: { page, limit } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/drives/:id ────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const drive = await Drive.findById(req.params.id).populate(
      'applicants.student',
      'name email rollNumber cgpa branch'
    );
    if (!drive) return res.status(404).json({ message: 'Drive not found' });
    res.json(drive);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/drives ── Create drive (TPO only) ────────────
router.post('/', protect, tpoOrCompany, async (req, res) => {
  try {
    const body = { ...req.body, createdBy: req.user._id, description: sanitizeHtml(req.body.description || '') };
    if (req.user.role === 'company') body.company = req.user.companyName || body.company;
    const drive = await Drive.create(body);

    Activity.create({
      type: 'DRIVE_CREATED',
      text: `<b>${drive.company} ${drive.role} Drive</b> is now accepting applications`,
      content: `<b>${drive.company} ${drive.role} Drive</b> is now accepting applications`,
      colorCode: '#B0C4DE',
      createdBy: req.user._id,
      drive: drive._id,
      relatedEntity: {
        entityType: 'Drive',
        entityId: drive._id,
      },
    }).catch(() => {});

    res.status(201).json(drive);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PUT /api/drives/:id ── Update drive (TPO only) ─────────
router.put('/:id', protect, tpoOrCompany, async (req, res) => {
  try {
    const filter = req.user.role === 'tpo' ? { _id: req.params.id } : { _id: req.params.id, createdBy: req.user._id };
    const update = { ...req.body }; if (update.description) update.description = sanitizeHtml(update.description);
    const drive = await Drive.findOneAndUpdate(filter, update, {
      new: true,
      runValidators: true,
    });
    if (!drive) return res.status(404).json({ message: 'Drive not found' });
    res.json(drive);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── DELETE /api/drives/:id ── Delete drive (TPO only) ──────
router.delete('/:id', protect, tpoOrCompany, async (req, res) => {
  try {
    const filter = req.user.role === 'tpo' ? { _id: req.params.id } : { _id: req.params.id, createdBy: req.user._id };
    const drive = await Drive.findOneAndDelete(filter);
    if (!drive) return res.status(404).json({ message: 'Drive not found' });

    Activity.create({
      type: 'DRIVE_CLOSED',
      text: `<b>${drive.company} ${drive.role} Drive</b> was closed`,
      content: `<b>${drive.company} ${drive.role} Drive</b> was closed`,
      colorCode: '#F2C4C4',
      createdBy: req.user._id,
      drive: drive._id,
      relatedEntity: {
        entityType: 'Drive',
        entityId: drive._id,
      },
    }).catch(() => {});

    res.json({ message: 'Drive deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/drives/:id/apply ── Student applies ──────────
router.post('/:id/apply', protect, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can apply to drives' });
  try {
    const drive = await Drive.findById(req.params.id);
    if (!drive) return res.status(404).json({ message: 'Drive not found' });
    if (drive.status === 'closed') {
      return res.status(400).json({ message: 'Drive is closed' });
    }
    const student = await User.findById(req.user._id).lean();
    const c = drive.eligibilityCriteria || {};
    if (c.minCGPA != null && Number(student.cgpa || 0) < Number(c.minCGPA)) return res.status(400).json({ message: `You need at least ${c.minCGPA} CGPA for this drive.` });
    if (c.maxBacklogs != null && Number(student.backlogs || 0) > Number(c.maxBacklogs)) return res.status(400).json({ message: `This drive allows a maximum of ${c.maxBacklogs} backlog(s).` });
    if (Array.isArray(c.allowedBranches) && c.allowedBranches.length && !c.allowedBranches.map(String).map(x=>x.toLowerCase()).includes(String(student.branch||'').toLowerCase())) return res.status(400).json({ message: 'Your branch is not eligible for this drive.' });
    if (c.batch != null && String(student.batch||'') !== String(c.batch)) return res.status(400).json({ message: 'Your batch is not eligible for this drive.' });

    const alreadyApplied = drive.applicants.some(
      (a) => a.student.toString() === req.user._id.toString()
    );
    if (alreadyApplied) {
      return res.status(400).json({ message: 'Already applied to this drive' });
    }

    drive.applicants.push({ student: req.user._id });
    await drive.save();

    Notification.create({userId:req.user._id,title:'Application submitted',message:`Your application for ${drive.company} — ${drive.role} has been submitted.`,type:'application',link:'/dashboard/applications'}).catch(()=>{});

    Activity.create({
      type: 'APPLICATION_SUBMITTED',
      text: `<b>${req.user.name}</b> applied to ${drive.company} ${drive.role} drive`,
      colorCode: '#B0C4DE',
      createdBy: req.user._id,
      drive: drive._id,
      student: req.user._id,
    }).catch(() => {});

    res.json({ message: 'Applied successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
