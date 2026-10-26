const express = require('express');
const User = require('../models/User');
const Drive = require('../models/Drive');
const Activity = require('../models/Activity');
const Offer = require('../models/Offer');
const { protect, tpoOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const round1 = (value) => Math.round((Number(value) || 0) * 10) / 10;

const buildBatchFilters = (batch) => {
  if (!batch) {
    return {
      studentFilter: { role: 'student' },
      driveFilter: {},
    };
  }

  const batchAsString = String(batch);
  const batchAsNumber = Number(batch);

  const studentBatchFilter = Number.isNaN(batchAsNumber)
    ? batchAsString
    : { $in: [batchAsString, batchAsNumber] };

  const driveBatchFilter = Number.isNaN(batchAsNumber)
    ? { 'eligibilityCriteria.batch': batchAsString }
    : { 'eligibilityCriteria.batch': batchAsNumber };

  return {
    studentFilter: { role: 'student', batch: studentBatchFilter },
    driveFilter: driveBatchFilter,
  };
};

const getYearlyAveragePackage = async (start, end, studentIds) => {
  const match = {
    status: 'Accepted',
    offerDate: { $gte: start, $lt: end },
  };

  if (studentIds) {
    match.studentId = { $in: studentIds };
  }

  const [result] = await Offer.aggregate([
    { $match: match },
    { $group: { _id: null, avgPackage: { $avg: '$packageLPA' } } },
  ]);

  return Number(result?.avgPackage || 0);
};

// GET /api/tpo/stats?batch=2025
router.get('/stats', protect, tpoOnly, async (req, res) => {
  try {
    const { batch } = req.query;
    const { studentFilter, driveFilter } = buildBatchFilters(batch);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, eligible, placedFallback, students, companiesVisitedList] = await Promise.all([
      User.countDocuments(studentFilter),
      User.countDocuments({ ...studentFilter, placementStatus: { $ne: 'not_eligible' } }),
      User.countDocuments({ ...studentFilter, placementStatus: 'placed' }),
      User.find(studentFilter).select('_id').lean(),
      Drive.distinct('company', driveFilter),
    ]);

    const studentIds = students.map((student) => student._id);
    const offerMatch = studentIds.length
      ? { studentId: { $in: studentIds } }
      : { _id: null };

    const [acceptedStudentIds, avgPackageResult, firstSeenCompanies, currentYearAvg, previousYearAvg] = await Promise.all([
      Offer.distinct('studentId', { ...offerMatch, status: 'Accepted' }),
      Offer.aggregate([
        { $match: { ...offerMatch, status: 'Accepted' } },
        { $group: { _id: null, avgPackageLPA: { $avg: '$packageLPA' } } },
      ]),
      Drive.aggregate([
        { $match: driveFilter },
        { $group: { _id: '$company', firstSeenAt: { $min: '$createdAt' } } },
        { $match: { firstSeenAt: { $gte: monthStart, $lte: now } } },
        { $count: 'count' },
      ]),
      getYearlyAveragePackage(
        new Date(now.getFullYear(), 0, 1),
        new Date(now.getFullYear() + 1, 0, 1),
        studentIds.length ? studentIds : null
      ),
      getYearlyAveragePackage(
        new Date(now.getFullYear() - 1, 0, 1),
        new Date(now.getFullYear(), 0, 1),
        studentIds.length ? studentIds : null
      ),
    ]);

    const placed = acceptedStudentIds.length || placedFallback;
    const avgPackageLPA = round1(avgPackageResult[0]?.avgPackageLPA || 0);
    const yoyPackageGrowthLPA = round1(currentYearAvg - previousYearAvg);

    res.json({
      success: true,
      data: {
        total,
        eligible,
        placed,
        companiesVisited: companiesVisitedList.length,
        newCompaniesThisMonth: firstSeenCompanies[0]?.count || 0,
        avgPackageLPA,
        yoyPackageGrowthLPA,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/tpo/activity?limit=5
router.get('/activity', protect, tpoOnly, async (req, res) => {
  try {
    const limit = Math.max(parseInt(req.query.limit, 10) || 5, 1);

    const activities = await Activity.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const data = activities.map((item) => ({
      _id: `act_${String(item._id).slice(-6)}`,
      colorCode: item.colorCode || '#B0C4DE',
      content: item.content || item.text,
      createdAt: item.createdAt,
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/tpo/analytics/placements?year=2026
router.get('/analytics/placements', protect, tpoOnly, async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const placementData = await Offer.aggregate([
      {
        $match: {
          status: 'Accepted',
          offerDate: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: { $month: '$offerDate' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const data = placementData.map((item) => ({
      month: MONTHS[item._id - 1],
      count: item.count,
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
