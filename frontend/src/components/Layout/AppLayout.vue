<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNotifications } from '@/composables/useNotifications'
import { useToast }         from '@/composables/useToast'
import { authService }      from '@/services/authService'

const props = defineProps({
  unreadCount: { type: Number, default: 0 },   // kept for API compat; badge uses composable
  userName:    { type: String, default: 'Adrienne' },
})

const router = useRouter()
const route = useRoute()

// ── Shared notification store ──
const { notifications, unreadCount: sharedUnread, markRead } = useNotifications()

// ── Global toast stack ──
const { toasts, dismiss } = useToast()

// ── SVG icon paths (Heroicons-style) ──
const SVG_ICONS = {
  dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1',
  inventory: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  notifications: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  browse: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  'meal-planner': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  analytics: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
}

function iconPath(id) {
  return SVG_ICONS[id] || ''
}

const navItems = [
  { id: 'dashboard',     label: 'Dashboard' },
  { id: 'inventory',     label: 'Inventory' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'browse',        label: 'Browse Food' },
  { id: 'meal-planner',  label: 'Meal Planner' },
  { id: 'analytics',     label: 'Analytics' },
  { id: 'settings',      label: 'Settings' },
]

// Mobile bottom tabs: prioritised order
const bottomNavItems = [
  { id: 'inventory',     label: 'Inventory' },
  { id: 'meal-planner',  label: 'Meal Planner' },
  { id: 'browse',        label: 'Browse Food' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'dashboard',     label: 'Dashboard' },
]

const displayName = computed(() => authService.user.value?.name || props.userName || 'User')
const userInitials = computed(() =>
  displayName.value.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
)

function navigate(page) {
  router.push({ name: page })
  closeMobilePopup()
}

// ── Mobile notification sheet ──
const TYPE_CONFIG = {
  inventory: { label: 'Inventory Alert', icon: '⚠️', color: '#f59e0b' },
  donation:  { label: 'Donation Update', icon: '🤝', color: '#2da12b' },
  meal:      { label: 'Meal Reminder',   icon: '📅', color: '#3b82f6' },
  account:   { label: 'Account Alert',   icon: '🔐', color: '#ef4444' },
}

const mobilePopupOpen = ref(false)
const bellRef         = ref(null)

// Show only the 5 most-recent in the mobile quick-sheet
const mobileNotifs = computed(() => notifications.value.slice(0, 5))
const mobileUnread = computed(() => sharedUnread.value)

function toggleMobilePopup() { mobilePopupOpen.value = !mobilePopupOpen.value }
function closeMobilePopup()  { mobilePopupOpen.value = false }

function markMobileRead(id) {
  markRead(id)
}

function viewAllNotifs() {
  closeMobilePopup()
  router.push({ name: 'notifications' })
}

function handleClickOutside(e) {
  if (mobilePopupOpen.value && bellRef.value && !bellRef.value.contains(e.target)) {
    const sheet = document.querySelector('.mobile-notif-sheet')
    if (sheet && !sheet.contains(e.target)) closeMobilePopup()
  }
}

