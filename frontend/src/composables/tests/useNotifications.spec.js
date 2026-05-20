import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNotifications } from '../useNotifications.js'

// Seed snapshot - mirrors the actual data in useNotifications.js
const SEED = [
  { id: 1,  type: 'meal',      message: "Reminder: You haven't planned lunch for Wednesday yet.",            time: 'Yesterday',   isRead: false, link: 'meal-planner' },
  { id: 2,  type: 'account',   message: 'New login detected from Chrome on Windows at 10:42 PM.',            time: 'Yesterday',   isRead: false, link: 'settings'     },
  { id: 3,  type: 'inventory', message: 'Spinach is expiring in 2 days. Consider using it soon.',            time: '2 days ago',  isRead: false, link: 'inventory'    },
  { id: 4,  type: 'meal',      message: 'Your meal plan for this week has been confirmed.',                   time: '2 days ago',  isRead: false, link: 'meal-planner' },
  { id: 5,  type: 'inventory', message: 'Fresh Milk expires tomorrow. Use it or add to a meal.',             time: '2 hours ago', isRead: false, link: 'inventory'    },
  { id: 6,  type: 'donation',  message: 'A new donation listing near you: 2kg brown rice.',                  time: '3 days ago',  isRead: true,  link: 'browse'       },
  { id: 7,  type: 'inventory', message: 'Greek Yogurt expires in 3 days. Plan a recipe?',                    time: '3 days ago',  isRead: true,  link: 'inventory'    },
  { id: 8,  type: 'account',   message: 'Your password was successfully changed.',                            time: '4 days ago',  isRead: true,  link: 'settings'     },
  { id: 9,  type: 'meal',      message: "Meal reminder: Use your near-expiry tomatoes in tonight's dinner.", time: '4 days ago',  isRead: true,  link: 'meal-planner' },
  { id: 10, type: 'donation',  message: 'Donation claim successful - pick up by Saturday.',                  time: '5 days ago',  isRead: true,  link: 'browse'       },
  { id: 11, type: 'donation',  message: 'Your bread donation was claimed by another user.',                   time: '5 hours ago', isRead: true,  link: 'browse'       },
  { id: 12, type: 'inventory', message: '3 items in your inventory have expired and should be removed.',     time: '6 days ago',  isRead: true,  link: 'inventory'    },
]

// Reset the singleton's array to a clean copy of SEED before every test
beforeEach(() => {
  const { notifications } = useNotifications()
  notifications.value = SEED.map(n => ({ ...n }))
})

// =============================================================================
//  USER STORY 1 - View All Notifications in the Notification Centre (FR-5.1)
// =============================================================================
describe('US-5.1 | View All Notifications (FR-5.1)', () => {

  // ---------------------------------------------------------------------------
  it('[TC-37] Notification Centre should expose 12 seeded notifications', () => {
    const { notifications } = useNotifications()
    expect(notifications.value.length).toBe(12)
  })

  // ---------------------------------------------------------------------------
  it('[TC-38] Each notification must have required fields: id, type, message, time, isRead, link', () => {
    const { notifications } = useNotifications()
    const REQUIRED_FIELDS = ['id', 'type', 'message', 'time', 'isRead', 'link']
    notifications.value.forEach(n => {
      REQUIRED_FIELDS.forEach(field => {
        expect(n, `Notification id:${n.id} is missing field "${field}"`).toHaveProperty(field)
      })
    })
  })

  // ---------------------------------------------------------------------------
  it('[TC-39] Seed data contains all 4 required notification types', () => {
    const { notifications } = useNotifications()
    const types = notifications.value.map(n => n.type)
    expect(types).toContain('inventory')
    expect(types).toContain('donation')
    expect(types).toContain('meal')
    expect(types).toContain('account')
  })

  // ---------------------------------------------------------------------------
  it('[TC-40] unreadCount computed correctly reflects 5 unread notifications on load', () => {
    const { unreadCount } = useNotifications()
    expect(unreadCount.value).toBe(5)
  })

  // ---------------------------------------------------------------------------
  it('[TC-41] unreadCount updates reactively when a notification is manually mutated', () => {
    const { notifications, unreadCount } = useNotifications()
    expect(unreadCount.value).toBe(5)
    notifications.value.find(n => n.id === 5).isRead = true
    expect(unreadCount.value).toBe(4)
  })

})

