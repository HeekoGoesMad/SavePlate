import { ref } from 'vue'
import { authService } from './authService'

const _BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const API_URL = _BASE + '/items'

export const items = ref([])
export const isLoading = ref(false)

// ── Date helpers ──
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

// ── API calls ──

export async function fetchItems() {
  isLoading.value = true
  try {
    const response = await fetch(API_URL, {
      headers: authService.authHeaders(),
    })
    if (!response.ok) throw new Error('Failed to fetch items')
    const data = await response.json()
    // Normalise _id → id and expiryDate to string
    items.value = data.map(item => ({
      ...item,
      id: item._id,
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
    }))
  } catch (error) {
    console.error('fetchItems error:', error)
    throw error
  } finally {
    isLoading.value = false
  }
}

export async function addItem(newItem) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: authService.authHeaders(),
    body: JSON.stringify(newItem),
  })
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.message || 'Failed to add item')
  }
  const created = await response.json()
  items.value.push({
    ...created,
    id: created._id,
    expiryDate: created.expiryDate ? created.expiryDate.split('T')[0] : '',
  })
  return created
}

export async function updateItem(updatedItem) {
  const itemId = updatedItem.id || updatedItem._id
  const response = await fetch(`${API_URL}/${itemId}`, {
    method: 'PUT',
    headers: authService.authHeaders(),
    body: JSON.stringify(updatedItem),
  })
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.message || 'Failed to update item')
  }
  const updated = await response.json()
  const idx = items.value.findIndex(i => (i.id || i._id) === itemId)
  if (idx !== -1) {
    items.value[idx] = {
      ...updated,
      id: updated._id,
      expiryDate: updated.expiryDate ? updated.expiryDate.split('T')[0] : '',
    }
  }
  return updated
}

export async function deleteItem(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: authService.authHeaders(),
  })
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.message || 'Failed to delete item')
  }
  items.value = items.value.filter(i => (i.id || i._id) !== id)
}

export async function markAsUsed(id) {
  const response = await fetch(`${API_URL}/${id}/status`, {
    method: 'PATCH',
    headers: authService.authHeaders(),
    body: JSON.stringify({ status: 'used' }),
  })
  if (!response.ok) throw new Error('Failed to update status')
  const updated = await response.json()
  const idx = items.value.findIndex(i => (i.id || i._id) === id)
  if (idx !== -1) {
    items.value[idx] = {
      ...updated,
      id: updated._id,
      expiryDate: updated.expiryDate ? updated.expiryDate.split('T')[0] : '',
    }
  }
}

export async function donateItem(id) {
  const response = await fetch(`${API_URL}/${id}/status`, {
    method: 'PATCH',
    headers: authService.authHeaders(),
    body: JSON.stringify({ status: 'donated' }),
  })
  if (!response.ok) throw new Error('Failed to update status')
  const updated = await response.json()
  const idx = items.value.findIndex(i => (i.id || i._id) === id)
  if (idx !== -1) {
    items.value[idx] = {
      ...updated,
      id: updated._id,
      expiryDate: updated.expiryDate ? updated.expiryDate.split('T')[0] : '',
    }
  }
}

export async function reserveItem(id) {
  const response = await fetch(`${API_URL}/${id}/status`, {
    method: 'PATCH',
    headers: authService.authHeaders(),
    body: JSON.stringify({ status: 'reserved' }),
  })
  if (!response.ok) throw new Error('Failed to reserve item')
  const updated = await response.json()
  const idx = items.value.findIndex(i => (i.id || i._id) === id)
  if (idx !== -1) {
    items.value[idx] = {
      ...updated,
      id: updated._id,
      expiryDate: updated.expiryDate ? updated.expiryDate.split('T')[0] : '',
    }
  }
  return updated
}

export async function unreserveItem(id) {
  const response = await fetch(`${API_URL}/${id}/status`, {
    method: 'PATCH',
    headers: authService.authHeaders(),
    body: JSON.stringify({ status: 'available' }),
  })
  if (!response.ok) throw new Error('Failed to unreserve item')
  const updated = await response.json()
  const idx = items.value.findIndex(i => (i.id || i._id) === id)
  if (idx !== -1) {
    items.value[idx] = {
      ...updated,
      id: updated._id,
      expiryDate: updated.expiryDate ? updated.expiryDate.split('T')[0] : '',
    }
  }
  return updated
}
