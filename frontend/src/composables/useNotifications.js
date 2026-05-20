import { ref } from 'vue'
import { authService } from '../services/authService'

const _BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const API_URL = _BASE + '/notifications'

// ── Module-level singleton — shared across all components ──
const notifications = ref([])
const isLoading = ref(false)

import { computed } from 'vue'
const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)

export function useNotifications() {
  /**
   * Fetch all notifications from the backend
   */
  async function fetchNotifications() {
    if (!authService.isLoggedIn.value) return
    isLoading.value = true
    try {
      const response = await fetch(API_URL, {
        headers: authService.authHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch notifications')
      const data = await response.json()
      notifications.value = data.map(n => ({
        ...n,
        id: n._id,
        time: formatTime(n.createdAt),
      }))
    } catch (error) {
      console.error('fetchNotifications error:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Add a new notification (calls API)
   */
  async function addNotification(type, message, link = 'notifications') {
    const numericIds = notifications.value
      .map(n => Number(n.id))
      .filter(Number.isFinite)
    const tempId = numericIds.length ? Math.max(...numericIds) + 1 : Date.now()
    const optimistic = {
      id: tempId,
      _id: tempId,
      type,
      message,
      link,
      isRead: false,
      time: 'Just now',
    }
    notifications.value.unshift(optimistic)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: authService.authHeaders(),
        body: JSON.stringify({ type, message, link }),
      })
      if (!response.ok) throw new Error('Failed to create notification')
      const created = await response.json()
      const idx = notifications.value.findIndex(n => n.id === tempId)
      if (idx !== -1) notifications.value[idx] = {
        ...created,
        id: created._id,
        time: 'Just now',
      }
    } catch (error) {
      console.error('addNotification error:', error)
    }
  }

  /** Mark a single notification as read by id */
  async function markRead(id) {
    const n = notifications.value.find(n => n.id === id)
    if (n && !n.isRead) {
      n.isRead = true // Optimistic
      try {
        await fetch(`${API_URL}/${id}/read`, {
          method: 'PATCH',
          headers: authService.authHeaders(),
        })
      } catch (error) {
        n.isRead = false // Rollback
        console.error('markRead error:', error)
      }
    }
  }

  /** Mark all notifications as read */
  async function markAllRead() {
    const prev = notifications.value.map(n => ({ ...n }))
    notifications.value.forEach(n => { n.isRead = true }) // Optimistic
    try {
      await fetch(`${API_URL}/read-all`, {
        method: 'PATCH',
        headers: authService.authHeaders(),
      })
    } catch (error) {
      notifications.value = prev // Rollback
      console.error('markAllRead error:', error)
    }
  }

  return { notifications, unreadCount, isLoading, fetchNotifications, addNotification, markRead, markAllRead }
}

// ── Helper: relative time string ──
function formatTime(isoString) {
  if (!isoString) return ''
  const now = new Date()
  const date = new Date(isoString)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
