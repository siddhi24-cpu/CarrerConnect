const express = require('express');
const Drive = require('../models/Drive');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// GET /api/analytics/placements?year=2026
router.get('/placements', protect, async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getUTCFullYear();
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const placementData = await Drive.aggregate([
      { $unwind: '$applicants' },
      { $match: { 'applicants.stage': 'selected' } },
      {
        $addFields: {
          placementDate: { $ifNull: ['$applicants.selectedAt', '$applicants.appliedAt'] },
        },
      },
      {
        $match: {
          placementDate: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: { $month: '$placementDate' },
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
