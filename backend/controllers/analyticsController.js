const Item = require('../models/Item');
const Donation = require('../models/Donation');
const mongoose = require('mongoose');

// @desc    Get analytics summary for the logged-in user
// Query params: category (optional), period (7d | 30d | all)
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjId = mongoose.Types.ObjectId.createFromHexString(userId);

    // ── Time-period filter ──────────────────────────────────────────────────
    const { period = 'all', category } = req.query;
    let dateFilter = {};
    if (period === '7d') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      dateFilter = { updatedAt: { $gte: d } };
    } else if (period === '30d') {
      const d = new Date(); d.setDate(d.getDate() - 30);
      dateFilter = { updatedAt: { $gte: d } };
    }

    // ── Category filter ─────────────────────────────────────────────────────
    const categoryFilter = category && category !== 'All' ? { category } : {};

    // ── Base item match ─────────────────────────────────────────────────────
    const baseMatch = { userId: userObjId, ...dateFilter, ...categoryFilter };
    const baseMatchDonation = { donorId: userObjId, ...dateFilter, ...categoryFilter };

    // ── Summary counts ──────────────────────────────────────────────────────
    const totalItems    = await Item.countDocuments({ userId: userObjId, ...categoryFilter });
    const usedItems     = await Item.countDocuments({ ...baseMatch, status: 'used' });
    const donatedItems  = await Item.countDocuments({ ...baseMatch, status: 'donated' });
    const activeItems   = await Item.countDocuments({ ...baseMatch, status: 'available' });

    // Expiring within 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const expiringSoon = await Item.countDocuments({
      ...baseMatch,
      status: 'available',
      expiryDate: { $lte: threeDaysFromNow },
    });

    // Donations made / claimed
    const donationsMade    = await Donation.countDocuments({ donorId: userObjId, ...categoryFilter });
    const donationsClaimed = await Donation.countDocuments({ claimedBy: userObjId });

    // ── Category breakdown (for donut chart) ────────────────────────────────
    const categoryBreakdown = await Item.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // ── Monthly usage — items marked used, grouped by year+month ────────────
    const monthlyUsage = await Item.aggregate([
      {
        $match: {
          userId: userObjId,
          status: 'used',
          ...categoryFilter,
        },
      },
      {
        $group: {
          _id: {
            year:  { $year:  '$updatedAt' },
            month: { $month: '$updatedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // ── Monthly donations — completed donations grouped by year+month ────────
    const monthlyDonations = await Donation.aggregate([
      {
        $match: {
          donorId: userObjId,
          status: { $in: ['completed', 'available', 'reserved'] },
          ...categoryFilter,
        },
      },
      {
        $group: {
          _id: {
            year:  { $year:  '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      totalItems,
      usedItems,
      donatedItems,
      activeItems,
      expiringSoon,
      donationsMade,
      donationsClaimed,
      categoryBreakdown,
      monthlyUsage,
      monthlyDonations,
      // Estimated impact (rough estimates)
      wasteReduced: (usedItems * 0.35).toFixed(1),   // ~350g per item
      co2Saved:     (usedItems * 2.5).toFixed(1),    // ~2.5kg CO2 per item
      waterSaved:   Math.round(usedItems * 15),       // ~15L per item
      moneySaved:   (usedItems * 3.5).toFixed(2),    // ~$3.50 per item
    });
  } catch (error) {
    console.error('getAnalytics error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
