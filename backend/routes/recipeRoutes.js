const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getRecipeSuggestions } = require('../controllers/recipeController');

router.get('/suggest', auth, getRecipeSuggestions);

module.exports = router;
