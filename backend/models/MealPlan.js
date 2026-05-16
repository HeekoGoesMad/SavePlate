const mongoose = require('mongoose');

const mealEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    ingredient: { type: String, default: '—' },
  },
  { _id: false }
);

const slotSchema = new mongoose.Schema(
  {
    dayIso: { type: String, required: true },       // e.g. '2026-05-19'
    slot: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'],
      required: true,
    },
    meals: [mealEntrySchema],
  },
  { _id: false }
);

const mealPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weekStart: {
      type: String,           // ISO date of Monday, e.g. '2026-05-18'
      required: true,
    },
    slots: [slotSchema],
    isConfirmed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// One plan per user per week
mealPlanSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('MealPlan', mealPlanSchema);
