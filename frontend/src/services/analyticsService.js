import { ref, computed } from 'vue'
import { authService } from './authService'

const API_URL = 'http://localhost:3000/api/analytics'

// --- State ---
export const timePeriod = ref('30d')
export const selectedCategory = ref('All')
export const isLoading = ref(false)
export const showEmptyState = ref(false)

// Raw data from the backend
const rawData = ref(null)

export async function fetchAnalytics() {
  if (!authService.isLoggedIn.value) return
  isLoading.value = true
  try {
    const response = await fetch(API_URL, {
      headers: authService.authHeaders(),
    })
    if (!response.ok) throw new Error('Failed to fetch analytics')
    rawData.value = await response.json()
    showEmptyState.value = false
  } catch (error) {
    console.error('fetchAnalytics error:', error)
    rawData.value = null
  } finally {
    isLoading.value = false
  }
}

export const hasData = computed(() => {
  return !showEmptyState.value && rawData.value && rawData.value.totalItems > 0
})

export const filteredStats = computed(() => {
  if (!rawData.value) return { totalSaved: 0, donations: 0, wasteReduced: '0' }
  return {
    totalSaved: rawData.value.usedItems || 0,
    donations: rawData.value.donationsMade || 0,
    wasteReduced: rawData.value.wasteReduced || '0',
  }
})

export const comparisons = computed(() => {
  return {
    saved: rawData.value?.usedItems > 0 ? { value: rawData.value.usedItems, isPositive: true } : null,
    donations: rawData.value?.donationsMade > 0 ? { value: rawData.value.donationsMade, isPositive: true } : null,
  }
})

export const infoBoxes = computed(() => [
  {
    title: 'Items Saved',
    value: filteredStats.value.totalSaved,
    icon: '🥑',
    bgColor: '#f0faf0',
    color: '#2da12b',
    desc: 'Items rescued from waste',
    trend: comparisons.value.saved,
  },
  {
    title: 'Donations',
    value: filteredStats.value.donations,
    icon: '🤝',
    bgColor: '#eff6ff',
    color: '#3b82f6',
    desc: 'Meals safely donated',
    trend: comparisons.value.donations,
  },
  {
    title: 'Waste Reduced',
    value: filteredStats.value.wasteReduced + 'kg',
    icon: '♻️',
    bgColor: '#fdf4ff',
    color: '#c026d3',
    desc: 'Less into landfills',
  },
])

export const chartData = computed(() => {
  if (!rawData.value?.monthlyUsage) return []
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return rawData.value.monthlyUsage.map(d => ({
    label: months[d._id] || `M${d._id}`,
    value: d.count,
    maxValue: Math.max(10, d.count * 1.5),
  }))
})

export const badges = computed(() => {
  if (!rawData.value) return []
  const used = rawData.value.usedItems || 0
  const donated = rawData.value.donationsMade || 0
  return [
    { id: 1, title: '10 Items Saved', current: Math.min(used, 10), target: 10, achieved: used >= 10, icon: '🌟' },
    { id: 2, title: '5 Donations', current: Math.min(donated, 5), target: 5, achieved: donated >= 5, icon: '🤝' },
    { id: 3, title: '50 Items Saved', current: Math.min(used, 50), target: 50, achieved: used >= 50, icon: '🥑' },
  ]
})

export const impactStats = computed(() => {
  if (!rawData.value) return []
  return [
    { value: (rawData.value.co2Saved || 0) + ' kg', label: 'CO₂ Reduced', icon: '💨', bgColor: '#e0f2fe', color: '#0284c7' },
    { value: (rawData.value.waterSaved || 0) + ' L', label: 'Water Saved', icon: '💧', bgColor: '#dcfce7', color: '#16a34a' },
    { value: '$' + (rawData.value.moneySaved || 0), label: 'Money Saved', icon: '💰', bgColor: '#fef3c7', color: '#d97706' },
  ]
})

export function clearData() {
  showEmptyState.value = true
}

export function restoreData() {
  showEmptyState.value = false
}
