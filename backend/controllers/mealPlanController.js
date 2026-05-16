const MealPlan = require('../models/MealPlan');
const Item = require('../models/Item');
const Notification = require('../models/Notification');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function reserveInventoryAndNotify(plan, userId) {
  const ingredientNames = [
    ...new Set(
      plan.slots
        .flatMap(slot => slot.meals || [])
        .flatMap(meal => (meal.ingredient || '').split(','))
        .map(name => name.trim())
        .filter(Boolean)
    ),
  ];

  if (ingredientNames.length > 0) {
    await Item.updateMany(
      {
        userId,
        status: 'available',
        $or: ingredientNames.map(name => ({
          name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
        })),
      },
      { status: 'reserved' }
    );
  }

  const mealNotifications = plan.slots.flatMap(slot =>
    (slot.meals || []).map(meal => ({
      userId,
      type: 'meal',
      message: `Reminder: ${meal.name} is planned for ${slot.dayIso} ${slot.slot}.`,
      link: 'meal-planner',
    }))
  );

  if (mealNotifications.length > 0) {
    await Notification.insertMany(mealNotifications, { ordered: false });
  }
}

// @desc    Get meal plan for a given week
exports.getMealPlan = async (req, res) => {
  try {
    const { weekStart } = req.query;
    if (!weekStart) {
      return res.status(400).json({ message: 'weekStart query parameter is required.' });
    }

    const plan = await MealPlan.findOne({ userId: req.user.id, weekStart });
    res.json(plan || { slots: [], isConfirmed: false });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Save (create or update) meal plan for a given week
exports.saveMealPlan = async (req, res) => {
  try {
    const { weekStart, slots, isConfirmed } = req.body;

    if (!weekStart) {
      return res.status(400).json({ message: 'weekStart is required.' });
    }

    let plan = await MealPlan.findOne({ userId: req.user.id, weekStart });

    const wasConfirmed = Boolean(plan?.isConfirmed);

    if (plan) {
      plan.slots = slots || [];
      plan.isConfirmed = isConfirmed ?? plan.isConfirmed;
      await plan.save();
    } else {
      plan = await MealPlan.create({
        userId: req.user.id,
        weekStart,
        slots: slots || [],
        isConfirmed: isConfirmed || false,
      });
    }

    if (plan.isConfirmed && !wasConfirmed) {
      await reserveInventoryAndNotify(plan, req.user.id);
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a meal plan
exports.deleteMealPlan = async (req, res) => {
  try {
    const plan = await MealPlan.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!plan) return res.status(404).json({ message: 'Meal plan not found.' });

    res.json({ message: 'Meal plan deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
