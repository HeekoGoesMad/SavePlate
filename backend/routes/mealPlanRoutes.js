const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getMealPlan,
  saveMealPlan,
  deleteMealPlan,
} = require('../controllers/mealPlanController');

router.get('/', auth, getMealPlan);
router.post('/', auth, saveMealPlan);
router.delete('/:id', auth, deleteMealPlan);

module.exports = router;