onMounted(()  => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div class="app-shell">

    <!-- ── SIDEBAR (desktop) ── -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <img src="@/assets/Save Plate Logo.png" alt="SavePlate" height="44" />
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="item in navItems"
          :key="item.id"
          class="nav-item"
          :class="{ active: route.name === item.id }"
          @click="navigate(item.id)"
        >
          <span class="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path :d="iconPath(item.id)"/></svg>
          </span>
          <span class="nav-label">{{ item.label }}</span>
          <span v-if="item.id === 'notifications' && sharedUnread > 0" class="nav-badge">
            {{ sharedUnread > 99 ? '99+' : sharedUnread }}
          </span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="user-chip">
          <div class="avatar">{{ userInitials }}</div>
          <div class="user-info">
            <span class="user-name">{{ displayName }}</span>
            <span class="user-role">Household User</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- ── MOBILE TOP BAR ── -->
    <header class="mobile-topbar">
      <img src="@/assets/Save Plate Logo.png" alt="SavePlate" height="32" />
      <div class="topbar-right">

        <!-- Bell with popup -->
        <div class="mobile-bell-wrap">
          <button
            ref="bellRef"
            class="bell-btn"
            :class="{ active: mobilePopupOpen }"
            @click="toggleMobilePopup"
            aria-label="Notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            <span v-if="mobileUnread > 0" class="bell-badge">{{ mobileUnread }}</span>
          </button>
        </div>

        <div class="avatar-sm">{{ userInitials }}</div>
      </div>
    </header>

    <!-- ── MOBILE NOTIFICATION BOTTOM SHEET ── -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="mobilePopupOpen" class="sheet-backdrop" @click.self="closeMobilePopup">
          <div class="mobile-notif-sheet">
            <!-- Handle bar -->
            <div class="sheet-handle"></div>

            <!-- Header -->
            <div class="sheet-header">
              <div class="sheet-title-row">
                <span class="sheet-title">🔔 Notifications</span>
                <span class="sheet-unread-badge">{{ mobileUnread }} unread</span>
              </div>
            </div>

            <!-- List -->
            <div class="sheet-list">
              <div
                v-for="n in mobileNotifs"
                :key="n.id"
                class="sheet-item"
                :class="{ unread: !n.isRead }"
                @click="markMobileRead(n.id)"
              >
                <div
                  class="sheet-item-icon"
                  :style="{ background: TYPE_CONFIG[n.type].color + '18', color: TYPE_CONFIG[n.type].color }"
                >
                  {{ TYPE_CONFIG[n.type].icon }}
                </div>
                <div class="sheet-item-body">
                  <div class="sheet-item-type" :style="{ color: TYPE_CONFIG[n.type].color }">
                    {{ TYPE_CONFIG[n.type].label }}
                  </div>
                  <div class="sheet-item-msg">{{ n.message }}</div>
                  <div class="sheet-item-time">{{ n.time }}</div>
                </div>
                <div v-if="!n.isRead" class="sheet-dot"></div>
              </div>
            </div>

            <!-- Footer -->
            <div class="sheet-footer">
              <button class="sheet-view-all" @click="viewAllNotifs">
                View all notifications →
              </button>
              <button class="sheet-close" @click="closeMobilePopup">Close</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── MAIN CONTENT ── -->
    <main class="main-content">
      <slot />
    </main>

    <!-- ── MOBILE BOTTOM TAB BAR ── -->
    <nav class="bottom-tabs">
      <button
        v-for="item in bottomNavItems"
        :key="item.id"
        class="tab-item"
        :class="{ active: route.name === item.id }"
        @click="navigate(item.id)"
      >
        <span class="tab-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path :d="iconPath(item.id)"/></svg>
        </span>
        <span class="tab-label">{{ item.label }}</span>
        <span v-if="item.id === 'notifications' && sharedUnread > 0" class="tab-badge">
          {{ sharedUnread > 99 ? '99+' : sharedUnread }}
        </span>
      </button>
    </nav>

  </div>

  <!-- ── GLOBAL TOAST STACK (bottom-right, shared by all pages) ── -->
  <Teleport to="body">
    <div class="toast-stack" role="region" aria-label="Notifications">
      <TransitionGroup name="toast-item" tag="div" class="toast-inner">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast-card"
          :style="{
            '--t-bg':     t.config.bg,
            '--t-border': t.config.border,
            '--t-icon':   t.config.color,
            '--t-text':   t.config.text,
          }"
          role="alert"
        >
          <span class="toast-icon">{{ t.icon }}</span>
          <span class="toast-msg">{{ t.message }}</span>
          <button class="toast-close" @click="dismiss(t.id)" aria-label="Dismiss">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Shell ── */
.app-shell {
  display: flex;
  min-height: 100vh;
  background: #f4f7f4;
  font-family: 'Inter', sans-serif;
}

/* ── Sidebar ── */
.sidebar {
  width: 248px;
  min-height: 100vh;
  background: #fff;
  border-right: 1px solid #e6ece6;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0;
  z-index: 100;
  flex-shrink: 0;
}

.sidebar-logo {
  padding: 1.5rem 1.5rem 1.125rem;
  border-bottom: 1px solid #f0f4f0;
}
.sidebar-logo img { max-width: 140px; display: block; }

