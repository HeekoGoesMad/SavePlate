const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Vegetables', 'Dairy', 'Canned', 'Frozen', 'Bakery', 'Other'],
      required: [true, 'Category is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      enum: ['pcs', 'g', 'kg', 'ml', 'L'],
      default: 'pcs',
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    storageLocation: {
      type: String,
      enum: ['Fridge', 'Freezer', 'Pantry', ''],
      default: '',
    },
    status: {
      type: String,
      enum: ['available', 'used', 'donated', 'reserved'],
      default: 'available',
    },
    notes: {
      type: String,
      default: '',
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Item', itemSchema);
