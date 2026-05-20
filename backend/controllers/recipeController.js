const Item = require('../models/Item');
const Recipe = require('../models/Recipe');

// Helper to calculate days left until expiry
function getDaysLeft(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  return Math.round((expiry - today) / (1000 * 60 * 60 * 24));
}

// @desc    Get recipe suggestions based on inventory items
// @route   GET /api/recipes/suggest
// @access  Private
exports.getRecipeSuggestions = async (req, res) => {
  try {
    // Fetch all active/reserved inventory items for the user
    const items = await Item.find({
      userId: req.user.id,
      status: { $in: ['available', 'reserved'] }
    });

    // Fetch all recipes from MongoDB
    const recipes = await Recipe.find();

    const suggestions = recipes.map(recipe => {
      const matchedItems = [];
      const unmatched = [];
      let minDaysLeft = Infinity;

      recipe.required.forEach(reqIng => {
        const match = items.find(item => {
          const name1 = item.name.toLowerCase();
          const name2 = reqIng.toLowerCase();
          return name1.includes(name2) || name2.includes(name1);
        });

        if (match) {
          matchedItems.push(match.name);
          const daysLeft = getDaysLeft(match.expiryDate);
          if (daysLeft < minDaysLeft) {
            minDaysLeft = daysLeft;
          }
        } else {
          unmatched.push(reqIng);
        }
      });

      const matchCount = matchedItems.length;

      return {
        name: recipe.name,
        uses: matchedItems,
        unmatched: unmatched,
        daysLeft: matchCount > 0 ? minDaysLeft : 99, // default safety days if no matches
        matchCount
      };
    });

    // Sort: soonest expiry of matched items (daysLeft) first, then highest match count, then alphabetically
    suggestions.sort((a, b) => {
      if (a.daysLeft !== b.daysLeft) {
        return a.daysLeft - b.daysLeft;
      }
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount;
      }
      return a.name.localeCompare(b.name);
    });

    // Return the top 5 suggestions
    res.json(suggestions.slice(0, 5));
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
