const Item = require('../models/Item');
const Donation = require('../models/Donation');

// @desc    Get analytics summary for the logged-in user
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Total items the user has tracked
    const totalItems = await Item.countDocuments({ userId });
    const usedItems = await Item.countDocuments({ userId, status: 'used' });
    const donatedItems = await Item.countDocuments({ userId, status: 'donated' });
    const activeItems = await Item.countDocuments({ userId, status: 'available' });

    // Expiring within 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const expiringSoon = await Item.countDocuments({
      userId,
      status: 'available',
      expiryDate: { $lte: threeDaysFromNow },
    });

    // Donations made
    const donationsMade = await Donation.countDocuments({ donorId: userId });
    const donationsClaimed = await Donation.countDocuments({ claimedBy: userId });

    // Category breakdown
    const categoryBreakdown = await Item.aggregate([
      { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId) } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Monthly usage data (items marked as used, grouped by month)
    const monthlyUsage = await Item.aggregate([
      {
        $match: {
          userId: require('mongoose').Types.ObjectId.createFromHexString(userId),
          status: 'used',
        },
      },
      {
        $group: {
          _id: { $month: '$updatedAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
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
      // Estimated impact (rough estimates)
      wasteReduced: (usedItems * 0.35).toFixed(1),      // ~350g per item
      co2Saved: (usedItems * 2.5).toFixed(1),            // ~2.5kg CO2 per item
      waterSaved: Math.round(usedItems * 15),             // ~15L per item
      moneySaved: (usedItems * 3.5).toFixed(2),           // ~$3.50 per item
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
