const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const Item = require('../models/Item');

// @desc    Mark own (hidden) item as used — permanently deletes the record
exports.markAsUsed = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Item not found.' });

    if (donation.donorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    // Only allow marking hidden (own inventory) items as used
    if (donation.status !== 'hidden') {
      return res.status(400).json({ message: 'Only your own inventory items can be marked as used.' });
    }

    await Donation.deleteOne({ _id: donation._id });
    res.json({ message: 'Item marked as used and removed from inventory.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

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
        const isNotPrivate = isOwner || donation.donorId?.listingVisibility !== 'private';
        const isAvailableOrOwner = donation.status !== 'hidden' || isOwner;
        return isNotPrivate && isAvailableOrOwner;
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
      status: 'hidden', // Initially hidden as requested by user
    });

    await Notification.create({
      userId: req.user.id,
      type: 'donation',
      message: `Your donation for ${donation.name} is ready. Go to Browse Food to publicly post it.`,
      link: 'browse',
    });

    res.status(201).json(donation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Hide a donation listing (Return to Inventory)
exports.hideDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found.' });

    if (donation.donorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    donation.status = 'hidden';
    await donation.save();
    res.json(serialiseDonation(donation, req.user.id));
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Publish a hidden donation (Convert to Donation)
exports.publishDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found.' });

    if (donation.donorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    donation.status = 'available';
    await donation.save();
    res.json(serialiseDonation(donation, req.user.id));
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

    const populated = await Donation.findById(donation._id)
      .populate('donorId', 'name email listingVisibility showFullName showLocation')
      .populate('claimedBy', 'name email');
    res.json(serialiseDonation(populated, req.user.id));
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

    const populated = await Donation.findById(donation._id)
      .populate('donorId', 'name email listingVisibility showFullName showLocation')
      .populate('claimedBy', 'name email');
    res.json(serialiseDonation(populated, req.user.id));
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
      // Parse qty string (e.g., "1 pcs") into quantity and unit
      let quantity = 1;
      let unit = 'pcs';
      if (donation.qty) {
        const parts = donation.qty.split(' ');
        const parsedQ = parseFloat(parts[0]);
        if (!isNaN(parsedQ)) quantity = parsedQ;
        if (parts[1]) unit = parts[1];
      }

      // Create a new inventory item for the claimer
      await Item.create({
        userId: donation.claimedBy,
        name: donation.name,
        quantity,
        unit,
        category: donation.category,
        expiryDate: donation.expiryDate,
        storageLocation: donation.storageType || 'Pantry',
        status: 'available',
      });

      await Notification.create({
        userId: donation.claimedBy,
        type: 'donation',
        message: `${donation.name} handover has been confirmed. It has been added to your inventory.`,
        link: 'browse',
      });
    }

    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
