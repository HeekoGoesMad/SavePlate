import { ref } from 'vue'
import { authService } from './authService'

const API_URL = 'http://localhost:3000/api/donations'

export const allItems = ref([])
export const isLoading = ref(false)

const CURRENT_USER = () => authService.user.value?.name || 'User'

export async function fetchDonations() {
  isLoading.value = true
  try {
    const response = await fetch(API_URL, {
      headers: authService.authHeaders(),
    })
    if (!response.ok) throw new Error('Failed to fetch donations')
    const data = await response.json()
    allItems.value = data.map(d => normaliseDonation(d))
  } catch (error) {
    console.error('fetchDonations error:', error)
  } finally {
    isLoading.value = false
  }
}

export async function fetchMyDonations() {
  try {
    const response = await fetch(`${API_URL}/mine`, {
      headers: authService.authHeaders(),
    })
    if (!response.ok) throw new Error('Failed to fetch my donations')
    return (await response.json()).map(d => normaliseDonation(d))
  } catch (error) {
    console.error('fetchMyDonations error:', error)
    return []
  }
}

export async function createDonation(donationData) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: authService.authHeaders(),
    body: JSON.stringify(donationData),
  })
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.message || 'Failed to create donation')
  }
  const created = await response.json()
  allItems.value.unshift(normaliseDonation(created))
  return created
}

export async function claimItemById(id) {
  const response = await fetch(`${API_URL}/${id}/claim`, {
    method: 'PATCH',
    headers: authService.authHeaders(),
    body: JSON.stringify({ claimNote: '' }),
  })
  if (!response.ok) throw new Error('Failed to claim donation')
  const updated = await response.json()
  updateLocal(id, updated)
  return updated
}

export async function cancelClaimById(id) {
  const response = await fetch(`${API_URL}/${id}/cancel`, {
    method: 'PATCH',
    headers: authService.authHeaders(),
  })
  if (!response.ok) throw new Error('Failed to cancel claim')
  const updated = await response.json()
  updateLocal(id, updated)
  return updated
}

export async function confirmHandoverById(id) {
  const response = await fetch(`${API_URL}/${id}/complete`, {
    method: 'PATCH',
    headers: authService.authHeaders(),
  })
  if (!response.ok) throw new Error('Failed to complete handover')
  const updated = await response.json()
  updateLocal(id, updated)
  return updated
}

// Kept for backward compatibility
export function convertToDonationById(id) {}
export function cancelDonationById(id) {}
export function markAsUsedById(id) {
  const idx = allItems.value.findIndex(i => i.id === id)
  if (idx !== -1) allItems.value.splice(idx, 1)
}

// ── Helpers ──

const CATEGORY_ICONS = {
  Vegetables: '🥬', Dairy: '🥛', Canned: '🥫', Frozen: '🧊', Bakery: '🍞', Other: '📦',
}
const CATEGORY_BG = {
  Vegetables: '#f0faf0', Dairy: '#eff6ff', Canned: '#fff7ed', Frozen: '#f0f9ff', Bakery: '#fffbeb', Other: '#f8f8f8',
}

function normaliseDonation(d) {
  const expiryDate = d.expiryDate ? d.expiryDate.split('T')[0] : ''
  const daysLeft = Math.max(0, Math.round((new Date(expiryDate) - new Date()) / 86400000))
  const donorName = d.donorId?.name || CURRENT_USER()
  const claimedBy = d.claimedBy?.name || null
  const isOwn = d.donorId?._id === authService.user.value?.id || d.donorId === authService.user.value?.id

  return {
    id: d._id,
    name: d.name,
    qty: d.qty,
    storageLocation: d.pickupLocation || '',
    storageType: d.storageType || 'Pantry',
    address: d.pickupLocation || '',
    expiry: expiryDate,
    daysLeft,
    category: d.category || 'Other',
    icon: CATEGORY_ICONS[d.category] || '📦',
    bg: CATEGORY_BG[d.category] || '#f8f8f8',
    source: isOwn ? 'own' : 'donation',
    donorName,
    status: d.status || 'available',
    notes: d.notes || '',
    claimedBy,
    claimNote: d.claimNote || '',
    preferredPickup: d.preferredPickup || '',
  }
}

function updateLocal(id, serverData) {
  const idx = allItems.value.findIndex(i => i.id === id)
  if (idx !== -1) {
    allItems.value[idx] = normaliseDonation(serverData)
  }
}