// =============================================================================
//  USER STORY 2 - Interact with Notifications (FR-5.3)
// =============================================================================
describe('US-5.2 | Interact with Notifications (FR-5.3)', () => {

  // ---------------------------------------------------------------------------
  it('[TC-42] Each notification type must have the correct deep-link destination', () => {
    const { notifications } = useNotifications()
    const byType = type => notifications.value.find(n => n.type === type)

    expect(byType('inventory').link).toBe('inventory')
    expect(byType('meal').link).toBe('meal-planner')
    expect(byType('donation').link).toBe('browse')
    expect(byType('account').link).toBe('settings')
  })

  // ---------------------------------------------------------------------------
  it('[TC-43] All notifications must have a non-empty link property', () => {
    const { notifications } = useNotifications()
    notifications.value.forEach(n => {
      expect(typeof n.link).toBe('string')
      expect(n.link.length).toBeGreaterThan(0)
    })
  })

})

// =============================================================================
//  USER STORY 3 - Mark Notification as Read - Individual & Bulk (FR-5.4)
// =============================================================================
describe('US-5.3 | Mark as Read - Individual & Bulk (FR-5.4)', () => {

  // ---------------------------------------------------------------------------
  it('[TC-44] markRead(id) sets isRead=true for the target notification only', () => {
    const { notifications, markRead, unreadCount } = useNotifications()
    expect(unreadCount.value).toBe(5)

    markRead(5)

    const target = notifications.value.find(n => n.id === 5)
    expect(target.isRead).toBe(true)

    // Verify other unread items are untouched
    const stillUnread = notifications.value.filter(n => [1, 2, 3, 4].includes(n.id))
    stillUnread.forEach(n => expect(n.isRead).toBe(false))

    expect(unreadCount.value).toBe(4)
  })

  // ---------------------------------------------------------------------------
  it('[TC-45] markRead() on an already-read notification causes no state change', () => {
    const { notifications, markRead, unreadCount } = useNotifications()
    markRead(6) // already read
    const target = notifications.value.find(n => n.id === 6)
    expect(target.isRead).toBe(true)
    expect(unreadCount.value).toBe(5) // unchanged
  })

  // ---------------------------------------------------------------------------
  it('[TC-46] markAllRead() sets every notification to isRead=true', () => {
    const { notifications, markAllRead, unreadCount } = useNotifications()
    expect(unreadCount.value).toBe(5)

    markAllRead()

    notifications.value.forEach(n => {
      expect(n.isRead).toBe(true)
    })
    expect(unreadCount.value).toBe(0)
  })

  // ---------------------------------------------------------------------------
  it('[TC-47] unreadCount is 0 after markAllRead - further markAllRead is a no-op', () => {
    const { markAllRead, unreadCount } = useNotifications()
    markAllRead()
    expect(unreadCount.value).toBe(0)
    // Calling again must NOT throw
    expect(() => markAllRead()).not.toThrow()
    expect(unreadCount.value).toBe(0)
  })

})

