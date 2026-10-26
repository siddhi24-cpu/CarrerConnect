const express = require('express');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/activity?page=1&limit=5
router.get('/', protect, async (req, res) => {
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

    res.json({
      success: true,
      data,
      pagination: { page, limit },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
