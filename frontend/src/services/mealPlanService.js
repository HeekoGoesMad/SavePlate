import { authService } from './authService'

const API_URL = 'http://localhost:3000/api/meal-plan'

/**
 * Fetch the meal plan for a given ISO week start (Monday).
 * Returns { slots: [], isConfirmed: false } if none exists yet.
 */
export async function getMealPlan(weekStart) {
  const res = await fetch(`${API_URL}?weekStart=${weekStart}`, {
    headers: authService.authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch meal plan')
  return res.json()
}

/**
 * Save (upsert) the meal plan for a given week.
 * @param {string} weekStart  - ISO date string of Monday e.g. '2026-05-19'
 * @param {Array}  slots      - Array of { dayIso, slot, meals: [{name, ingredient}] }
 * @param {boolean} isConfirmed
 */
export async function saveMealPlan(weekStart, slots, isConfirmed = false) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: authService.authHeaders(),
    body: JSON.stringify({ weekStart, slots, isConfirmed }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.message || 'Failed to save meal plan')
  }
  return res.json()
}

/**
 * Delete a meal plan by its MongoDB _id.
 */
export async function deleteMealPlan(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: authService.authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete meal plan')
  return res.json()
}

/**
 * Convert a flat mealPlan object (key = "iso-slot", value = meals[])
 * into the slots array format required by the backend.
 */
export function flatPlanToSlots(flatPlan) {
  return Object.entries(flatPlan)
    .filter(([, meals]) => meals && meals.length > 0)
    .map(([key, meals]) => {
      const [dayIso, ...slotParts] = key.split('-')
      // key format: "2026-05-19-Breakfast" => dayIso="2026", but real format uses full ISO
      // Actual key is "YYYY-MM-DD-SlotName"
      const parts = key.split('-')
      const slot = parts.slice(3).join('-')          // e.g. "Breakfast"
      const day = parts.slice(0, 3).join('-')        // e.g. "2026-05-19"
      return { dayIso: day, slot, meals }
    })
}

/**
 * Convert a slots array from backend back to the flat mealPlan object
 * used internally in MealPlanner.vue.
 */
export function slotsToPlanMap(slots) {
  const map = {}
  for (const { dayIso, slot, meals } of (slots || [])) {
    if (meals && meals.length > 0) {
      map[`${dayIso}-${slot}`] = meals
    }
  }
  return map
}
