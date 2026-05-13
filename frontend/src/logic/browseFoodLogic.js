/**
 * browseFoodLogic.js
 * Pure logic functions extracted from BrowseFood.vue.
 * These are framework-agnostic so they can be unit-tested with Vitest.
 *
 * UC 1.2.1-11  Browse & Filter food items
 * UC 1.2.1-12  View item details & take contextual actions
 * UC 1.2.1-13  Claim / cancel a donation item
 */

// ---------------------------------------------------------------------------
// UC 1.2.1-12 — Urgency helpers
// ---------------------------------------------------------------------------

/**
 * Returns a hex colour code based on how soon an item expires.
 * Red  ≤ 1 day | Amber = 2 days | Green ≥ 3 days
 */
export function urgencyColor(daysLeft) {
  if (daysLeft <= 1) return '#ef4444'
  if (daysLeft <= 2) return '#f59e0b'
  return '#22c55e'
}

/**
 * Returns a human-readable urgency label.
 */
export function urgencyLabel(daysLeft) {
  if (daysLeft <= 0) return 'Expired'
  if (daysLeft === 1) return '1 day left'
  return `${daysLeft} days left`
}

// ---------------------------------------------------------------------------
// UC 1.2.1-12 — Date helper
// ---------------------------------------------------------------------------

/**
 * Computes how many days remain until an expiry date string (YYYY-MM-DD).
 * Returns a negative number if the date has passed.
 */
export function computeDaysLeft(expiryDateStr) {
  if (!expiryDateStr) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDateStr)
  expiry.setHours(0, 0, 0, 0)
  return Math.round((expiry - today) / (1000 * 60 * 60 * 24))
}

// ---------------------------------------------------------------------------
// UC 1.2.1-11 — Filter & sort
// ---------------------------------------------------------------------------

/**
 * Filters and sorts a list of food items according to user-selected criteria.
 *
 * @param {Array}  items   - raw item array (plain objects, not reactive)
 * @param {Object} filters
 *   @param {string} filters.searchQuery    - free-text search (name/category/address)
 *   @param {string} filters.filterCategory - exact category label or '' for all
 *   @param {string} filters.filterExpiry   - max daysLeft as string ('1'|'3'|'7') or ''
 *   @param {string} filters.filterStorage  - 'Fridge'|'Freezer'|'Pantry' or ''
 *   @param {string} filters.sortBy         - 'expiry' | 'name'
 * @returns {Array} filtered (and sorted) subset of items
 */
export function filterItems(items, filters = {}) {
  const {
    searchQuery    = '',
    filterCategory = '',
    filterExpiry   = '',
    filterStorage  = '',
    sortBy         = 'expiry',
  } = filters

  let result = items.filter(item => {
    const q         = searchQuery.toLowerCase()
    const matchText = !q
      || item.name.toLowerCase().includes(q)
      || item.category.toLowerCase().includes(q)
      || (item.address || '').toLowerCase().includes(q)

    const matchCat     = !filterCategory || item.category === filterCategory
    const matchExpiry  = !filterExpiry   || item.daysLeft <= parseInt(filterExpiry)
    const matchStorage = !filterStorage  || item.storageType === filterStorage

    return matchText && matchCat && matchExpiry && matchStorage
  })

  if (sortBy === 'expiry') result = [...result].sort((a, b) => a.daysLeft - b.daysLeft)
  if (sortBy === 'name')   result = [...result].sort((a, b) => a.name.localeCompare(b.name))

  return result
}

// ---------------------------------------------------------------------------
// UC 1.2.1-12 — Inventory actions
// ---------------------------------------------------------------------------

/**
 * Removes an item from the inventory array (mark-as-used).
 * Mutates the array in-place and returns the removed item or null.
 */
export function markAsUsed(inventory, item) {
  const idx = inventory.findIndex(i => i.id === item.id)
  if (idx !== -1) {
    return inventory.splice(idx, 1)[0]
  }
  return null
}

// ---------------------------------------------------------------------------
// UC 1.2.1-12 — Add to Meal Plan
// ---------------------------------------------------------------------------

/**
 * Adds an inventory item to the meal plan list.
 * Returns a confirmation message string, or null if the item is invalid.
 * Already-planned items are not added twice (idempotent guard).
 *
 * @param {Array}  mealPlan - current meal plan array (plain objects)
 * @param {Object} item     - the food item to add
 * @returns {{ message: string, alreadyPlanned: boolean } | null}
 */
export function addToMealPlan(mealPlan, item) {
  if (!item || !item.id) return null
  const alreadyPlanned = mealPlan.some(p => p.id === item.id)
  if (!alreadyPlanned) {
    mealPlan.push({ id: item.id, name: item.name })
  }
  return {
    message:       `${item.name} has been added to your meal plan.`,
    alreadyPlanned,
  }
}

// ---------------------------------------------------------------------------
// UC 1.2.1-13 — Claim & cancel
// ---------------------------------------------------------------------------

/**
 * Marks a donation item as claimed by currentUser.
 * Mutates the item inside allItems in-place.
 * Returns true if the item was found, false otherwise.
 */
export function submitClaim(allItems, item, currentUser) {
  const idx = allItems.findIndex(i => i.id === item.id)
  if (idx === -1) return false
  allItems[idx] = {
    ...allItems[idx],
    status:    'reserved',
    claimedBy: currentUser,
  }
  return true
}

/**
 * Cancels an existing claim, resetting the item back to 'available'.
 * Returns true if the item was found, false otherwise.
 */
export function cancelClaim(allItems, item) {
  const idx = allItems.findIndex(i => i.id === item.id)
  if (idx === -1) return false
  allItems[idx] = {
    ...allItems[idx],
    status:          'available',
    claimedBy:       undefined,
    preferredPickup: undefined,
    claimNote:       undefined,
  }
  return true
}
