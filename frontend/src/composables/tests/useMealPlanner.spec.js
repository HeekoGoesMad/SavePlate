import { describe, it, expect, beforeEach } from 'vitest'
import { useMealPlanner } from '../useMealPlanner.js'

// ── Helper: fresh inventory for each test ──
function freshInventory() {
  return [
    { id: 1, name: 'Fresh Milk',    qty: '1L',    daysLeft: 1, category: 'Dairy',   isReserved: false },
    { id: 2, name: 'Spinach',       qty: '200g',  daysLeft: 2, category: 'Veggies', isReserved: false },
    { id: 3, name: 'Greek Yogurt',  qty: '500g',  daysLeft: 3, category: 'Dairy',   isReserved: false },
    { id: 4, name: 'Tomatoes',      qty: '4 pcs', daysLeft: 4, category: 'Veggies', isReserved: false },
    { id: 5, name: 'Chicken Thigh', qty: '300g',  daysLeft: 5, category: 'Protein', isReserved: false },
    { id: 6, name: 'Brown Rice',    qty: '500g',  daysLeft: 7, category: 'Grains',  isReserved: false },
    { id: 7, name: 'Cheddar',       qty: '150g',  daysLeft: 9, category: 'Dairy',   isReserved: false },
  ]
}

// Reset composable state before every test
let planner
beforeEach(() => {
  planner = useMealPlanner()
  planner.mealPlan.value = {}
  planner.confirmedSnapshot.value = '{}'
  planner.weekOffset.value = 0
  // Reset inventory to default state
  planner.inventory.value = freshInventory()
})

// =============================================================================
//  USER STORY M1 - Weekly Calendar View (FR-6.1) — Must Have
// =============================================================================
describe('US-M1 | Weekly Calendar View (FR-6.1)', () => {

  // ---------------------------------------------------------------------------
  it('[TC-58] getWeekDays returns exactly 7 days for the current week', () => {
    const days = planner.getWeekDays(0)
    expect(days.length).toBe(7)
  })

  // ---------------------------------------------------------------------------
  it('[TC-59] Each day object has required fields: name, date, iso, isToday', () => {
    const days = planner.getWeekDays(0)
    const REQUIRED = ['name', 'date', 'iso', 'isToday']
    days.forEach(d => {
      REQUIRED.forEach(field => {
        expect(d, `Day "${d.name}" is missing field "${field}"`).toHaveProperty(field)
      })
    })
  })

  // ---------------------------------------------------------------------------
  it('[TC-60] Exactly one day in the current week is marked isToday=true', () => {
    const days = planner.getWeekDays(0)
    const todayCount = days.filter(d => d.isToday).length
    expect(todayCount).toBe(1)
  })

  // ---------------------------------------------------------------------------
  it('[TC-61] SLOTS constant defines 4 meal types: Breakfast, Lunch, Dinner, Snacks', () => {
    expect(planner.SLOTS).toEqual(['Breakfast', 'Lunch', 'Dinner', 'Snacks'])
  })

  // ---------------------------------------------------------------------------
  it('[TC-62] getMeals returns an empty array for an unplanned slot', () => {
    const days = planner.getWeekDays(0)
    const result = planner.getMeals(days[0].iso, 'Breakfast')
    expect(result).toEqual([])
  })

  // ---------------------------------------------------------------------------
  it('[TC-63] weekDays computed returns 7 entries with weekOffset=0', () => {
    expect(planner.weekDays.value.length).toBe(7)
  })

  // ---------------------------------------------------------------------------
  it('[TC-64] weekLabel computed produces a readable date range string', () => {
    const label = planner.weekLabel.value
    expect(label).toContain('–')
    expect(label.length).toBeGreaterThan(10)
  })

})

