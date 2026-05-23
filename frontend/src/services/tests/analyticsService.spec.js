import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  timePeriod,
  selectedCategory,
  isLoading,
  showEmptyState,
  fetchAnalytics,
  hasData,
  filteredStats,
  comparisons,
  infoBoxes,
  donutData,
  donutGradient,
  chartData,
  badges,
  impactStats,
  clearData,
  restoreData
} from '../analyticsService.js'
import { authService } from '../authService.js'

const MOCK_ANALYTICS_DATA = {
  totalItems: 15,
  usedItems: 10,
  donationsMade: 5,
  wasteReduced: '4.5',
  co2Saved: 12,
  waterSaved: 150,
  moneySaved: 45,
  categoryBreakdown: [
    { _id: 'Vegetables', count: 6 },
    { _id: 'Dairy', count: 4 },
  ],
  monthlyUsage: [
    { _id: { year: 2026, month: 5 }, count: 10 }
  ],
  monthlyDonations: [
    { _id: { year: 2026, month: 5 }, count: 5 }
  ]
}

beforeEach(() => {
  authService.token.value = 'mock-token' // Ensure logged in
  vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(MOCK_ANALYTICS_DATA),
    })
  ))
})

afterEach(() => {
  vi.unstubAllGlobals()
  authService.logout()
  timePeriod.value = 'all'
  selectedCategory.value = 'All'
  restoreData()
})

// =============================================================================
//  USER STORY 4.1 - Analytics Dashboard Summary (FR-4.1, FR-4.5)
// =============================================================================
describe('US-4.1 | Analytics Dashboard Summary (FR-4.1, FR-4.5)', () => {

  // ---------------------------------------------------------------------------
  it('[TC-201] fetchAnalytics updates stats and hasData becomes true when there is items data', async () => {
    await fetchAnalytics()
    expect(hasData.value).toBe(true)
    expect(filteredStats.value.totalSaved).toBe(10)
    expect(filteredStats.value.donations).toBe(5)
    expect(filteredStats.value.wasteReduced).toBe('4.5')
  })

  // ---------------------------------------------------------------------------
  it('[TC-202] fetchAnalytics sets rawData to null when the backend returns error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Error fetching data' }),
    }))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await fetchAnalytics()
    expect(hasData.value).toBeFalsy()
    expect(filteredStats.value.totalSaved).toBe(0)
    consoleSpy.mockRestore()
  })

  // ---------------------------------------------------------------------------
  it('[TC-203] showEmptyState and hasData handle empty data states gracefully', () => {
    expect(showEmptyState.value).toBe(false)
    clearData()
    expect(showEmptyState.value).toBe(true)
    expect(hasData.value).toBeFalsy()
    restoreData()
    expect(showEmptyState.value).toBe(false)
  })

  // ---------------------------------------------------------------------------
  it('[TC-204] infoBoxes correctly exposes metric titles, values, icons, and trends', async () => {
    await fetchAnalytics()
    const boxes = infoBoxes.value
    expect(boxes).toHaveLength(3)
    expect(boxes[0].title).toBe('Items Saved')
    expect(boxes[0].value).toBe(10)
    expect(boxes[0].icon).toBe('🥑')
    expect(boxes[1].title).toBe('Donations')
    expect(boxes[1].value).toBe(5)
    expect(boxes[1].icon).toBe('🤝')
  })

})

// =============================================================================
//  USER STORY 4.2 - Category Breakdown Filters (FR-4.2)
// =============================================================================
describe('US-4.2 | Category Breakdown Filters (FR-4.2)', () => {

  // ---------------------------------------------------------------------------
  it('[TC-205] donutData calculates percentages and assigns correct category colors', async () => {
    await fetchAnalytics()
    const data = donutData.value
    expect(data).toHaveLength(2)
    expect(data[0].label).toBe('Vegetables')
    expect(data[0].percent).toBe(60)
    expect(data[0].color).toBe('#2da12b')
    expect(data[1].label).toBe('Dairy')
    expect(data[1].percent).toBe(40)
    expect(data[1].color).toBe('#3b82f6')
  })

  // ---------------------------------------------------------------------------
  it('[TC-206] donutGradient generates a valid CSS conic-gradient string', async () => {
    await fetchAnalytics()
    const gradient = donutGradient.value
    expect(gradient).toContain('conic-gradient(')
    expect(gradient).toContain('#2da12b 0% 60%')
    expect(gradient).toContain('#3b82f6 60% 100%')
  })

})

// =============================================================================
//  USER STORY 4.3 - Progress achieved milestones & Badges (FR-4.3, FR-4.4)
// =============================================================================
describe('US-4.3 | Progress achieved milestones & Badges (FR-4.3, FR-4.4)', () => {

  // ---------------------------------------------------------------------------
  it('[TC-207] comparisons computed shows correct period changes', async () => {
    await fetchAnalytics()
    expect(comparisons.value.saved.value).toBe(10)
    expect(comparisons.value.saved.isPositive).toBe(true)
    expect(comparisons.value.donations.value).toBe(5)
  })

  // ---------------------------------------------------------------------------
  it('[TC-208] badges computed tracks and exposes milestone unlock states', async () => {
    await fetchAnalytics()
    const items = badges.value
    expect(items).toHaveLength(3)
    expect(items[0].title).toBe('10 Items Saved')
    expect(items[0].achieved).toBe(true)
    expect(items[1].title).toBe('5 Donations')
    expect(items[1].achieved).toBe(true)
    expect(items[2].title).toBe('50 Items Saved')
    expect(items[2].achieved).toBe(false)
  })

  // ---------------------------------------------------------------------------
  it('[TC-209] impactStats exposes environmental savings details', async () => {
    await fetchAnalytics()
    const stats = impactStats.value
    expect(stats).toHaveLength(3)
    expect(stats[0].label).toBe('CO₂ Reduced')
    expect(stats[0].value).toBe('12 kg')
    expect(stats[1].label).toBe('Water Saved')
    expect(stats[1].value).toBe('150 L')
    expect(stats[2].label).toBe('Money Saved')
    expect(stats[2].value).toBe('$45')
  })

  // ---------------------------------------------------------------------------
  it('[TC-210] chartData groups and parses monthly records correctly', async () => {
    await fetchAnalytics()
    const data = chartData.value
    expect(data).toHaveLength(1)
    expect(data[0].label).toBe("May '26")
    expect(data[0].savedValue).toBe(10)
    expect(data[0].donatedValue).toBe(5)
    expect(data[0].maxValue).toBe(10)
  })

})
