import { ref, computed } from 'vue'

// ── Inventory singleton (used by MealPlanner) ──
const inventory = ref([
  { id: 1, name: 'Fresh Milk',    qty: '1L',    daysLeft: 1, category: 'Dairy',   isReserved: false },
  { id: 2, name: 'Spinach',       qty: '200g',  daysLeft: 2, category: 'Veggies', isReserved: false },
  { id: 3, name: 'Greek Yogurt',  qty: '500g',  daysLeft: 3, category: 'Dairy',   isReserved: false },
  { id: 4, name: 'Tomatoes',      qty: '4 pcs', daysLeft: 4, category: 'Veggies', isReserved: false },
  { id: 5, name: 'Chicken Thigh', qty: '300g',  daysLeft: 5, category: 'Protein', isReserved: false },
  { id: 6, name: 'Brown Rice',    qty: '500g',  daysLeft: 7, category: 'Grains',  isReserved: false },
  { id: 7, name: 'Cheddar',       qty: '150g',  daysLeft: 9, category: 'Dairy',   isReserved: false },
])

// ── Meal slots ──
const SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']

/**
 * Generate a consistent ISO date key for a given week offset and day index.
 * Mon = 0, Tue = 1, … Sun = 6
 */
function getWeekDays(weekOffset = 0) {
  const today = new Date()
  const mon = new Date(today)
  mon.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return {
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      iso: d.toISOString().slice(0, 10),
      isToday: d.toDateString() === today.toDateString(),
    }
  })
}

/**
 * Returns recipe suggestions based on inventory items sorted by expiry urgency.
 * Prioritises items nearing expiry as per FR-6.2.
 */
function getRecipeSuggestions(inv) {
  const items = [...inv].sort((a, b) => a.daysLeft - b.daysLeft)
  return [
    { name: 'Spinach Smoothie',  uses: ['Spinach'],               daysLeft: items.find(i => i.name === 'Spinach')?.daysLeft ?? 99 },
    { name: 'Milk Oatmeal',     uses: ['Fresh Milk'],             daysLeft: items.find(i => i.name === 'Fresh Milk')?.daysLeft ?? 99 },
    { name: 'Greek Yogurt Bowl', uses: ['Greek Yogurt'],           daysLeft: items.find(i => i.name === 'Greek Yogurt')?.daysLeft ?? 99 },
    { name: 'Tomato Omelette',   uses: ['Tomatoes'],               daysLeft: items.find(i => i.name === 'Tomatoes')?.daysLeft ?? 99 },
    { name: 'Chicken & Rice',    uses: ['Chicken Thigh', 'Brown Rice'], daysLeft: items.find(i => i.name === 'Chicken Thigh')?.daysLeft ?? 99 },
  ].sort((a, b) => a.daysLeft - b.daysLeft)
}

/**
 * Compute urgency colour from days left.
 * @param {number} days
 * @returns {{ color: string, bg: string }}
 */
function urgencyColor(days) {
  if (days <= 2) return { color: '#ef4444', bg: '#fef2f2' }
  if (days <= 4) return { color: '#f59e0b', bg: '#fffbeb' }
  return { color: '#22c55e', bg: '#f0fdf4' }
}

/**
 * Return items expiring within `thresholdDays` that are NOT reserved
 * and NOT already in the current meal plan.
 * @param {Array} inv
 * @param {Object} mealPlan
 * @param {number} thresholdDays
 * @returns {Array}
 */
function getExpiringSuggestions(inv, mealPlan, thresholdDays = 2) {
  // Build a set of ingredient names already planned
  const planned = new Set()
  Object.values(mealPlan).flat().forEach(meal => {
    const ings = meal.ingredient.split(',').map(s => s.trim().toLowerCase())
    ings.forEach(i => planned.add(i))
  })

  return inv.filter(item =>
    item.daysLeft <= thresholdDays &&
    !item.isReserved &&
    !planned.has(item.name.toLowerCase())
  )
}