// =============================================================================
//  USER STORY M2 - Add Meal (Custom + Recipe Suggestions) (FR-6.2) — Must Have
// =============================================================================
describe('US-M2 | Add Meal - Custom & Recipes (FR-6.2)', () => {

  // ---------------------------------------------------------------------------
  it('[TC-65] addMeal with a valid name returns success and correct message', () => {
    const day = planner.getWeekDays(0)[0].iso
    const result = planner.addMeal(day, 'Lunch', 'Grilled Chicken', 'Chicken Thigh')
    expect(result.success).toBe(true)
    expect(result.message).toContain('Grilled Chicken')
    expect(result.message).toContain('Lunch')
  })

  // ---------------------------------------------------------------------------
  it('[TC-66] addMeal places the meal in the correct day-slot key', () => {
    const day = planner.getWeekDays(0)[0].iso
    planner.addMeal(day, 'Breakfast', 'Omelette', 'Spinach')
    const meals = planner.getMeals(day, 'Breakfast')
    expect(meals.length).toBe(1)
    expect(meals[0].name).toBe('Omelette')
    expect(meals[0].ingredient).toBe('Spinach')
  })

  // ---------------------------------------------------------------------------
  it('[TC-67] addMeal with empty name returns failure', () => {
    const day = planner.getWeekDays(0)[0].iso
    const result = planner.addMeal(day, 'Lunch', '', 'Spinach')
    expect(result.success).toBe(false)
    expect(result.message).toBe('Meal name is required')
  })

  // ---------------------------------------------------------------------------
  it('[TC-68] addMeal with whitespace-only name returns failure', () => {
    const day = planner.getWeekDays(0)[0].iso
    const result = planner.addMeal(day, 'Dinner', '   ', '')
    expect(result.success).toBe(false)
  })

  // ---------------------------------------------------------------------------
  it('[TC-69] Multiple meals can be added to the same slot', () => {
    const day = planner.getWeekDays(0)[1].iso
    planner.addMeal(day, 'Snacks', 'Apple', 'Apple')
    planner.addMeal(day, 'Snacks', 'Yogurt', 'Greek Yogurt')
    const meals = planner.getMeals(day, 'Snacks')
    expect(meals.length).toBe(2)
  })

  // ---------------------------------------------------------------------------
  it('[TC-70] addRecipe with a valid recipe returns success', () => {
    const day = planner.getWeekDays(0)[2].iso
    const recipe = { name: 'Spinach Smoothie', uses: ['Spinach'] }
    const result = planner.addRecipe(day, 'Breakfast', recipe)
    expect(result.success).toBe(true)
    expect(result.message).toContain('Spinach Smoothie')
  })

  // ---------------------------------------------------------------------------
  it('[TC-71] addRecipe stores ingredient list as comma-separated string', () => {
    const day = planner.getWeekDays(0)[3].iso
    const recipe = { name: 'Chicken & Rice', uses: ['Chicken Thigh', 'Brown Rice'] }
    planner.addRecipe(day, 'Dinner', recipe)
    const meals = planner.getMeals(day, 'Dinner')
    expect(meals[0].ingredient).toBe('Chicken Thigh, Brown Rice')
  })

  // ---------------------------------------------------------------------------
  it('[TC-72] addRecipe with null recipe returns failure', () => {
    const day = planner.getWeekDays(0)[0].iso
    const result = planner.addRecipe(day, 'Lunch', null)
    expect(result.success).toBe(false)
  })

  // ---------------------------------------------------------------------------
  it('[TC-73] getRecipeSuggestions returns recipes sorted by expiry urgency', () => {
    const inv = freshInventory()
    const suggestions = planner.getRecipeSuggestions(inv)
    expect(suggestions.length).toBeGreaterThan(0)
    // Should be sorted: first suggestion has the lowest daysLeft
    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i].daysLeft).toBeGreaterThanOrEqual(suggestions[i - 1].daysLeft)
    }
  })

  // ---------------------------------------------------------------------------
  it('[TC-74] addMeal without ingredients defaults to "—"', () => {
    const day = planner.getWeekDays(0)[0].iso
    planner.addMeal(day, 'Breakfast', 'Plain Toast', '')
    const meals = planner.getMeals(day, 'Breakfast')
    expect(meals[0].ingredient).toBe('—')
  })

})

