const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    qty: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Vegetables', 'Dairy', 'Canned', 'Frozen', 'Bakery', 'Other'],
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    storageType: {
      type: String,
      enum: ['Fridge', 'Freezer', 'Pantry'],
      default: 'Pantry',
    },
    pickupLocation: {
      type: String,
      required: true,
    },
    availability: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'completed', 'hidden'],
      default: 'available',
    },
    notes: {
      type: String,
      default: '',
    },
    claimNote: {
      type: String,
      default: '',
    },
    preferredPickup: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Donation', donationSchema);
