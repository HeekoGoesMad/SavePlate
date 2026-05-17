const Item = require('../models/Item');
const MealPlan = require('../models/MealPlan');

function isPastDate(dateValue) {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// @desc    Get all items for the logged-in user
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find({ userId: req.user.id }).sort({ expiryDate: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Add a new inventory item
exports.addItem = async (req, res) => {
  try {
    const { name, category, quantity, unit, expiryDate, storageLocation, notes } = req.body;

    if (!name || !category || !quantity || !expiryDate) {
      return res.status(400).json({ message: 'Name, category, quantity, and expiry date are required.' });
    }
    if (Number(quantity) <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive number.' });
    }
    if (isPastDate(expiryDate)) {
      return res.status(400).json({ message: 'Expiry date cannot be in the past.' });
    }

    const item = await Item.create({
      userId: req.user.id,
      name,
      category,
      quantity: Number(quantity),
      unit: unit || 'pcs',
      expiryDate,
      storageLocation: storageLocation || '',
      notes: notes || '',
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update an inventory item
exports.updateItem = async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, userId: req.user.id });
    if (!item) return res.status(404).json({ message: 'Item not found.' });

    const updates = req.body;
    if (updates.quantity !== undefined && Number(updates.quantity) <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive number.' });
    }
    if (updates.expiryDate && isPastDate(updates.expiryDate)) {
      return res.status(400).json({ message: 'Expiry date cannot be in the past.' });
    }
    Object.keys(updates).forEach((key) => {
      if (key !== '_id' && key !== 'userId') {
        item[key] = updates[key];
      }
    });
    await item.save();

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update item status (mark as used, donated, reserved)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['available', 'used', 'donated', 'reserved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    // Find the item first to validate business rules
    const item = await Item.findOne({ _id: req.params.id, userId: req.user.id });
    if (!item) return res.status(404).json({ message: 'Item not found.' });

    // Validation: prevent invalid transitions to 'reserved'
    if (status === 'reserved') {
      if (item.status === 'donated') {
        return res.status(400).json({ message: 'Donated items cannot be added to a meal plan.' });
      }
      if (item.status === 'used') {
        return res.status(400).json({ message: 'Used items cannot be added to a meal plan.' });
      }
      if (isPastDate(item.expiryDate)) {
        return res.status(400).json({ message: 'Expired items cannot be added to a meal plan.' });
      }
    }

    item.status = status;
    if (status === 'used') item.usedAt = new Date();
    await item.save();

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete an inventory item
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, userId: req.user.id });
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    if (item.status === 'reserved') {
      return res.status(409).json({ message: 'This item is reserved for a meal plan. Remove it from the plan before deleting.' });
    }
    const activePlan = await MealPlan.findOne({
      userId: req.user.id,
      isConfirmed: true,
      'slots.meals.ingredient': { $regex: escapeRegex(item.name), $options: 'i' },
    });
    if (activePlan) {
      return res.status(409).json({ message: 'This item is reserved for a meal plan. Remove it from the plan before deleting.' });
    }
    await item.deleteOne();

    res.json({ message: 'Item deleted.', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
