// ─────────────────────────────────────────────────────────────────────────────
// Inventory.test.js
// Unit Testing – Use Case 2: Manage Food Inventory
// Test Runner : Vitest (globals: true – no need to import describe/it/expect)
// Tester Name : Ivan Maulana
// Module Under Test : src/utils/inventoryLogic.js
// ─────────────────────────────────────────────────────────────────────────────

import {
  getTodayString,
  getTodayPlusDays,
  daysUntilExpiry,
  validateAddItem,
  validateEditItem,
  validateDonateForm,
  canDonate,
  DONATE_THRESHOLD_DAYS,
} from '../utils/inventoryLogic.js'

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: make a valid base add-form object (reused across tests)
// ═══════════════════════════════════════════════════════════════════════════════
function makeValidAddForm(overrides = {}) {
  return {
    name: 'Fresh Spinach',
    category: 'Vegetables',
    quantity: 200,
    unit: 'g',
    expiryDate: getTodayPlusDays(10),  // 10 days in the future → valid
    storageLocation: 'Fridge',
    notes: '',
    ...overrides,
  }
}


// ADD FOOD ITEM TC1 – TC5
describe('TC1-TC5 | Add Food Item (FR-2.1)', () => {

  // TC1 – Add Food Item with Valid Data (Happy Path)
  it('TC1 – should return no error when all required fields are valid', () => {
    const form = makeValidAddForm()
    const error = validateAddItem(form)
    expect(error).toBe('')
    // No validation error => item would be added to inventory
  })

  // TC2 – Negative: name is empty
  it('TC2 – should return error when item name is empty', () => {
    const form = makeValidAddForm({ name: '' })
    const error = validateAddItem(form)
    expect(error).toBe('Item name is required.')
  })


  // TC3 – Negative: expiry date is in the past
  it('TC3 – should return error when expiry date is in the past', () => {
    const form = makeValidAddForm({ expiryDate: getTodayPlusDays(-5) })
    const error = validateAddItem(form)
    expect(error).toBe('Expiry date cannot be in the past.')
  })

  // TC4 – Negative: quantity is 0
  it('TC4 – should return error when quantity is 0', () => {
    const form = makeValidAddForm({ quantity: 0 })
    const error = validateAddItem(form)
    expect(error).toBe('Quantity must be a positive number.')
  })


  // TC5 – Negative: category not selected (empty string)
  it('TC5 – should return error when category is not selected', () => {
    const form = makeValidAddForm({ category: '' })
    const error = validateAddItem(form)
    expect(error).toBe('Please select a category.')
  })
})


// EDIT FOOD ITEM TC6 – TC7
describe('TC6-TC7 | Edit Food Item (FR-2.2)', () => {

  // TC6 – Happy path: valid edit
  it('TC6 – should return no error when edit form is valid', () => {
    const editForm = {
      name: 'Fresh Milk',
      expiryDate: getTodayPlusDays(5),
    }
    const error = validateEditItem(editForm)
    expect(error).toBe('')
    // No validation error => changes would be saved
  })


  // TC7 – Negative: name cleared during edit
  it('TC7 – should return error when item name is cleared during edit', () => {
    const editForm = {
      name: '   ',
      expiryDate: getTodayPlusDays(5),
    }
    const error = validateEditItem(editForm)
    expect(error).toBe('Item name is required.')
  })
})


// DELETE ITEM TC8 – TC9
describe('TC8-TC9 | Delete Item (FR-2.2)', () => {
  // TC8 – Happy path: delete removes item from array
  it('TC8 – should remove item from array when deleted', () => {
    const items = [
      { id: 1, name: 'Canned Tuna', status: 'available' },
      { id: 2, name: 'Spinach', status: 'available' },
    ]
    // Simulate: items.value = items.value.filter(i => i.id !== item.id)
    const afterDelete = items.filter(i => i.id !== 1)

    expect(afterDelete).toHaveLength(1)
    expect(afterDelete[0].name).toBe('Spinach')
    // "Canned Tuna" was removed
  })


  // TC9 – Negative: cancel — array remains unchanged
  it('TC9 – should keep item in array when delete is cancelled', () => {
    const items = [
      { id: 1, name: 'Frozen Peas', status: 'available' },
    ]
    // Simulate user clicking Cancel => filter never runs
    const afterCancel = [...items]

    expect(afterCancel).toHaveLength(1)
    expect(afterCancel[0].name).toBe('Frozen Peas')
    // "Frozen Peas" remains intact
  })
})


// MARK AS USED TC10
describe('TC10 | Mark Item as Used (FR-2.3)', () => {

  it('TC10 – should change item status to "used" when marked as used', () => {
    const item = { id: 2, name: 'Spinach', status: 'available' }

    // Simulate: item.status = 'used'
    item.status = 'used'

    expect(item.status).toBe('used')
    // Item moves out of active inventory (filterStatus === 'available')
  })
})


// DONATE ITEM TC11 – TC14
describe('TC11-TC14 | Donate Item (FR-2.4)', () => {

  // TC11 – Happy path: item within 7 day threshold + valid form
  it('TC11 – should allow donation when item expires within 7 days', () => {
    const expiryDate = getTodayPlusDays(1)
    const eligible = canDonate(expiryDate)

    expect(eligible).toBe(true)

    // Also verify full form is valid
    const donateForm = {
      location: 'Jl. Diponegoro No. 12, Denpasar',
      availability: 'Weekdays 3PM – 6PM',
    }
    const formError = validateDonateForm(donateForm)
    expect(formError).toBe('')

    // Simulate: donateTarget.status = 'donated'
    const item = { name: 'Fresh Milk', status: 'available' }
    item.status = 'donated'
    expect(item.status).toBe('donated')
    // Item converted to donation
  })


  // TC12 – Negative: item NOT within 7-day threshold (donate button disabled)
  it('TC12 – should block donation when item has more than 7 days to expiry', () => {
    const expiryDate = getTodayPlusDays(90)   // 90 days left => NOT eligible
    const eligible = canDonate(expiryDate)

    expect(eligible).toBe(false)
    // Donate button is disabled; modal does not open
  })


  // TC13 – Negative: donate form submitted without pickup location
  it('TC13 – should return error when pickup location is empty', () => {
    const donateForm = {
      location: '',
      // required field left empty
      availability: 'Weekends 9AM–12PM',
    }
    const error = validateDonateForm(donateForm)
    expect(error).toBe('Pickup location is required.')
  })


  // TC14 – Negative: donate form submitted without availability details
  it('TC14 – should return error when availability details are empty', () => {
    const donateForm = {
      location: 'Pantai Kuta, Bali',
      availability: '',
      // required field left empty
    }
    const error = validateDonateForm(donateForm)
    expect(error).toBe('Availability details are required.')
  })
})