.sidebar-nav {
  flex: 1;
  padding: 0.75rem 0.625rem;
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
  text-align: left;
  width: 100%;
  position: relative;
  letter-spacing: -0.01em;
}
.nav-item:hover {
  background: #f0f7f0;
  color: #2da12b;
}
.nav-item:focus-visible {
  outline: 2px solid #2da12b;
  outline-offset: -2px;
}
.nav-item.active {
  background: linear-gradient(135deg, rgba(45,161,43,0.10), rgba(61,196,59,0.06));
  color: #1e8a1c;
  font-weight: 700;
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0; top: 18%; bottom: 18%;
  width: 3px;
  background: linear-gradient(180deg, #2da12b, #3dc43b);
  border-radius: 0 3px 3px 0;
}

.nav-icon { font-size: 1rem; width: 22px; text-align: center; flex-shrink: 0; line-height: 1; }
.nav-label { flex: 1; }
.nav-badge {
  background: #ef4444; color: #fff;
  font-size: 0.625rem; font-weight: 800;
  padding: 1px 6px; border-radius: 99px;
  min-width: 18px; text-align: center;
  line-height: 1.6;
}

/* ── Sidebar footer ── */
.sidebar-footer { padding: 0.875rem 0.625rem; border-top: 1px solid #f0f4f0; }
.user-chip {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 12px; background: #f6f8f6;
  transition: background 150ms;
  cursor: default;
}
.user-chip:hover { background: #eef4ee; }
.avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: linear-gradient(135deg, #2da12b, #3dc43b);
  color: white; font-size: 0.75rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  letter-spacing: 0.02em;
}
.user-info { display: flex; flex-direction: column; overflow: hidden; gap: 1px; }
.user-name { font-size: 0.8rem; font-weight: 700; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role { font-size: 0.68rem; color: #9ca3af; }

/* ── Main content ── */
.main-content {
  flex: 1;
  margin-left: 248px;
  min-height: 100vh;
  overflow-x: hidden;
}

/* ── Mobile ── */
.mobile-topbar { display: none; }
.bottom-tabs   { display: none; }

@media (max-width: 860px) {
  .sidebar { display: none; }
  .main-content { margin-left: 0; padding-bottom: 72px; padding-top: 56px; }

  /* ── Top bar ── */
  .mobile-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 56px;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid #e6ece6;
    padding: 0 1rem;
    z-index: 110;
  }

  .topbar-right { display: flex; align-items: center; gap: 8px; }

  /* ── Mobile bell ── */
  .mobile-bell-wrap { position: relative; }

  .bell-btn {
    position: relative;
    width: 38px; height: 38px;
    border-radius: 10px;
    border: 1.5px solid #e6ece6;
    background: #fff;
    font-size: 1rem;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: border-color 150ms, box-shadow 150ms;
  }
  .bell-btn:hover,
  .bell-btn.active {
    border-color: #2da12b;
    box-shadow: 0 0 0 3px rgba(45,161,43,0.12);
  }
  .bell-btn:focus-visible { outline: 2px solid #2da12b; outline-offset: 2px; }

  .bell-badge {
    position: absolute;
    top: -5px; right: -5px;
    background: #ef4444; color: #fff;
    font-size: 0.56rem; font-weight: 800;
    font-family: 'Inter', sans-serif;
    min-width: 16px; height: 16px;
    padding: 0 3px;
    border-radius: 99px;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid #fff;
    line-height: 1;
  }

  .avatar-sm {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, #2da12b, #3dc43b);
    color: white; font-size: 0.7rem; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    letter-spacing: 0.02em;
  }

  /* ── Bottom tabs ── */
  .bottom-tabs {
    display: flex;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 64px;
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-top: 1px solid #e6ece6;
    z-index: 110;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .tab-item {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 2px; border: none; background: transparent;
    color: #9ca3af; font-size: 0.6rem; font-weight: 600;
    font-family: 'Inter', sans-serif;
    cursor: pointer; position: relative;
    transition: color 150ms;
    min-height: 44px;
    padding: 0 4px;
  }
  .tab-item.active { color: #2da12b; }
  .tab-item:focus-visible { outline: 2px solid #2da12b; outline-offset: -2px; border-radius: 8px; }
  .tab-icon { font-size: 1.15rem; line-height: 1; }
  .tab-badge {
    position: absolute; top: 6px; left: 50%; transform: translateX(6px);
    background: #ef4444; color: #fff; font-size: 0.53rem; font-weight: 800;
    padding: 1px 4px; border-radius: 99px;
    line-height: 1.5;
  }
}
</style>

<!-- ── Bottom sheet styles (not scoped — rendered via Teleport) ── -->
<style>
/* Sheet backdrop */
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

/* Sheet card */
.mobile-notif-sheet {
  width: 100%;
  background: #fff;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  max-height: 75vh;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}

.sheet-handle {
  width: 40px;
  height: 4px;
  background: #dde8dd;
  border-radius: 99px;
  margin: 10px auto 0;
  flex-shrink: 0;
}

.sheet-header {
  padding: 12px 18px 10px;
  border-bottom: 1px solid #f0f4f0;
  flex-shrink: 0;
}

.sheet-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sheet-title {
  font-size: 1rem;
  font-weight: 800;
  color: #1a1a1a;
}

.sheet-unread-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: #ef4444;
  background: #fef2f2;
  padding: 3px 10px;
  border-radius: 99px;
}

/* List */
.sheet-list {
  overflow-y: auto;
  flex: 1;
  -webkit-overflow-scrolling: touch;
}
.sheet-list::-webkit-scrollbar { display: none; }

.sheet-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid #f6f8f6;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}
.sheet-item:last-child { border-bottom: none; }
.sheet-item:hover      { background: #f9fbf9; }
.sheet-item.unread     { background: #f6fdf6; }
.sheet-item.unread:hover { background: #edfaed; }

.sheet-item-icon {
  width: 38px; height: 38px;
  border-radius: 10px;
  font-size: 1.1rem;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.sheet-item-body { flex: 1; min-width: 0; }

.sheet-item-type {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 2px;
}

.sheet-item-msg {
  font-size: 0.85rem;
  color: #2a2a2a;
  line-height: 1.45;
}
.sheet-item.unread .sheet-item-msg { font-weight: 700; }

.sheet-item-time {
  font-size: 0.7rem;
  color: #9aaa9a;
  margin-top: 4px;
}

.sheet-dot {
  width: 9px; height: 9px;
  border-radius: 50%;
  background: #2da12b;
  flex-shrink: 0;
  margin-top: 5px;
}

/* Footer */
.sheet-footer {
  display: flex;
  gap: 0.75rem;
  padding: 12px 18px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  border-top: 1px solid #f0f4f0;
  flex-shrink: 0;
}

.sheet-view-all {
  flex: 1;
  padding: 12px;
  background: linear-gradient(135deg, #2da12b, #3dc43b);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: opacity 0.2s;
}
.sheet-view-all:hover { opacity: 0.9; }

.sheet-close {
  padding: 12px 18px;
  background: #f0f4f0;
  color: #5a6a5a;
  border: none;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}
.sheet-close:hover { background: #e8ede8; }

/* ── Sheet animation ── */
.sheet-enter-active { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease; }
.sheet-leave-active { transition: transform 0.22s ease, opacity 0.2s ease; }
.sheet-enter-from   { transform: translateY(100%); opacity: 0; }
.sheet-leave-to     { transform: translateY(100%); opacity: 0; }

/* Backdrop fade */
.sheet-enter-active .sheet-backdrop,
.sheet-leave-active .sheet-backdrop { transition: background 0.2s; }

/* ── Global Toast Stack ─────────────────────────────── */
.toast-stack {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  pointer-events: none;
  font-family: 'Inter', sans-serif;
}

.toast-inner {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.toast-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--t-bg, #f0fdf4);
  border: 1.5px solid var(--t-border, #bbf7d0);
  border-radius: 14px;
  padding: 12px 14px;
  min-width: 260px;
  max-width: 360px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07);
  pointer-events: all;
  position: relative;
}

.toast-icon {
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--t-icon, #16a34a);
  line-height: 1;
}

.toast-msg {
  flex: 1;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--t-text, #14532d);
  line-height: 1.45;
}

.toast-close {
  background: none;
  border: none;
  color: var(--t-icon, #16a34a);
  opacity: 0.55;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  line-height: 1;
  margin-top: 2px;
  transition: opacity 0.15s;
}
.toast-close:hover { opacity: 1; }

/* Stack enter/leave */
.toast-item-enter-active {
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-item-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
  position: absolute;
  right: 0;
}
.toast-item-enter-from { opacity: 0; transform: translateX(30px) scale(0.92); }
.toast-item-leave-to   { opacity: 0; transform: translateX(16px) scale(0.95); }
.toast-item-move       { transition: transform 0.22s ease; }

/* Mobile: anchor above bottom nav bar */
@media (max-width: 860px) {
  .toast-stack {
    bottom: 76px;
    right: 0.75rem;
  }
  .toast-card {
    min-width: 220px;
    max-width: calc(100vw - 1.5rem);
    padding: 11px 12px;
  }
}

</style>