// =============================================================================
//  USER STORY M3 - Confirm & Save Plan / Reserve Inventory (FR-6.3)
// =============================================================================
describe('US-M3 | Confirm Plan & Reserve Inventory (FR-6.3)', () => {

  // ---------------------------------------------------------------------------
  it('[TC-75] hasChanges is false when meal plan matches the confirmed snapshot', () => {
    expect(planner.hasChanges.value).toBe(false)
  })

  // ---------------------------------------------------------------------------
  it('[TC-76] hasChanges becomes true after adding a meal', () => {
    const day = planner.getWeekDays(0)[0].iso
    planner.addMeal(day, 'Lunch', 'Salad', 'Spinach')
    expect(planner.hasChanges.value).toBe(true)
  })

  // ---------------------------------------------------------------------------
  it('[TC-77] confirmPlan with at least one meal returns success', () => {
    const inv = freshInventory()
    const day = planner.getWeekDays(0)[0].iso
    planner.addMeal(day, 'Dinner', 'Rice Bowl', 'Brown Rice')
    const result = planner.confirmPlan(inv)
    expect(result.success).toBe(true)
  })

  // ---------------------------------------------------------------------------
  it('[TC-78] confirmPlan with empty plan returns failure', () => {
    const inv = freshInventory()
    const result = planner.confirmPlan(inv)
    expect(result.success).toBe(false)
    expect(result.reservedCount).toBe(0)
  })

  // ---------------------------------------------------------------------------
  it('[TC-79] confirmPlan reserves matching inventory items (isReserved=true)', () => {
    const inv = freshInventory()
    const day = planner.getWeekDays(0)[0].iso
    planner.addMeal(day, 'Dinner', 'Spinach Pasta', 'Spinach')
    planner.confirmPlan(inv)
    const spinach = inv.find(i => i.name === 'Spinach')
    expect(spinach.isReserved).toBe(true)
  })

  // ---------------------------------------------------------------------------
  it('[TC-80] confirmPlan does not reserve items not in the plan', () => {
    const inv = freshInventory()
    const day = planner.getWeekDays(0)[0].iso
    planner.addMeal(day, 'Breakfast', 'Toast', 'Bread')
    planner.confirmPlan(inv)
    const cheddar = inv.find(i => i.name === 'Cheddar')
    expect(cheddar.isReserved).toBe(false)
  })

  // ---------------------------------------------------------------------------
  it('[TC-81] confirmPlan returns correct reservedCount', () => {
    const inv = freshInventory()
    const day = planner.getWeekDays(0)[0].iso
    planner.addMeal(day, 'Dinner', 'Chicken Rice', 'Chicken Thigh, Brown Rice')
    const result = planner.confirmPlan(inv)
    // "Chicken Thigh" and "Brown Rice" should both be reserved
    expect(result.reservedCount).toBe(2)
  })

  // ---------------------------------------------------------------------------
  it('[TC-82] hasChanges becomes false after confirmPlan', () => {
    const inv = freshInventory()
    const day = planner.getWeekDays(0)[0].iso
    planner.addMeal(day, 'Lunch', 'Salad', 'Spinach')
    expect(planner.hasChanges.value).toBe(true)
    planner.confirmPlan(inv)
    expect(planner.hasChanges.value).toBe(false)
  })

  // ---------------------------------------------------------------------------
  it('[TC-83] confirmPlan returns the current weekLabel', () => {
    const inv = freshInventory()
    const day = planner.getWeekDays(0)[0].iso
    planner.addMeal(day, 'Breakfast', 'Cereal', 'Fresh Milk')
    const result = planner.confirmPlan(inv)
    expect(result.weekLabel).toBe(planner.weekLabel.value)
  })

})

// =============================================================================
//  Remove Meal & Quick-Add Inventory
// =============================================================================
describe('US-M2 (cont.) | Remove Meal & Quick-Add (FR-6.2)', () => {

  // ---------------------------------------------------------------------------
  it('[TC-84] removeMeal removes the correct meal by index', () => {
    const day = planner.getWeekDays(0)[0].iso
    planner.addMeal(day, 'Lunch', 'Meal A', 'A')
    planner.addMeal(day, 'Lunch', 'Meal B', 'B')
    const result = planner.removeMeal(day, 'Lunch', 0)
    expect(result.success).toBe(true)
    expect(result.removedName).toBe('Meal A')
    const remaining = planner.getMeals(day, 'Lunch')
    expect(remaining.length).toBe(1)
    expect(remaining[0].name).toBe('Meal B')
  })

  // ---------------------------------------------------------------------------
  it('[TC-85] removeMeal with invalid index returns failure', () => {
    const day = planner.getWeekDays(0)[0].iso
    const result = planner.removeMeal(day, 'Dinner', 99)
    expect(result.success).toBe(false)
  })

  // ---------------------------------------------------------------------------
  it('[TC-86] addInventoryToDay adds a meal to the first empty slot', () => {
    const days = planner.getWeekDays(0)
    const today = days.find(d => d.isToday) || days[0]
    const item = { id: 1, name: 'Fresh Milk' }
    const result = planner.addInventoryToDay(item, today.iso)
    expect(result.success).toBe(true)
    expect(result.slot).toBe('Breakfast') // first empty slot
    expect(result.message).toContain('Fresh Milk')
  })

  // ---------------------------------------------------------------------------
  it('[TC-87] addInventoryToDay fails when all 4 slots are filled', () => {
    const day = planner.getWeekDays(0)[0].iso
    planner.SLOTS.forEach(slot => {
      planner.addMeal(day, slot, `Meal for ${slot}`, 'Filler')
    })
    const result = planner.addInventoryToDay({ id: 1, name: 'Milk' }, day)
    expect(result.success).toBe(false)
    expect(result.message).toContain('filled')
  })

})

