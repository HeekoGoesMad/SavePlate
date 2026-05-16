import { ref } from 'vue'

const CURRENT_USER = 'Adrienne Kayana'

export const allItems = ref([
  {
    id: 1, name: 'Homemade Banana Bread', qty: '1 loaf',
    storageLocation: 'Counter (room temp)', storageType: 'Pantry',
    address: 'Jl. Sudirman No. 12, Jakarta',
    expiry: '2026-04-28', daysLeft: 6,
    category: 'Bakery', icon: '🍞', bg: '#fffbeb',
    source: 'donation', donorName: 'Budi Santoso',
    status: 'available',
    notes: 'Freshly baked this morning. No nuts, no preservatives.',
  },
  {
    id: 2, name: 'Fresh Spinach Bunch', qty: '300g',
    storageLocation: 'Refrigerator', storageType: 'Fridge',
    address: 'Jl. Kebon Jeruk No. 5, Jakarta',
    expiry: '2026-04-24', daysLeft: 2,
    category: 'Vegetables', icon: '🥬', bg: '#f0faf0',
    source: 'donation', donorName: 'Siti Rahma',
    status: 'available',
    notes: 'Organic, washed and ready to cook.',
  },
  {
    id: 3, name: 'Greek Yogurt', qty: '2 cups (500g)',
    storageLocation: 'Refrigerator', storageType: 'Fridge',
    address: 'Jl. Melawai Raya No. 8, Jakarta',
    expiry: '2026-04-25', daysLeft: 3,
    category: 'Dairy', icon: '🥛', bg: '#eff6ff',
    source: 'donation', donorName: 'Rina Hartati',
    status: 'reserved', claimedBy: CURRENT_USER,
    preferredPickup: 'Tomorrow, 10am – 12pm',
    claimNote: 'I will pick up in the morning.',
    notes: 'Plain, full-fat. Unopened.',
  },
  {
    id: 4, name: 'Cooked White Rice', qty: '4 portions',
    storageLocation: 'Counter (room temp)', storageType: 'Pantry',
    address: 'Jl. Cempaka Putih No. 3, Jakarta',
    expiry: '2026-04-23', daysLeft: 1,
    category: 'Other', icon: '🍚', bg: '#f8f8f8',
    source: 'donation', donorName: 'Ahmad Fauzi',
    status: 'available',
    notes: 'Cooked this afternoon. Still warm.',
  },
  {
    id: 5, name: 'Ripe Mangoes', qty: '6 pieces',
    storageLocation: 'Counter (room temp)', storageType: 'Pantry',
    address: 'Jl. Tebet Barat No. 20, Jakarta',
    expiry: '2026-04-25', daysLeft: 3,
    category: 'Other', icon: '🥭', bg: '#f8f8f8',
    source: 'donation', donorName: 'Dewi Lestari',
    status: 'reserved', claimedBy: 'Another User',
    notes: 'Very sweet Harum Manis variety.',
  },
  {
    id: 6, name: 'Chicken Egg (Free Range)', qty: '12 eggs',
    storageLocation: 'Refrigerator', storageType: 'Fridge',
    address: 'Jl. Fatmawati No. 15, Jakarta',
    expiry: '2026-04-29', daysLeft: 7,
    category: 'Other', icon: '🥚', bg: '#f8f8f8',
    source: 'donation', donorName: 'Hendra Wijaya',
    status: 'available',
    notes: 'Free-range eggs from local farm.',
  },
  // ── My Inventory Items ──
  {
    id: 101, name: 'Fresh Milk', qty: '1L',
    storageLocation: 'Refrigerator', storageType: 'Fridge',
    address: 'My Home – Jl. Anggrek No. 7, Jakarta',
    expiry: '2026-04-24', daysLeft: 2,
    category: 'Dairy', icon: '🥛', bg: '#eff6ff',
    source: 'own', donorName: CURRENT_USER,
    status: 'available',
    notes: 'Full cream, unopened. Pick up before 8pm.',
  },
  {
    id: 202, name: 'Sourdough Bread', qty: '1 loaf',
    storageLocation: 'Counter (room temp)', storageType: 'Pantry',
    address: 'My Home – Jl. Anggrek No. 7, Jakarta',
    expiry: '2026-04-25', daysLeft: 3,
    category: 'Bakery', icon: '🍞', bg: '#fffbeb',
    source: 'own', donorName: CURRENT_USER,
    status: 'available',
    notes: 'Half loaf remaining.',
  },
  {
    id: 203, name: 'Strawberries', qty: '250g',
    storageLocation: 'Refrigerator', storageType: 'Fridge',
    address: 'My Home – Jl. Anggrek No. 7, Jakarta',
    expiry: '2026-04-26', daysLeft: 4,
    category: 'Other', icon: '🍓', bg: '#f8f8f8',
    source: 'own', donorName: CURRENT_USER,
    status: 'available',
    notes: 'Fresh from the market.',
  },
])

export function claimItemById(id, currentUser) {
  const item = allItems.value.find(i => i.id === id)
  if (item) {
    item.status = 'reserved'
    item.claimedBy = currentUser
  }
}

export function cancelClaimById(id) {
  const item = allItems.value.find(i => i.id === id)
  if (item) {
    item.status = 'available'
    item.claimedBy = undefined
    item.preferredPickup = undefined
    item.claimNote = undefined
  }
}

export function confirmHandoverById(id) {
  const item = allItems.value.find(i => i.id === id)
  if (item) {
    item.status = 'completed'
  }
}

export function convertToDonationById(id) {
  const item = allItems.value.find(i => i.id === id)
  if (item) {
    item.source = 'donation'
    item.convertedFromOwn = true
  }
}

export function cancelDonationById(id) {
  const item = allItems.value.find(i => i.id === id)
  if (item) {
    item.source = 'own'
    item.convertedFromOwn = undefined
  }
}

export function markAsUsedById(id) {
  const idx = allItems.value.findIndex(i => i.id === id)
  if (idx !== -1) allItems.value.splice(idx, 1)
}
