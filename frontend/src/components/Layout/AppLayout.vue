<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotifications } from '@/composables/useNotifications'
import { useToast }         from '@/composables/useToast'

const props = defineProps({
  currentPage: { type: String, default: 'dashboard' },
  unreadCount: { type: Number, default: 0 },   // kept for API compat; badge uses composable
  userName:    { type: String, default: 'Adrienne' },
})
const emit = defineEmits(['navigate'])

// ── Shared notification store ──
const { notifications, unreadCount: sharedUnread, markRead } = useNotifications()

// ── Global toast stack ──
const { toasts, dismiss } = useToast()

const navItems = [
  { id: 'dashboard',     label: 'Dashboard',    icon: '🏠' },
  { id: 'inventory',     label: 'Inventory',     icon: '📦' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'browse',        label: 'Browse Food',   icon: '🔍' },
  { id: 'meal-planner',  label: 'Meal Planner',  icon: '📅' },
  { id: 'analytics',     label: 'Analytics',     icon: '📊' },
  { id: 'settings',      label: 'Settings',      icon: '⚙️' },
]

// Mobile bottom tabs: prioritised order
const bottomNavItems = [
  { id: 'inventory',     label: 'Inventory',     icon: '📦' },
  { id: 'meal-planner',  label: 'Meal Planner',  icon: '📅' },
  { id: 'browse',        label: 'Browse Food',   icon: '🔍' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'dashboard',     label: 'Dashboard',     icon: '🏠' },
]

const userInitials = computed(() =>
  props.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
)

function navigate(page) {
  emit('navigate', page)
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
  emit('navigate', 'notifications')
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
          :class="{ active: currentPage === item.id }"
          @click="navigate(item.id)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
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
            <span class="user-name">{{ userName }}</span>
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
            🔔
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
        :class="{ active: currentPage === item.id }"
        @click="navigate(item.id)"
      >
        <span class="tab-icon">{{ item.icon }}</span>
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
  background: #f0f4f0;
  font-family: 'Inter', sans-serif;
}

/* ── Sidebar ── */
.sidebar {
  width: 240px;
  min-height: 100vh;
  background: #fff;
  border-right: 1px solid #e8ede8;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0;
  z-index: 100;
  flex-shrink: 0;
}

.sidebar-logo {
  padding: 1.5rem 3.75rem 1rem;
  border-bottom: 1px solid #f0f4f0;
}
.sidebar-logo img { max-width: 140px; }

.sidebar-nav {
  flex: 1;
  padding: 0.75rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #5a6a5a;
  font-size: 0.88rem;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  text-align: left;
  width: 100%;
  position: relative;
}
.nav-item:hover { background: #f0f7f0; color: #2da12b; }
.nav-item.active {
  background: linear-gradient(135deg, rgba(45,161,43,0.12), rgba(61,196,59,0.08));
  color: #2da12b;
  font-weight: 700;
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0; top: 20%; bottom: 20%;
  width: 3px;
  background: #2da12b;
  border-radius: 0 3px 3px 0;
}

.nav-icon { font-size: 1.1rem; width: 22px; text-align: center; flex-shrink: 0; }
.nav-label { flex: 1; }
.nav-badge {
  background: #ef4444; color: #fff;
  font-size: 0.65rem; font-weight: 800;
  padding: 2px 6px; border-radius: 99px;
  min-width: 18px; text-align: center;
}

/* ── Sidebar footer ── */
.sidebar-footer { padding: 1rem 0.75rem; border-top: 1px solid #f0f4f0; }
.user-chip {
  display: flex; align-items: center; gap: 10px;
  padding: 10px; border-radius: 12px; background: #f6f8f6;
}
.avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, #2da12b, #3dc43b);
  color: white; font-size: 0.8rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.user-info { display: flex; flex-direction: column; overflow: hidden; }
.user-name { font-size: 0.82rem; font-weight: 700; color: #1a1a1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role { font-size: 0.7rem; color: #9aaa9a; }

/* ── Main content ── */
.main-content {
  flex: 1;
  margin-left: 240px;
  min-height: 100vh;
  overflow-x: hidden;
}

/* ── Mobile ── */
.mobile-topbar { display: none; }
.bottom-tabs   { display: none; }

@media (max-width: 860px) {
  .sidebar { display: none; }
  .main-content { margin-left: 0; padding-bottom: 70px; padding-top: 56px; }

  /* ── Top bar ── */
  .mobile-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 56px;
    background: #fff;
    border-bottom: 1px solid #e8ede8;
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
    border: 1.5px solid #e8ede8;
    background: #fff;
    font-size: 1.1rem;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .bell-btn:hover,
  .bell-btn.active {
    border-color: #2da12b;
    box-shadow: 0 0 0 3px rgba(45,161,43,0.1);
  }

  .bell-badge {
    position: absolute;
    top: -5px; right: -5px;
    background: #ef4444; color: #fff;
    font-size: 0.58rem; font-weight: 800;
    font-family: 'Inter', sans-serif;
    min-width: 16px; height: 16px;
    padding: 0 3px;
    border-radius: 99px;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid #fff;
  }

  .avatar-sm {
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, #2da12b, #3dc43b);
    color: white; font-size: 0.72rem; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
  }

  /* ── Bottom tabs ── */
  .bottom-tabs {
    display: flex;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 64px;
    background: #fff;
    border-top: 1px solid #e8ede8;
    z-index: 110;
  }

  .tab-item {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 2px; border: none; background: transparent;
    color: #9aaa9a; font-size: 0.62rem; font-family: 'Inter', sans-serif;
    cursor: pointer; position: relative; transition: color 0.15s;
  }
  .tab-item.active { color: #2da12b; }
  .tab-icon { font-size: 1.15rem; }
  .tab-badge {
    position: absolute; top: 6px; left: 50%; transform: translateX(6px);
    background: #ef4444; color: #fff; font-size: 0.55rem; font-weight: 800;
    padding: 1px 4px; border-radius: 99px;
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