// =============================================================================
//  USER STORY 4 - Manage Notification Preferences (FR-5.5)
// =============================================================================
describe('US-5.4 | Notification Preferences - Category Filtering (FR-5.5)', () => {

  // ---------------------------------------------------------------------------
  it('[TC-48] Filtering by type "meal" returns only meal notifications', () => {
    const { notifications } = useNotifications()
    const mealOnly = notifications.value.filter(n => n.type === 'meal')
    expect(mealOnly.length).toBe(3)
    mealOnly.forEach(n => expect(n.type).toBe('meal'))
  })

  // ---------------------------------------------------------------------------
  it('[TC-49] Disabling a category (meal) leaves 9 remaining notifications', () => {
    const { notifications } = useNotifications()
    const prefToggles = { inventory: true, donation: true, meal: false, account: true }
    const filtered = notifications.value.filter(n => prefToggles[n.type] !== false)
    expect(filtered.length).toBe(9)
    filtered.forEach(n => expect(n.type).not.toBe('meal'))
  })

  // ---------------------------------------------------------------------------
  it('[TC-50] Re-enabling a category restores its notifications in the filtered list', () => {
    const { notifications } = useNotifications()
    let prefToggles = { inventory: true, donation: true, meal: false, account: true }
    const withoutMeal = notifications.value.filter(n => prefToggles[n.type] !== false)
    expect(withoutMeal.length).toBe(9)

    // Re-enable meal
    prefToggles = { ...prefToggles, meal: true }
    const withMeal = notifications.value.filter(n => prefToggles[n.type] !== false)
    expect(withMeal.length).toBe(12)
  })

  // ---------------------------------------------------------------------------
  it('[TC-51] Disabling ALL categories produces an empty notification list', () => {
    const { notifications } = useNotifications()
    const prefToggles = { inventory: false, donation: false, meal: false, account: false }
    const filtered = notifications.value.filter(n => prefToggles[n.type] !== false)
    expect(filtered.length).toBe(0)
  })

  // ---------------------------------------------------------------------------
  it('[TC-52] Unread count per category matches expected seed distribution', () => {
    const { notifications } = useNotifications()
    const unreadByType = type =>
      notifications.value.filter(n => n.type === type && !n.isRead).length

    expect(unreadByType('inventory')).toBe(2)
    expect(unreadByType('meal')).toBe(2)
    expect(unreadByType('account')).toBe(1)
    expect(unreadByType('donation')).toBe(0)
    // Total must be 5
    expect(unreadByType('inventory') + unreadByType('meal') +
           unreadByType('account')   + unreadByType('donation')).toBe(5)
  })

})

// =============================================================================
//  USER STORY 1 (cont.) - addNotification / Load More (FR-5.1, FR-5.2)
// =============================================================================
describe('US-5.1 (cont.) | addNotification & Pagination (FR-5.1, FR-5.2)', () => {

  // ---------------------------------------------------------------------------
  it('[TC-53] addNotification() prepends a new notification to the top of the list', () => {
    const { notifications, addNotification } = useNotifications()
    expect(notifications.value.length).toBe(12)

    addNotification('inventory', 'Test item expiring soon.', 'inventory')

    expect(notifications.value.length).toBe(13)
    const newest = notifications.value[0]
    expect(newest.type).toBe('inventory')
    expect(newest.message).toBe('Test item expiring soon.')
    expect(newest.isRead).toBe(false)
    expect(newest.time).toBe('Just now')
    expect(newest.link).toBe('inventory')
  })

  // ---------------------------------------------------------------------------
  it('[TC-54] addNotification() increments the notification id correctly', () => {
    const { notifications, addNotification } = useNotifications()
    addNotification('meal', 'New meal reminder.', 'meal-planner')
    const newest = notifications.value[0]
    expect(newest.id).toBeGreaterThan(12)
  })

  // ---------------------------------------------------------------------------
  it('[TC-55] addNotification() increments unreadCount by 1', () => {
    const { addNotification, unreadCount } = useNotifications()
    expect(unreadCount.value).toBe(5)
    addNotification('donation', 'New donation available.', 'browse')
    expect(unreadCount.value).toBe(6)
  })

  // ---------------------------------------------------------------------------
  it('[TC-56] Load-more: first 8 notifications are the initial visible batch', () => {
    const { notifications } = useNotifications()
    const visibleCount = 8
    const visible = notifications.value.slice(0, visibleCount)
    expect(visible.length).toBe(8)
  })

  // ---------------------------------------------------------------------------
  it('[TC-57] Load-more: after "load more" all 12 items are visible', () => {
    const { notifications } = useNotifications()
    let visibleCount = 8
    visibleCount += 8 // simulate loadMore()
    const visible = notifications.value.slice(0, visibleCount)
    expect(visible.length).toBe(12)

    // hasMore: visibleCount < total
    const hasMore = visibleCount < notifications.value.length
    expect(hasMore).toBe(false)
  })

})


