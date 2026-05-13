/**
 * browseFoodLogic.test.js
 *
 * Unit tests for BrowseFood.vue essential logic.
 * Validates User Stories 1–3 and Use Cases UC 1.2.1-11, -12, -13.
 *
 * Run:  npm run test
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  urgencyColor,
  urgencyLabel,
  filterItems,
  markAsUsed,
  addToMealPlan,
  submitClaim,
  cancelClaim,
} from '../logic/browseFoodLogic.js'

// ─── Shared test data ────────────────────────────────────────────────────────

function makeDummyItems() {
  return [
    {
      id: 1, name: 'Homemade Banana Bread', category: 'Bakery',
      source: 'donation', storageType: 'Pantry', daysLeft: 4,
      address: 'Jl. Sudirman No. 12, Jakarta', status: 'available',
    },
    {
      id: 2, name: 'Fresh Spinach Bunch', category: 'Vegetables',
      source: 'donation', storageType: 'Fridge', daysLeft: 2,
      address: 'Jl. Kebon Jeruk No. 5, Jakarta', status: 'available',
    },
    {
      id: 3, name: 'Greek Yogurt', category: 'Dairy',
      source: 'donation', storageType: 'Fridge', daysLeft: 3,
      address: 'Jl. Melawai Raya No. 8, Jakarta',
      status: 'reserved', claimedBy: 'Adrienne Kayana',
    },
    {
      id: 4, name: 'Cooked White Rice', category: 'Other',
      source: 'donation', storageType: 'Pantry', daysLeft: 1,
      address: 'Jl. Cempaka Putih No. 3, Jakarta', status: 'available',
    },
    {
      id: 101, name: 'Fresh Milk', category: 'Dairy',
      source: 'own', storageType: 'Fridge', daysLeft: 2,
      address: 'My Home – Jl. Anggrek No. 7, Jakarta', status: 'available',
    },
  ]
}

const CURRENT_USER = 'Adrienne Kayana'

// ─────────────────────────────────────────────────────────────────────────────
// UC 1.2.1-11  Browse & Filter food items  (User Story 1)
// ─────────────────────────────────────────────────────────────────────────────

describe('UC 1.2.1-11 – Browse & Filter Food Items', () => {

  let items

  beforeEach(() => {
    items = makeDummyItems()
  })

  // ── Positive Scenarios ───────────────────────────────────────────────────

  it('T1-01 [+] Returns all items when no filters are applied', () => {
    const result = filterItems(items)
    expect(result).toHaveLength(items.length)
  })

  it('T1-02 [+] Filter by category "Vegetables" returns only vegetable items', () => {
    const result = filterItems(items, { filterCategory: 'Vegetables' })
    expect(result.length).toBeGreaterThan(0)
    result.forEach(item => expect(item.category).toBe('Vegetables'))
  })

  it('T1-03 [+] Filter by storage type "Fridge" returns only refrigerated items', () => {
    const result = filterItems(items, { filterStorage: 'Fridge' })
    expect(result.length).toBeGreaterThan(0)
    result.forEach(item => expect(item.storageType).toBe('Fridge'))
  })

  it('T1-04 [+] Filter by expiry ≤ 3 days excludes items expiring later', () => {
    const result = filterItems(items, { filterExpiry: '3' })
    result.forEach(item => expect(item.daysLeft).toBeLessThanOrEqual(3))
  })

  it('T1-05 [+] Text search by food name returns matching items', () => {
    const result = filterItems(items, { searchQuery: 'spinach' })
    expect(result.length).toBeGreaterThan(0)
    result.forEach(item =>
      expect(item.name.toLowerCase()).toContain('spinach')
    )
  })

  // ── Negative Scenarios ───────────────────────────────────────────────────

  it('T1-06 [-] Filter combination with no matches returns an empty array', () => {
    // Frozen storage + Vegetables → none of the dummy items qualifies
    const result = filterItems(items, { filterStorage: 'Freezer', filterCategory: 'Vegetables' })
    expect(result).toHaveLength(0)
  })

  it('T1-07 [-] Text search for a non-existent food name returns an empty array', () => {
    const result = filterItems(items, { searchQuery: 'durian_xyz_nonexistent' })
    expect(result).toHaveLength(0)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// UC 1.2.1-12  View item details & contextual actions  (User Story 2)
// ─────────────────────────────────────────────────────────────────────────────

describe('UC 1.2.1-12 – Item Details & Contextual Actions', () => {

  // ── Urgency colour & label ────────────────────────────────────────────────

  it('T2-01 [+] urgencyColor returns red for items expiring in 1 day', () => {
    expect(urgencyColor(1)).toBe('#ef4444')
  })

  it('T2-02 [+] urgencyColor returns amber for items expiring in 2 days', () => {
    expect(urgencyColor(2)).toBe('#f59e0b')
  })

  it('T2-03 [+] urgencyColor returns green for items expiring in 7 days', () => {
    expect(urgencyColor(7)).toBe('#22c55e')
  })

  it('T2-04 [+] urgencyLabel returns "Expired" when daysLeft is 0', () => {
    expect(urgencyLabel(0)).toBe('Expired')
  })

  it('T2-05 [+] urgencyLabel returns "1 day left" when daysLeft is 1', () => {
    expect(urgencyLabel(1)).toBe('1 day left')
  })

  // ── Mark as Used ──────────────────────────────────────────────────────────

  it('T2-06 [+] markAsUsed removes the item from the inventory list', () => {
    const inventory = [
      { id: 201, name: 'Fresh Milk' },
      { id: 202, name: 'Sourdough Bread' },
    ]
    markAsUsed(inventory, { id: 201 })
    expect(inventory).toHaveLength(1)
    expect(inventory[0].id).toBe(202)
  })

  it('T2-07 [-] markAsUsed with a non-existent id leaves inventory unchanged', () => {
    const inventory = [{ id: 201, name: 'Fresh Milk' }]
    const removed = markAsUsed(inventory, { id: 999 })
    expect(removed).toBeNull()
    expect(inventory).toHaveLength(1)
  })

  // ── Meal Plan ───────────────────────────────────────────────────────

  it('T2-08 [+] addToMealPlan returns a confirmation message containing the item name', () => {
    const mealPlan = []
    const result = addToMealPlan(mealPlan, { id: 201, name: 'Fresh Milk' })
    expect(result.message).toContain('Fresh Milk')
  })

  it('T2-09 [+] addToMealPlan adds the item to the meal plan list when not already planned', () => {
    const mealPlan = []
    const result = addToMealPlan(mealPlan, { id: 201, name: 'Fresh Milk' })
    expect(result.alreadyPlanned).toBe(false)
    expect(mealPlan).toHaveLength(1)
    expect(mealPlan[0].id).toBe(201)
  })

  it('T2-10 [-] addToMealPlan does not add a duplicate when the item is already planned', () => {
    const mealPlan = [{ id: 201, name: 'Fresh Milk' }]
    const result = addToMealPlan(mealPlan, { id: 201, name: 'Fresh Milk' })
    expect(result.alreadyPlanned).toBe(true)
    expect(mealPlan).toHaveLength(1)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// UC 1.2.1-13  Claim / cancel a donation item  (User Story 3)
// ─────────────────────────────────────────────────────────────────────────────

describe('UC 1.2.1-13 – Claim & Cancel Donation Item', () => {

  let items

  beforeEach(() => {
    items = makeDummyItems()
  })

  // ── Positive Scenarios ───────────────────────────────────────────────────

  it('T3-01 [+] submitClaim sets item status to "reserved"', () => {
    const target = items.find(i => i.id === 1) // Banana Bread – available
    submitClaim(items, target, CURRENT_USER)
    expect(items.find(i => i.id === 1).status).toBe('reserved')
  })

  it('T3-02 [+] submitClaim records the claimedBy as current user', () => {
    const target = items.find(i => i.id === 1)
    submitClaim(items, target, CURRENT_USER)
    expect(items.find(i => i.id === 1).claimedBy).toBe(CURRENT_USER)
  })

  it('T3-03 [+] cancelClaim resets item status back to "available"', () => {
    // Item 3 is already reserved by CURRENT_USER
    const target = items.find(i => i.id === 3)
    cancelClaim(items, target)
    expect(items.find(i => i.id === 3).status).toBe('available')
  })

  it('T3-04 [+] cancelClaim clears the claimedBy field', () => {
    const target = items.find(i => i.id === 3)
    cancelClaim(items, target)
    expect(items.find(i => i.id === 3).claimedBy).toBeUndefined()
  })

  // ── Negative Scenarios ───────────────────────────────────────────────────

  it('T3-05 [-] submitClaim returns false for a non-existent item id', () => {
    const result = submitClaim(items, { id: 9999 }, CURRENT_USER)
    expect(result).toBe(false)
  })

  it('T3-06 [-] submitClaim does not affect other items in the list', () => {
    const target = items.find(i => i.id === 1)
    submitClaim(items, target, CURRENT_USER)
    // item 2 should remain untouched
    expect(items.find(i => i.id === 2).status).toBe('available')
    expect(items.find(i => i.id === 2).claimedBy).toBeUndefined()
  })

})
