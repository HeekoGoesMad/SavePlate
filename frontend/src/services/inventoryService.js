import { ref } from 'vue'

export function getTodayPlusDays(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

export function getTodayString() {
  return new Date().toISOString().split('T')[0]
}

export function daysUntilExpiry(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(dateStr)
  return Math.round((expiry - today) / (1000 * 60 * 60 * 24))
}

export function getExpiryStatus(item) {
  if (item.status === 'used') return { label: 'Used', color: '#6b7280', bgColor: '#f3f4f6' }
  const days = daysUntilExpiry(item.expiryDate)
  if (days < 0) return { label: 'Expired', color: '#dc2626', bgColor: '#fef2f2' }
  if (days === 0) return { label: 'Expires Today', color: '#f59e0b', bgColor: '#fffbeb' }
  if (days <= 3) return { label: `${days}d left`, color: '#f59e0b', bgColor: '#fffbeb' }
  return { label: `${days}d left`, color: '#22c55e', bgColor: '#f0fdf4' }
}

export const items = ref([
  {
    id: 1,
    name: 'Fresh Milk',
    category: 'Dairy',
    quantity: 1,
    unit: 'L',
    expiryDate: getTodayPlusDays(1),
    storageLocation: 'Fridge',
    status: 'available',
    notes: 'Opened on April 18',
  },
  {
    id: 2,
    name: 'Spinach',
    category: 'Vegetables',
    quantity: 200,
    unit: 'g',
    expiryDate: getTodayPlusDays(2),
    storageLocation: 'Fridge',
    status: 'available',
    notes: '',
  },
  {
    id: 3,
    name: 'Greek Yogurt',
    category: 'Dairy',
    quantity: 500,
    unit: 'g',
    expiryDate: getTodayPlusDays(4),
    storageLocation: 'Fridge',
    status: 'available',
    notes: '',
  },
  {
    id: 4,
    name: 'Canned Tuna',
    category: 'Canned',
    quantity: 3,
    unit: 'pcs',
    expiryDate: getTodayPlusDays(90),
    storageLocation: 'Pantry',
    status: 'available',
    notes: '',
  },
  {
    id: 5,
    name: 'Frozen Peas',
    category: 'Frozen',
    quantity: 400,
    unit: 'g',
    expiryDate: getTodayPlusDays(30),
    storageLocation: 'Freezer',
    status: 'available',
    notes: '',
  },
])

export function addItem(newItem) {
  items.value.push({
    ...newItem,
    id: Date.now(),
    status: 'available',
  })
}

export function updateItem(updatedItem) {
  const idx = items.value.findIndex(i => i.id === updatedItem.id)
  if (idx !== -1) {
    items.value[idx] = { ...updatedItem }
  }
}

export function deleteItem(id) {
  items.value = items.value.filter(i => i.id !== id)
}

export function markAsUsed(id) {
  const item = items.value.find(i => i.id === id)
  if (item) item.status = 'used'
}

export function donateItem(id) {
  const item = items.value.find(i => i.id === id)
  if (item) item.status = 'donated'
}