export function useMealPlanner() {
  const weekOffset = ref(0)
  const mealPlan = ref({})
  const confirmedSnapshot = ref('{}')

  const weekDays = computed(() => getWeekDays(weekOffset.value))

  const weekLabel = computed(() => {
    const days = weekDays.value
    return `${days[0].date} – ${days[6].date}`
  })

  /**
   * True whenever mealPlan diverges from the last-confirmed snapshot.
   */
  const hasChanges = computed(() =>
    JSON.stringify(mealPlan.value) !== confirmedSnapshot.value
  )

  /**
   * Get meals for a given day+slot key.
   */
  function getMeals(dayIso, slot) {
    return mealPlan.value[`${dayIso}-${slot}`] || []
  }

  /**
   * Add a custom meal to a given day + slot.
   * @returns {{ success: boolean, message: string }}
   */
  function addMeal(dayIso, slot, name, ingredientStr) {
    if (!name || !name.trim()) {
      return { success: false, message: 'Meal name is required' }
    }
    const key = `${dayIso}-${slot}`
    if (!mealPlan.value[key]) mealPlan.value[key] = []
    mealPlan.value[key].push({
      name: name.trim(),
      ingredient: ingredientStr || '—',
    })
    return { success: true, message: `"${name.trim()}" added to ${slot}` }
  }

  /**
   * Add a recipe suggestion to a given day + slot.
   * @returns {{ success: boolean, message: string }}
   */
  function addRecipe(dayIso, slot, recipe) {
    if (!recipe || !recipe.name) {
      return { success: false, message: 'Invalid recipe' }
    }
    const key = `${dayIso}-${slot}`
    if (!mealPlan.value[key]) mealPlan.value[key] = []
    mealPlan.value[key].push({
      name: recipe.name,
      ingredient: recipe.uses.join(', '),
    })
    return { success: true, message: `"${recipe.name}" added to ${slot}` }
  }

  /**
   * Remove a meal from a given day + slot by index.
   * @returns {{ success: boolean, removedName: string }}
   */
  function removeMeal(dayIso, slot, idx) {
    const key = `${dayIso}-${slot}`
    if (!mealPlan.value[key] || !mealPlan.value[key][idx]) {
      return { success: false, removedName: '' }
    }
    const removed = mealPlan.value[key].splice(idx, 1)[0]
    return { success: true, removedName: removed.name }
  }

  /**
   * Quick-add an inventory item to the first empty slot of a target day.
   * @returns {{ success: boolean, message: string, slot?: string }}
   */
  function addInventoryToDay(item, targetDayIso) {
    const emptySlot = SLOTS.find(s => getMeals(targetDayIso, s).length === 0)
    if (!emptySlot) {
      return { success: false, message: 'All meal slots are filled.' }
    }
    const key = `${targetDayIso}-${emptySlot}`
    if (!mealPlan.value[key]) mealPlan.value[key] = []
    mealPlan.value[key].push({
      name: `Meal with ${item.name}`,
      ingredient: item.name,
    })
    return { success: true, message: `${item.name} quick-added to ${emptySlot}`, slot: emptySlot }
  }

  /**
   * Confirm the current meal plan:
   *  1. Snapshot the plan state
   *  2. Reserve matching inventory items
   *  3. Return a summary for notification and toast
   *
   * @returns {{ success: boolean, reservedCount: number, weekLabel: string }}
   */
  function confirmPlan(inv) {
    // At least one meal must be planned
    const totalMeals = Object.values(mealPlan.value).flat().length
    if (totalMeals === 0) {
      return { success: false, reservedCount: 0, weekLabel: weekLabel.value }
    }

    // Snapshot
    confirmedSnapshot.value = JSON.stringify(mealPlan.value)

    // Collect all ingredient strings from planned meals
    const allIngredients = Object.values(mealPlan.value)
      .flat()
      .map(meal => meal.ingredient)
      .join(', ')
      .toLowerCase()

    // Reserve matching inventory items
    let reservedCount = 0
    inv.forEach(item => {
      if (allIngredients.includes(item.name.toLowerCase())) {
        item.isReserved = true
        reservedCount++
      }
    })

    return { success: true, reservedCount, weekLabel: weekLabel.value }
  }

  return {
    // State
    inventory,
    mealPlan,
    weekOffset,
    weekDays,
    weekLabel,
    confirmedSnapshot,
    hasChanges,
    SLOTS,

    // Actions
    getMeals,
    addMeal,
    addRecipe,
    removeMeal,
    addInventoryToDay,
    confirmPlan,

    // Utilities (also exported for unit testing)
    getRecipeSuggestions,
    urgencyColor,
    getExpiringSuggestions,
    getWeekDays,
  }
}
