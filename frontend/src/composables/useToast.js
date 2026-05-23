import { ref } from 'vue'

// ── Module-level singleton so all components share the same stack ──
const toasts = ref([])
let nextId = 1

const MAX_TOASTS = 5
const DURATION   = 3000   // ms before auto-dismiss

// Per-type defaults
const DEFAULTS = {
  success:      { icon: '✓',  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d' },
  error:        { icon: '✕',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca', text: '#7f1d1d' },
  warning:      { icon: '⚠️', color: '#d97706', bg: '#fffbeb', border: '#fde68a', text: '#78350f' },
  info:         { icon: 'ℹ️', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a5f' },
  meal:         { icon: '📅', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a5f' },
  notification: { icon: '🔔', color: '#2da12b', bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d' },
  reserved:     { icon: '🔒', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', text: '#4c1d95' },
}

export function useToast() {
  /**
   * showToast(message, type?, customIcon?)
   * @param {string} message
   * @param {string} type    - 'success' | 'error' | 'warning' | 'info' | 'meal' | 'notification' | 'reserved'
   * @param {string} [icon]  - override icon emoji
   */
  function showToast(message, type = 'success', icon = null) {
    // Evict oldest if cap reached
    if (toasts.value.length >= MAX_TOASTS) {
      toasts.value.shift()
    }

    const id      = nextId++
    const config  = DEFAULTS[type] ?? DEFAULTS.info
    const finalIcon = icon ?? config.icon

    toasts.value.push({ id, message, type, icon: finalIcon, config })

    // Schedule auto-dismiss
    setTimeout(() => dismiss(id), DURATION)
  }

  function dismiss(id) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  return { toasts, showToast, dismiss }
}
