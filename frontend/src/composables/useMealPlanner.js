import { ref, computed } from 'vue'
import { authService } from '../services/authService'
import { items as inventoryItems, daysUntilExpiry } from '../services/inventoryService'

const API_URL = 'http://localhost:3000/api/meal-plan'

// ── Inventory computed from real inventory service ──
const inventory = computed(() =>
  inventoryItems.value
    .filter(i => i.status === 'available')
    .map(i => ({
      id: i.id,
      name: i.name,
      qty: `${i.quantity} ${i.unit}`,
      daysLeft: daysUntilExpiry(i.expiryDate),
      category: i.category,
      isReserved: i.status === 'reserved',
    }))
)

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
  // Generate dynamic suggestions from actual inventory
  const suggestions = items.slice(0, 5).map(item => ({
    name: `Meal with ${item.name}`,
    uses: [item.name],
    daysLeft: item.daysLeft,
  }))
  return suggestions.sort((a, b) => a.daysLeft - b.daysLeft)
}

/**
 * Compute urgency colour from days left.
 */
function urgencyColor(days) {
  if (days <= 2) return { color: '#ef4444', bg: '#fef2f2' }
  if (days <= 4) return { color: '#f59e0b', bg: '#fffbeb' }
  return { color: '#22c55e', bg: '#f0fdf4' }
}

/**
 * Return items expiring within `thresholdDays` that are NOT reserved
 * and NOT already in the current meal plan.
 */
function getExpiringSuggestions(inv, mealPlan, thresholdDays = 2) {
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

const weekOffset = ref(0)
const mealPlan = ref({})
const confirmedSnapshot = ref('{}')
const isLoading = ref(false)

export function useMealPlanner() {

  const weekDays = computed(() => getWeekDays(weekOffset.value))

  const weekLabel = computed(() => {
    const days = weekDays.value
    return `${days[0].date} – ${days[6].date}`
  })

  const weekStart = computed(() => weekDays.value[0]?.iso || '')

  const hasChanges = computed(() =>
    JSON.stringify(mealPlan.value) !== confirmedSnapshot.value
  )

  function getMeals(dayIso, slot) {
    return mealPlan.value[`${dayIso}-${slot}`] || []
  }

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

  function removeMeal(dayIso, slot, idx) {
    const key = `${dayIso}-${slot}`
    if (!mealPlan.value[key] || !mealPlan.value[key][idx]) {
      return { success: false, removedName: '' }
    }
    const removed = mealPlan.value[key].splice(idx, 1)[0]
    return { success: true, removedName: removed.name }
  }

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
   * Load meal plan from the backend for the current week.
   */
  async function loadMealPlan() {
    if (!authService.isLoggedIn.value || !weekStart.value) return
    isLoading.value = true
    try {
      const response = await fetch(`${API_URL}?weekStart=${weekStart.value}`, {
        headers: authService.authHeaders(),
      })
      if (!response.ok) throw new Error('Failed to load meal plan')
      const data = await response.json()
      // Convert slots array to key-value mealPlan format
      const plan = {}
      if (data.slots) {
        data.slots.forEach(s => {
          const key = `${s.dayIso}-${s.slot}`
          plan[key] = s.meals || []
        })
      }
      mealPlan.value = plan
      confirmedSnapshot.value = data.isConfirmed ? JSON.stringify(plan) : '{}'
    } catch (error) {
      console.error('loadMealPlan error:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Confirm the current meal plan: save to backend + reserve inventory
   */
  function confirmPlan(inv) {
    const totalMeals = Object.values(mealPlan.value).flat().length
    if (totalMeals === 0) {
      return { success: false, reservedCount: 0, weekLabel: weekLabel.value }
    }

    // Convert mealPlan object to slots array for API
    const slots = []
    Object.entries(mealPlan.value).forEach(([key, meals]) => {
      if (meals.length > 0) {
        const [dayIso, ...slotParts] = key.split('-')
        const slotName = slotParts.join('-')
        // dayIso format: "2026-05-19", slot parts could be "Breakfast" etc.
        // Actually the key format is "2026-05-19-Breakfast"
        const lastDash = key.lastIndexOf('-')
        const day = key.substring(0, lastDash)
        const slot = key.substring(lastDash + 1)
        slots.push({ dayIso: day, slot, meals })
      }
    })

    fetch(API_URL, {
        method: 'POST',
        headers: authService.authHeaders(),
        body: JSON.stringify({
          weekStart: weekStart.value,
          slots,
          isConfirmed: true,
        }),
      })
      .catch(error => {
        console.error('Failed to save meal plan:', error)
      })

    confirmedSnapshot.value = JSON.stringify(mealPlan.value)

    // Reserve matching inventory items
    const allIngredients = Object.values(mealPlan.value)
      .flat()
      .map(meal => meal.ingredient)
      .join(', ')
      .toLowerCase()

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
    isLoading,
    SLOTS,

    // Actions
    getMeals,
    addMeal,
    addRecipe,
    removeMeal,
    addInventoryToDay,
    confirmPlan,
    loadMealPlan,

    // Utilities (also exported for unit testing)
    getRecipeSuggestions,
    urgencyColor,
    getExpiringSuggestions,
    getWeekDays,
  }
}
