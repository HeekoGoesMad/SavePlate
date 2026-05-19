import { ref, computed, watch } from 'vue'
import { authService } from './authService'

const API_URL = 'http://localhost:3000/api/analytics'

// ── Filters (bound to UI) ────────────────────────────────────────────────────
export const timePeriod       = ref('all')
export const selectedCategory = ref('All')

// ── Internal state ───────────────────────────────────────────────────────────
export const isLoading      = ref(false)
export const showEmptyState = ref(false)
const rawData               = ref(null)

// ── Auto-fetch when filters change ───────────────────────────────────────────
watch([timePeriod, selectedCategory], () => {
  fetchAnalytics()
})

// ── Fetch from backend ───────────────────────────────────────────────────────
export async function fetchAnalytics() {
  if (!authService.isLoggedIn.value) return
  isLoading.value = true
  try {
    const params = new URLSearchParams({
      period:   timePeriod.value,
      category: selectedCategory.value,
    })
    const response = await fetch(`${API_URL}?${params}`, {
      headers: authService.authHeaders(),
    })
    if (!response.ok) throw new Error('Failed to fetch analytics')
    rawData.value      = await response.json()
    showEmptyState.value = false
  } catch (error) {
    console.error('fetchAnalytics error:', error)
    rawData.value = null
  } finally {
    isLoading.value = false
  }
}

// ── hasData ──────────────────────────────────────────────────────────────────
export const hasData = computed(() => {
  return !showEmptyState.value && rawData.value && rawData.value.totalItems > 0
})

// ── Summary stats ────────────────────────────────────────────────────────────
export const filteredStats = computed(() => {
  if (!rawData.value) return { totalSaved: 0, donations: 0, wasteReduced: '0' }
  return {
    totalSaved:   rawData.value.usedItems     || 0,
    donations:    rawData.value.donationsMade || 0,
    wasteReduced: rawData.value.wasteReduced  || '0',
  }
})

export const comparisons = computed(() => ({
  saved:     rawData.value?.usedItems     > 0 ? { value: rawData.value.usedItems,     isPositive: true } : null,
  donations: rawData.value?.donationsMade > 0 ? { value: rawData.value.donationsMade, isPositive: true } : null,
}))

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
    value: filteredStats.value.wasteReduced + ' kg',
    icon: '♻️',
    bgColor: '#fdf4ff',
    color: '#c026d3',
    desc: 'Less into landfills',
  },
])

// ── Donut chart — category breakdown ─────────────────────────────────────────
const CATEGORY_COLORS = {
  Vegetables: '#2da12b',
  Fruits:     '#f59e0b',
  Dairy:      '#3b82f6',
  Canned:     '#ef4444',
  Frozen:     '#06b6d4',
  Bakery:     '#f97316',
  Other:      '#8b5cf6',
}
const CATEGORY_FALLBACK = ['#2da12b','#f59e0b','#3b82f6','#ef4444','#06b6d4','#f97316','#8b5cf6']

export const donutData = computed(() => {
  if (!rawData.value?.categoryBreakdown?.length) return []
  const total = rawData.value.categoryBreakdown.reduce((s, c) => s + c.count, 0)
  if (total === 0) return []
  return rawData.value.categoryBreakdown.map((c, i) => ({
    label:   c._id || 'Other',
    count:   c.count,
    percent: Math.round((c.count / total) * 100),
    color:   CATEGORY_COLORS[c._id] || CATEGORY_FALLBACK[i % CATEGORY_FALLBACK.length],
  }))
})

// Builds the CSS conic-gradient string for the donut
export const donutGradient = computed(() => {
  if (!donutData.value.length) return 'conic-gradient(#e8ede8 0% 100%)'
  let cursor = 0
  const stops = donutData.value.map(d => {
    const from = cursor
    cursor += d.percent
    return `${d.color} ${from}% ${cursor}%`
  })
  return `conic-gradient(${stops.join(', ')})`
})

// ── Bar chart — monthly items saved + donations ───────────────────────────────
const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildMonthKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`
}
function labelFromKey(key) {
  const [year, month] = key.split('-')
  return `${MONTHS[parseInt(month)]} '${String(year).slice(2)}`
}

export const chartData = computed(() => {
  if (!rawData.value) return []

  const usage     = rawData.value.monthlyUsage     || []
  const donations = rawData.value.monthlyDonations || []

  // Merge all months from both arrays
  const allKeys = new Set([
    ...usage.map(d     => buildMonthKey(d._id.year, d._id.month)),
    ...donations.map(d => buildMonthKey(d._id.year, d._id.month)),
  ])

  if (allKeys.size === 0) return []

  const usageMap     = Object.fromEntries(usage.map(d     => [buildMonthKey(d._id.year, d._id.month), d.count]))
  const donationMap  = Object.fromEntries(donations.map(d => [buildMonthKey(d._id.year, d._id.month), d.count]))

  const sorted = [...allKeys].sort()

  const allValues = sorted.flatMap(k => [usageMap[k] || 0, donationMap[k] || 0])
  const globalMax = Math.max(1, ...allValues)

  return sorted.map(key => ({
    label:         labelFromKey(key),
    savedValue:    usageMap[key]    || 0,
    donatedValue:  donationMap[key] || 0,
    maxValue:      globalMax,
  }))
})

// ── Badges ───────────────────────────────────────────────────────────────────
export const badges = computed(() => {
  if (!rawData.value) return []
  const used    = rawData.value.usedItems     || 0
  const donated = rawData.value.donationsMade || 0
  return [
    { id: 1, title: '10 Items Saved',  current: Math.min(used,    10), target: 10,  achieved: used    >= 10,  icon: '🌟' },
    { id: 2, title: '5 Donations',     current: Math.min(donated,  5), target: 5,   achieved: donated >=  5,  icon: '🤝' },
    { id: 3, title: '50 Items Saved',  current: Math.min(used,    50), target: 50,  achieved: used    >= 50,  icon: '🥑' },
  ]
})

// ── Impact stats ─────────────────────────────────────────────────────────────
export const impactStats = computed(() => {
  if (!rawData.value) return []
  return [
    { value: (rawData.value.co2Saved   || 0) + ' kg', label: 'CO₂ Reduced', icon: '💨', bgColor: '#e0f2fe', color: '#0284c7' },
    { value: (rawData.value.waterSaved || 0) + ' L',  label: 'Water Saved',  icon: '💧', bgColor: '#dcfce7', color: '#16a34a' },
    { value: '$' + (rawData.value.moneySaved || 0),   label: 'Money Saved',  icon: '💰', bgColor: '#fef3c7', color: '#d97706' },
  ]
})

// ── Dev helpers ──────────────────────────────────────────────────────────────
export function clearData()   { showEmptyState.value = true  }
export function restoreData() { showEmptyState.value = false }
