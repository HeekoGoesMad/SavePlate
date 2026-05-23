// ─────────────────────────────────────────────────────────────────────────────
// inventoryLogic.js
// Pure business-logic functions extracted from Inventory.vue (Use Case 2).
// These functions have NO Vue reactivity or component dependencies,
// so they can be imported and tested directly with Vitest.
// ─────────────────────────────────────────────────────────────────────────────

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
export const CATEGORIES       = ['Vegetables', 'Dairy', 'Canned', 'Frozen', 'Bakery', 'Other']
export const STORAGE_LOCATIONS = ['Fridge', 'Freezer', 'Pantry']
export const UNITS             = ['pcs', 'g', 'kg', 'ml', 'L']
export const DONATE_THRESHOLD_DAYS = 7   // UC2: item must be ≤ 7 days to expiry

// ── DATE HELPERS ──────────────────────────────────────────────────────────────

/** Returns today as "YYYY-MM-DD" string */
export function getTodayString() {
  return new Date().toISOString().split('T')[0]
}

/** Returns a "YYYY-MM-DD" string n days from today (negative = past) */
export function getTodayPlusDays(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

/** Returns integer days remaining until expiry (negative = already expired) */
export function daysUntilExpiry(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(dateStr)
  return Math.round((expiry - today) / (1000 * 60 * 60 * 24))
}

// ── VALIDATION: ADD ITEM (FR-2.1) ─────────────────────────────────────────────
/**
 * Validates the Add Item form object.
 * @param {object} item - { name, category, quantity, expiryDate }
 * @returns {string} error message, or '' if valid
 */
export function validateAddItem(item) {
  if (!item.name || !item.name.trim())
    return 'Item name is required.'
  if (!item.category)
    return 'Please select a category.'
  if (!item.quantity || Number(item.quantity) <= 0)
    return 'Quantity must be a positive number.'
  if (!item.expiryDate)
    return 'Expiry date is required.'
  if (item.expiryDate < getTodayString())
    return 'Expiry date cannot be in the past.'
  return ''
}

// ── VALIDATION: EDIT ITEM (FR-2.2) ────────────────────────────────────────────
/**
 * Validates the Edit Item form object.
 * @param {object} item - { name, expiryDate }
 * @returns {string} error message, or '' if valid
 */
export function validateEditItem(item) {
  if (!item.name || !item.name.trim())
    return 'Item name is required.'
  if (!item.expiryDate)
    return 'Expiry date is required.'
  if (item.expiryDate < getTodayString())
    return 'Expiry date cannot be in the past.'
  return ''
}

// ── VALIDATION: DONATE FORM (FR-2.4) ──────────────────────────────────────────
/**
 * Validates the Donate form object.
 * @param {object} form - { location, availability }
 * @returns {string} error message, or '' if valid
 */
export function validateDonateForm(form) {
  if (!form.location || !form.location.trim())
    return 'Pickup location is required.'
  if (!form.availability || !form.availability.trim())
    return 'Availability details are required.'
  return ''
}

// ── DONATE ELIGIBILITY (UC2 poin 7) ───────────────────────────────────────────
/**
 * Returns true if the item is eligible for donation (≤ 7 days to expiry).
 * @param {string} expiryDate - "YYYY-MM-DD"
 * @returns {boolean}
 */
export function canDonate(expiryDate) {
  return daysUntilExpiry(expiryDate) <= DONATE_THRESHOLD_DAYS
}