// =============================================================================
//  USER STORY M4 - Expiry Suggestions (FR-6.4) — Could Have
// =============================================================================
describe('US-M4 | Expiry-Based Meal Suggestions (FR-6.4)', () => {

  // ---------------------------------------------------------------------------
  it('[TC-88] getExpiringSuggestions returns items expiring within threshold', () => {
    const inv = freshInventory()
    const suggestions = planner.getExpiringSuggestions(inv, {}, 2)
    // Fresh Milk (1d) and Spinach (2d) are within 2 days
    expect(suggestions.length).toBe(2)
    expect(suggestions.map(s => s.name)).toContain('Fresh Milk')
    expect(suggestions.map(s => s.name)).toContain('Spinach')
  })

  // ---------------------------------------------------------------------------
  it('[TC-89] getExpiringSuggestions excludes reserved items', () => {
    const inv = freshInventory()
    inv[0].isReserved = true // Reserve Fresh Milk
    const suggestions = planner.getExpiringSuggestions(inv, {}, 2)
    expect(suggestions.length).toBe(1)
    expect(suggestions[0].name).toBe('Spinach')
  })

  // ---------------------------------------------------------------------------
  it('[TC-90] getExpiringSuggestions excludes items already in meal plan', () => {
    const inv = freshInventory()
    const mealPlan = { '2026-01-01-Lunch': [{ name: 'Spinach Salad', ingredient: 'Spinach' }] }
    const suggestions = planner.getExpiringSuggestions(inv, mealPlan, 2)
    // Spinach is in the plan, so only Fresh Milk should be returned
    expect(suggestions.length).toBe(1)
    expect(suggestions[0].name).toBe('Fresh Milk')
  })

  // ---------------------------------------------------------------------------
  it('[TC-91] getExpiringSuggestions returns empty array when no items are near expiry', () => {
    const inv = freshInventory().map(i => ({ ...i, daysLeft: 10 }))
    const suggestions = planner.getExpiringSuggestions(inv, {}, 2)
    expect(suggestions.length).toBe(0)
  })

  // ---------------------------------------------------------------------------
  it('[TC-92] getExpiringSuggestions with threshold=0 returns only expired items', () => {
    const inv = freshInventory()
    inv.push({ id: 99, name: 'Old Bread', qty: '1', daysLeft: 0, category: 'Grains', isReserved: false })
    const suggestions = planner.getExpiringSuggestions(inv, {}, 0)
    expect(suggestions.length).toBe(1)
    expect(suggestions[0].name).toBe('Old Bread')
  })

})

// =============================================================================
//  Urgency Color Utility
// =============================================================================
describe('Utility | urgencyColor (Visual indicator)', () => {

  // ---------------------------------------------------------------------------
  it('[TC-93] urgencyColor returns red for items ≤ 2 days', () => {
    const result = planner.urgencyColor(1)
    expect(result.color).toBe('#ef4444')
  })

  // ---------------------------------------------------------------------------
  it('[TC-94] urgencyColor returns amber for items 3-4 days', () => {
    const result = planner.urgencyColor(3)
    expect(result.color).toBe('#f59e0b')
  })

  // ---------------------------------------------------------------------------
  it('[TC-95] urgencyColor returns green for items ≥ 5 days', () => {
    const result = planner.urgencyColor(7)
    expect(result.color).toBe('#22c55e')
  })

})
