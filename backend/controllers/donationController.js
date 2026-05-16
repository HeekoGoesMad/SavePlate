const Donation = require('../models/Donation');
const Notification = require('../models/Notification');

function serialiseDonation(donation, viewerId) {
  const obj = donation.toObject ? donation.toObject() : donation;
  const donor = obj.donorId;
  const isOwner = donor?._id?.toString() === viewerId || donor?.toString?.() === viewerId;

  if (donor && !isOwner) {
    if (donor.showFullName === false) {
      obj.donorId = { ...donor, name: 'Anonymous Donor', email: undefined };
    }
    if (donor.showLocation === false) {
      obj.pickupLocation = 'Location shared after claim confirmation';
    }
  }

  return obj;
}

// @desc    Get all available donations (public browse)
exports.getDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('donorId', 'name email listingVisibility showFullName showLocation')
      .populate('claimedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(donations
      .filter(donation => {
        const isOwner = donation.donorId?._id?.toString() === req.user.id;
        return isOwner || donation.donorId?.listingVisibility !== 'private';
      })
      .map(donation => serialiseDonation(donation, req.user.id)));
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get my donations (donor's own listings)
exports.getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donorId: req.user.id })
      .populate('claimedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create a donation listing
exports.createDonation = async (req, res) => {
  try {
    const { name, qty, category, expiryDate, storageType, pickupLocation, availability, notes } = req.body;

    if (!name || !qty || !category || !expiryDate || !pickupLocation || !availability) {
      return res.status(400).json({ message: 'Name, qty, category, expiryDate, pickupLocation, and availability are required.' });
    }

    const donation = await Donation.create({
      donorId: req.user.id,
      name,
      qty,
      category,
      expiryDate,
      storageType: storageType || 'Pantry',
      pickupLocation,
      availability,
      notes: notes || '',
    });

    await Notification.create({
      userId: req.user.id,
      type: 'donation',
      message: `Your donation listing for ${donation.name} has been posted.`,
      link: 'browse',
    });

    res.status(201).json(donation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Claim a donation
exports.claimDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found.' });

    if (donation.status !== 'available') {
      return res.status(400).json({ message: 'Donation is no longer available.' });
    }

    if (donation.donorId.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot claim your own donation.' });
    }

    donation.status = 'reserved';
    donation.claimedBy = req.user.id;
    donation.claimNote = req.body.claimNote || '';
    donation.preferredPickup = req.body.preferredPickup || '';
    await donation.save();

    await Notification.create([
      {
        userId: donation.donorId,
        type: 'donation',
        message: `${req.user.name || 'Someone'} claimed your donation: ${donation.name}.`,
        link: 'browse',
      },
      {
        userId: req.user.id,
        type: 'donation',
        message: `You claimed ${donation.name}. Coordinate pickup with the donor.`,
        link: 'browse',
      },
    ]);

    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Cancel a claim
exports.cancelClaim = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found.' });

    if (donation.claimedBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only cancel your own claims.' });
    }

    donation.status = 'available';
    donation.claimedBy = null;
    donation.claimNote = '';
    donation.preferredPickup = '';
    await donation.save();

    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Complete donation handover
exports.completeDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found.' });

    if (donation.donorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the donor can confirm handover.' });
    }

    donation.status = 'completed';
    await donation.save();

    if (donation.claimedBy) {
      await Notification.create({
        userId: donation.claimedBy,
        type: 'donation',
        message: `${donation.name} handover has been confirmed.`,
        link: 'browse',
      });
    }

    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
