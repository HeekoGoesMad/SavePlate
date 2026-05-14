import { ref, computed } from 'vue'

// --- State ---
export const timePeriod = ref('30d') // '7d', '30d', 'all'
export const selectedCategory = ref('All')

// Mock raw data
const mockRawData = ref({
  totalSaved: 1240,
  donations: 85,
  wasteReduced: 45, // kg
  badges: [
    { id: 1, title: '10 Items Saved', current: 10, target: 10, achieved: true, icon: '🌟' },
    { id: 2, title: '5 Donations', current: 5, target: 5, achieved: true, icon: '🤝' },
    { id: 3, title: '50 Items Saved', current: 32, target: 50, achieved: false, icon: '🥑' },
  ],
  monthlyData: [
    { month: 'Jan', usage: 40, donations: 5 },
    { month: 'Feb', usage: 50, donations: 8 },
    { month: 'Mar', usage: 45, donations: 12 },
    { month: 'Apr', usage: 60, donations: 15 },
    { month: 'May', usage: 55, donations: 20 },
    { month: 'Jun', usage: 70, donations: 25 },
  ],
  lastPeriodStats: {
    totalSaved: 1100, // For comparison
    donations: 70
  }
})

// Feature flag / toggle to demonstrate empty state
export const showEmptyState = ref(false)

// --- Computed Properties ---

export const hasData = computed(() => {
  return !showEmptyState.value && mockRawData.value.totalSaved > 0
})

export const filteredStats = computed(() => {
  // Simulate filtering logic based on selectedCategory and timePeriod
  let multiplier = 1
  if (timePeriod.value === '7d') multiplier = 0.25
  if (timePeriod.value === '30d') multiplier = 1
  if (timePeriod.value === 'all') multiplier = 5
  
  if (selectedCategory.value !== 'All') {
      multiplier *= 0.4
  }

  return {
    totalSaved: Math.round(mockRawData.value.totalSaved * multiplier),
    donations: Math.round(mockRawData.value.donations * multiplier),
    wasteReduced: (mockRawData.value.wasteReduced * multiplier).toFixed(1),
  }
})

// FR-4.3 Period comparison
export const comparisons = computed(() => {
  if (timePeriod.value === 'all') return { saved: null, donations: null }
  
  // Simulated % change based on selected period
  let savedVal = timePeriod.value === '7d' ? 5 : 12;
  let donVal = timePeriod.value === '7d' ? 2 : 8;

  return {
    saved: { value: savedVal, isPositive: true },
    donations: { value: donVal, isPositive: true }
  }
})

export const infoBoxes = computed(() => [
  { 
    title: 'Total Saved', 
    value: filteredStats.value.totalSaved, 
    icon: '🥑', 
    bgColor: '#f0faf0', 
    color: '#2da12b', 
    desc: 'Items rescued',
    trend: comparisons.value.saved
  },
  { 
    title: 'Donations', 
    value: filteredStats.value.donations, 
    icon: '🤝', 
    bgColor: '#eff6ff', 
    color: '#3b82f6', 
    desc: 'Meals safely donated',
    trend: comparisons.value.donations
  },
  { 
    title: 'Waste Reduced', 
    value: filteredStats.value.wasteReduced + 'kg', 
    icon: '♻️', 
    bgColor: '#fdf4ff', 
    color: '#c026d3', 
    desc: 'Less into landfills' 
  },
])

// FR-4.1 Chart data
export const chartData = computed(() => {
   // Adjusting chart data to look somewhat reactive to filters
   let limit = 6
   if (timePeriod.value === '7d') limit = 2
   if (timePeriod.value === 'all') limit = 6 // Mocking 6 months max for now

   const data = [...mockRawData.value.monthlyData]
   
   // Apply category mock multiplier
   let multiplier = selectedCategory.value === 'All' ? 1 : 0.6
   
   return data.slice(-limit).map(d => ({
       label: d.month,
       value: Math.floor(d.usage * multiplier),
       maxValue: 100 // for bar scaling
   }))
})

// FR-4.4 Badges
export const badges = computed(() => mockRawData.value.badges)

export const impactStats = computed(() => {
  let multiplier = 1
  if (timePeriod.value === '7d') multiplier = 0.25
  if (timePeriod.value === 'all') multiplier = 5
  if (selectedCategory.value !== 'All') multiplier *= 0.4

  return [
    { value: Math.round(320 * multiplier) + ' kg', label: 'CO₂ Reduced', icon: '💨', bgColor: '#e0f2fe', color: '#0284c7' },
    { value: Math.round(1500 * multiplier) + ' L', label: 'Water Saved', icon: '💧', bgColor: '#dcfce7', color: '#16a34a' },
    { value: '$' + Math.round(450 * multiplier), label: 'Money Saved', icon: '💰', bgColor: '#fef3c7', color: '#d97706' },
  ]
})

export function clearData() {
  showEmptyState.value = true
}

export function restoreData() {
  showEmptyState.value = false
}
