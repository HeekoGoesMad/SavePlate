import { ref, computed } from 'vue'

// ── Module-level singleton — shared across all components ──
const notifications = ref([
  { id: 1,  type: 'inventory', message: 'Fresh Milk expires tomorrow. Use it or add to a meal.',               time: '2 hours ago',  isRead: false, link: 'inventory'    },
  { id: 2,  type: 'donation',  message: 'Your bread donation was claimed by another user.',                    time: '5 hours ago',  isRead: false, link: 'browse'       },
  { id: 3,  type: 'meal',      message: "Reminder: You haven't planned lunch for Wednesday yet.",              time: 'Yesterday',    isRead: false, link: 'meal-planner' },
  { id: 4,  type: 'account',   message: 'New login detected from Chrome on Windows at 10:42 PM.',             time: 'Yesterday',    isRead: false, link: 'settings'     },
  { id: 5,  type: 'inventory', message: 'Spinach is expiring in 2 days. Consider using it soon.',             time: '2 days ago',   isRead: false, link: 'inventory'    },
  { id: 6,  type: 'meal',      message: 'Your meal plan for this week has been confirmed.',                    time: '2 days ago',   isRead: true,  link: 'meal-planner' },
  { id: 7,  type: 'donation',  message: 'A new donation listing near you: 2kg brown rice.',                   time: '3 days ago',   isRead: true,  link: 'browse'       },
  { id: 8,  type: 'inventory', message: 'Greek Yogurt expires in 3 days. Plan a recipe?',                     time: '3 days ago',   isRead: true,  link: 'inventory'    },
  { id: 9,  type: 'account',   message: 'Your password was successfully changed.',                             time: '4 days ago',   isRead: true,  link: 'settings'     },
  { id: 10, type: 'meal',      message: "Meal reminder: Use your near-expiry tomatoes in tonight's dinner.",  time: '4 days ago',   isRead: true,  link: 'meal-planner' },
  { id: 11, type: 'donation',  message: 'Donation claim successful — pick up by Saturday.',                   time: '5 days ago',   isRead: true,  link: 'browse'       },
  { id: 12, type: 'inventory', message: '3 items in your inventory have expired and should be removed.',      time: '6 days ago',   isRead: true,  link: 'inventory'    },
])

let nextNotifId = 13

const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)

export function useNotifications() {
  /**
   * Add a new notification to the top of the list (most recent first).
   * @param {string} type    - 'inventory' | 'donation' | 'meal' | 'account'
   * @param {string} message
   * @param {string} [link]  - page id to navigate to when clicked
   */
  function addNotification(type, message, link = 'notifications') {
    notifications.value.unshift({
      id:      nextNotifId++,
      type,
      message,
      time:    'Just now',
      isRead:  false,
      link,
    })
  }

  /** Mark a single notification as read by id */
  function markRead(id) {
    const n = notifications.value.find(n => n.id === id)
    if (n) n.isRead = true
  }

  /** Mark all notifications as read */
  function markAllRead() {
    notifications.value.forEach(n => { n.isRead = true })
  }

  return { notifications, unreadCount, addNotification, markRead, markAllRead }
}
