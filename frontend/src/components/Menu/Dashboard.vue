<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useNotifications } from '@/composables/useNotifications'
import { useToast }         from '@/composables/useToast'
import { authService } from '@/services/authService'
import { fetchAnalytics, filteredStats } from '@/services/analyticsService'
import { items, fetchItems, daysUntilExpiry } from '@/services/inventoryService'
import { useMealPlanner } from '@/composables/useMealPlanner'

const router = useRouter()

// ── Shared stores ──
const { notifications, unreadCount, markRead, fetchNotifications } = useNotifications()
const { showToast } = useToast()
const { mealPlan, loadMealPlan } = useMealPlanner()

const today    = new Date()
const userName = computed(() => authService.user.value?.name || 'User')
const firstName = computed(() => userName.value.split(' ')[0] || 'User')
const greeting = computed(() => {
  const h = today.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
})

const plannedMealsCount = computed(() => Object.values(mealPlan.value).flat().length)

const expiringItems = computed(() =>
  items.value
    .filter(item => item.status === 'available')
    .map(item => ({
      ...item,
      expireIn: daysUntilExpiry(item.expiryDate),
      qty: `${item.quantity} ${item.unit}`,
    }))
    .filter(item => item.expireIn >= 0 && item.expireIn <= 3)
    .sort((a, b) => a.expireIn - b.expireIn)
    .slice(0, 4)
)

// Summary cards — Unread Alerts uses live shared unreadCount
const summaryCards = computed(() => [
  { label: 'Items Saved',   value: String(filteredStats.value.totalSaved), unit: 'total',         icon: '🥦', color: '#2da12b', bg: '#f0faf0' },
  { label: 'Expiring Soon', value: String(expiringItems.value.length),     unit: 'within 3 days', icon: '⚠️', color: '#f59e0b', bg: '#fffbeb' },
  { label: 'Meals Planned', value: String(plannedMealsCount.value),        unit: 'this week',     icon: '🍽️', color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Unread Alerts', value: String(unreadCount.value),              unit: 'new',           icon: '🔔', color: '#ef4444', bg: '#fef2f2' },
])

// ── Bell popup (desktop) — top 5 from shared store ──
const TYPE_CONFIG = {
  inventory: { label: 'Inventory', icon: '⚠️', color: '#f59e0b' },
  donation:  { label: 'Donation',  icon: '🤝', color: '#2da12b' },
  meal:      { label: 'Meal',      icon: '📅', color: '#3b82f6' },
  account:   { label: 'Account',   icon: '🔐', color: '#ef4444' },
}

const recentActivity = computed(() =>
  notifications.value.slice(0, 5).map(notification => ({
    color: TYPE_CONFIG[notification.type]?.color || '#6b7280',
    msg: notification.message,
    time: notification.time,
    read: notification.isRead,
  }))
)

function urgencyLabel(days) {
  if (days === 0) return 'today'
  if (days === 1) return '1 day'
  return `${days} days`
}

function urgencyColor(days) {
  if (days <= 1) return '#ef4444'
  if (days <= 2) return '#f59e0b'
  return '#22c55e'
}

const popupNotifs = computed(() => notifications.value.slice(0, 5))
const showPopup   = ref(false)
const bellRef     = ref(null)
const popupRef    = ref(null)

function togglePopup() { showPopup.value = !showPopup.value }
function markPopupRead(id) {
  const n = notifications.value.find(n => n.id === id)
  if (n && !n.isRead) {
    markRead(id)
    showToast('Notification marked as read', 'notification', '🔔')
  }
}
function openNotifPage() { showPopup.value = false; router.push({ name: 'notifications' }) }

function handleClickOutside(e) {
  if (showPopup.value &&
    bellRef.value && !bellRef.value.contains(e.target) &&
    popupRef.value && !popupRef.value.contains(e.target)
  ) showPopup.value = false
}
onMounted(async () => {
  document.addEventListener('mousedown', handleClickOutside)
  await Promise.allSettled([
    fetchItems(),
    fetchAnalytics(),
    fetchNotifications(),
    loadMealPlan(),
  ])
})
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <AppLayout :unread-count="unreadCount" :user-name="userName">
    <div class="dashboard">

      <!-- ── Header ── -->
      <div class="page-header">
        <div class="header-text">
          <h1>{{ greeting }}, {{ firstName }} 👋</h1>
          <p class="date-sub">{{ today.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' }) }}</p>
        </div>
        <!-- Bell: desktop only — mobile handled by AppLayout topbar -->
        <div class="bell-wrap" ref="bellRef">
          <button class="btn-bell" :class="{ active: showPopup }" @click="togglePopup" aria-label="Notifications">
            🔔
            <span v-if="unreadCount > 0" class="bell-count">{{ unreadCount }}</span>
          </button>
          <Transition name="popup">
            <div v-if="showPopup" ref="popupRef" class="notif-popup">
              <div class="popup-header">
                <span class="popup-title">🔔 Notifications</span>
                <span class="popup-unread">{{ unreadCount }} unread</span>
              </div>
              <div class="popup-list">
                <div
                  v-for="n in popupNotifs" :key="n.id"
                  class="popup-item" :class="{ unread: !n.isRead }"
                  @click="markPopupRead(n.id)"
                >
                  <div class="popup-icon" :style="{ background: TYPE_CONFIG[n.type].color + '18', color: TYPE_CONFIG[n.type].color }">
                    {{ TYPE_CONFIG[n.type].icon }}
                  </div>
                  <div class="popup-body">
                    <div class="popup-type" :style="{ color: TYPE_CONFIG[n.type].color }">{{ TYPE_CONFIG[n.type].label }}</div>
                    <div class="popup-msg">{{ n.message }}</div>
                    <div class="popup-time">{{ n.time }}</div>
                  </div>
                  <div v-if="!n.isRead" class="popup-dot"></div>
                </div>
              </div>
              <button class="popup-footer" @click="openNotifPage">View all notifications →</button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- ── Summary Cards ── -->
      <div class="cards-row">
        <div
          v-for="card in summaryCards" :key="card.label"
          class="summary-card"
          :style="{ '--card-bg': card.bg, '--card-color': card.color }"
        >
          <div class="card-icon">{{ card.icon }}</div>
          <div class="card-body">
            <div class="card-value">{{ card.value }}</div>
            <div class="card-label">{{ card.label }}</div>
            <div class="card-unit">{{ card.unit }}</div>
          </div>
        </div>
      </div>

      <!-- ── Two-col row (stacks on mobile) ── -->
      <div class="two-col">

        <!-- Expiring soon -->
        <div class="panel">
          <div class="panel-head">
            <h2>⏰ Expiring Soon</h2>
            <button class="link-btn" @click="router.push({ name: 'inventory' })">View all →</button>
          </div>
          <div class="expiry-list">
            <div v-for="item in expiringItems" :key="item.name" class="expiry-row">
              <div class="expiry-info">
                <span class="expiry-name">{{ item.name }}</span>
                <span class="expiry-meta">{{ item.category }} · {{ item.qty }}</span>
              </div>
              <span class="urgency-chip"
                :style="{ background: urgencyColor(item.expireIn) + '20', color: urgencyColor(item.expireIn), borderColor: urgencyColor(item.expireIn) + '40' }"
              >{{ urgencyLabel(item.expireIn) }}</span>
            </div>
            <div class="action-strip">
              <button class="strip-btn green" @click="router.push({ name: 'meal-planner' })">📅 Plan items</button>
              <button class="strip-btn amber" @click="router.push({ name: 'inventory' })">📦 Inventory</button>
            </div>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="panel">
          <div class="panel-head"><h2>⚡ Quick Actions</h2></div>
          <div class="quick-actions">
            <button class="qa-card" @click="router.push({ name: 'meal-planner' })">
              <div class="qa-icon" style="background:#eff6ff">📅</div>
              <div class="qa-label"><span>Meal</span><strong>Planner</strong></div>
            </button>
            <button class="qa-card" @click="openNotifPage">
              <div class="qa-icon" style="background:#fef2f2">🔔</div>
              <div class="qa-label"><span>Alerts</span><strong>Centre</strong></div>
            </button>
            <button class="qa-card" @click="router.push({ name: 'inventory' })">
              <div class="qa-icon" style="background:#f0faf0">📦</div>
              <div class="qa-label"><span>Food</span><strong>Inventory</strong></div>
            </button>
            <button class="qa-card" @click="router.push({ name: 'browse' })">
              <div class="qa-icon" style="background:#fdf4ff">🔍</div>
              <div class="qa-label"><span>Browse</span><strong>Donations</strong></div>
            </button>
          </div>
        </div>

      </div>

      <!-- ── Recent Activity ── -->
      <div class="panel">
        <div class="panel-head">
          <h2>📋 Recent Activity</h2>
          <button class="link-btn" @click="openNotifPage">See all →</button>
        </div>
        <div class="activity-list">
          <div
            v-for="(item, i) in recentActivity" :key="i"
            class="activity-row" :class="{ unread: !item.read }"
          >
            <div class="activity-dot" :style="{ background: item.color }"></div>
            <div class="activity-body">
              <span class="activity-msg">{{ item.msg }}</span>
              <span class="activity-time">{{ item.time }}</span>
            </div>
            <span v-if="!item.read" class="unread-badge">New</span>
          </div>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<style scoped>
.dashboard {
  padding: 1.75rem 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  font-family: 'Inter', sans-serif;
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.header-text { flex: 1; min-width: 0; }

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  background: none;
  -webkit-text-fill-color: unset;
  margin-bottom: 3px;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.date-sub { font-size: 0.78rem; color: #9ca3af; font-weight: 500; }

/* Desktop bell only */
.bell-wrap { position: relative; flex-shrink: 0; }

.btn-bell {
  position: relative;
  display: flex; align-items: center; justify-content: center;
  width: 42px; height: 42px;
  font-size: 1.05rem;
  background: #fff;
  border: 1.5px solid #e6ece6;
  border-radius: 11px;
  cursor: pointer;
  transition: border-color 150ms, box-shadow 150ms, background 150ms;
}
.btn-bell:hover, .btn-bell.active {
  border-color: #2da12b;
  box-shadow: 0 0 0 3px rgba(45,161,43,0.12);
  background: #f9fff9;
}
.btn-bell:focus-visible { outline: 2px solid #2da12b; outline-offset: 2px; }

.bell-count {
  position: absolute; top: -5px; right: -5px;
  background: #ef4444; color: #fff;
  font-size: 0.56rem; font-weight: 800; font-family: 'Inter', sans-serif;
  min-width: 16px; height: 16px; padding: 0 3px; border-radius: 99px;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #f4f7f4;
  line-height: 1;
}

/* Hide desktop bell on mobile */
@media (max-width: 860px) { .bell-wrap { display: none; } }

/* ── Notification popup (desktop) ── */
.notif-popup {
  position: absolute;
  top: calc(100% + 10px); right: 0;
  width: 340px;
  background: #fff;
  border: 1px solid #e6ece6;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden; z-index: 200;
}
.popup-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 16px 10px; border-bottom: 1px solid #f0f4f0;
}
.popup-title  { font-size: 0.88rem; font-weight: 800; color: #111827; letter-spacing: -0.01em; }
.popup-unread { font-size: 0.7rem; font-weight: 700; color: #ef4444; background: #fef2f2; padding: 2px 8px; border-radius: 99px; }
.popup-list   { max-height: 300px; overflow-y: auto; }
.popup-list::-webkit-scrollbar { width: 4px; }
.popup-list::-webkit-scrollbar-thumb { background: #e6ece6; border-radius: 99px; }
.popup-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 16px; border-bottom: 1px solid #f6f8f6;
  cursor: pointer; transition: background 150ms; position: relative;
}
.popup-item:hover  { background: #f9fbf9; }
.popup-item.unread { background: #f6fdf6; }
.popup-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; }
.popup-body { flex: 1; min-width: 0; }
.popup-type { font-size: 0.61rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
.popup-msg  { font-size: 0.8rem; color: #374151; line-height: 1.4; }
.popup-item.unread .popup-msg { font-weight: 600; color: #111827; }
.popup-time { font-size: 0.67rem; color: #9ca3af; margin-top: 2px; }
.popup-dot  { width: 7px; height: 7px; border-radius: 50%; background: #2da12b; flex-shrink: 0; margin-top: 5px; }
.popup-footer {
  display: block; width: 100%; padding: 10px 16px;
  background: #f9fbf9; border: none; border-top: 1px solid #f0f4f0;
  color: #2da12b; font-size: 0.8rem; font-weight: 700;
  font-family: 'Inter', sans-serif; text-align: center; cursor: pointer;
  transition: background 150ms;
}
.popup-footer:hover { background: #f0faf0; }
.popup-enter-active { transition: opacity 180ms ease, transform 180ms cubic-bezier(0.16,1,0.3,1); }
.popup-leave-active { transition: opacity 150ms ease, transform 150ms ease; }
.popup-enter-from   { opacity: 0; transform: translateY(-8px) scale(0.97); }
.popup-leave-to     { opacity: 0; transform: translateY(-6px) scale(0.97); }

/* ── Summary cards ── */
.cards-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.875rem;
}
.summary-card {
  background: var(--card-bg, #fff);
  border: 1px solid rgba(0,0,0,0.04);
  border-radius: 14px; padding: 1rem;
  display: flex; align-items: center; gap: 0.875rem;
  transition: transform 200ms cubic-bezier(0.16,1,0.3,1), box-shadow 200ms;
  cursor: default;
}
.summary-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
.card-icon  { font-size: 1.5rem; line-height: 1; flex-shrink: 0; }
.card-value { font-size: 1.65rem; font-weight: 900; color: var(--card-color); line-height: 1; letter-spacing: -0.03em; }
.card-label { font-size: 0.73rem; font-weight: 700; color: #374151; margin-top: 3px; letter-spacing: -0.01em; }
.card-unit  { font-size: 0.63rem; color: #9ca3af; font-weight: 500; }

/* ── Two-col ── */
.two-col { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem; }

/* ── Panel ── */
.panel {
  background: #fff;
  border: 1px solid #e6ece6;
  border-radius: 16px;
  padding: 1.125rem 1.25rem;
  transition: box-shadow 200ms;
}
.panel:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.05); }

.panel-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 0.875rem;
}
.panel-head h2 {
  font-size: 0.88rem; font-weight: 800; color: #111827;
  letter-spacing: -0.01em;
}
.link-btn {
  background: none; border: none; color: #2da12b;
  font-size: 0.78rem; font-weight: 700; cursor: pointer;
  font-family: 'Inter', sans-serif;
  min-height: 44px; display: flex; align-items: center; padding: 0 4px;
  transition: color 150ms;
  letter-spacing: -0.01em;
}
.link-btn:hover { color: #1e8a1c; text-decoration: underline; }
.link-btn:focus-visible { outline: 2px solid #2da12b; border-radius: 4px; outline-offset: 2px; }

/* ── Expiry ── */
.expiry-list { display: flex; flex-direction: column; gap: 0.5rem; }
.expiry-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 11px; background: #f9fbf9; border-radius: 10px;
  border: 1px solid #f0f4f0;
  transition: background 150ms, border-color 150ms;
}
.expiry-row:hover { background: #f4fbf4; border-color: #d4e8d4; }
.expiry-info { display: flex; flex-direction: column; gap: 1px; }
.expiry-name { font-size: 0.83rem; font-weight: 700; color: #111827; letter-spacing: -0.01em; }
.expiry-meta { font-size: 0.68rem; color: #9ca3af; }
.urgency-chip {
  font-size: 0.68rem; font-weight: 700; padding: 3px 10px;
  border-radius: 99px; border: 1px solid; white-space: nowrap;
}
.action-strip { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.strip-btn {
  flex: 1; padding: 10px 6px; border-radius: 10px; border: none;
  font-size: 0.76rem; font-weight: 700; font-family: 'Inter', sans-serif;
  cursor: pointer; min-height: 44px;
  transition: opacity 150ms, transform 150ms;
  letter-spacing: -0.01em;
}
.strip-btn:hover { opacity: 0.85; transform: translateY(-1px); }
.strip-btn:active { transform: translateY(0); }
.strip-btn:focus-visible { outline: 2px solid #2da12b; outline-offset: 2px; }
.strip-btn.green { background: #f0faf0; color: #2da12b; }
.strip-btn.amber { background: #fffbeb; color: #d97706; }

/* ── Quick actions ── */
.quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.625rem; }
.qa-card {
  display: flex; align-items: center; gap: 10px;
  padding: 12px; border: 1.5px solid #e6ece6; border-radius: 12px;
  background: #fff; cursor: pointer; min-height: 56px;
  transition: border-color 150ms, transform 150ms cubic-bezier(0.16,1,0.3,1), box-shadow 150ms;
  font-family: 'Inter', sans-serif; text-align: left;
}
.qa-card:hover {
  border-color: #2da12b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(45,161,43,0.1);
}
.qa-card:active { transform: translateY(0); }
.qa-card:focus-visible { outline: 2px solid #2da12b; outline-offset: 2px; }
.qa-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; flex-shrink: 0; }
.qa-label { display: flex; flex-direction: column; }
.qa-label span   { font-size: 0.66rem; color: #9ca3af; line-height: 1.2; font-weight: 500; }
.qa-label strong { font-size: 0.8rem; color: #111827; font-weight: 700; letter-spacing: -0.01em; }

/* ── Activity ── */
.activity-list { display: flex; flex-direction: column; }
.activity-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 11px 8px; border-radius: 10px; transition: background 150ms;
}
.activity-row:hover { background: #f9fbf9; }
.activity-row.unread { background: #f6fdf6; }
.activity-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.activity-body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.activity-msg { font-size: 0.82rem; color: #374151; line-height: 1.4; letter-spacing: -0.01em; }
.activity-row.unread .activity-msg { font-weight: 600; color: #111827; }
.activity-time { font-size: 0.68rem; color: #9ca3af; font-weight: 500; }
.unread-badge {
  font-size: 0.6rem; font-weight: 800; padding: 2px 7px;
  background: #2da12b; color: white; border-radius: 99px;
  align-self: center; flex-shrink: 0;
}

/* ── MOBILE ── */
@media (max-width: 860px) {
  .dashboard { padding: 1rem; gap: 1rem; }
  .page-header h1 { font-size: 1.2rem; }
  .date-sub { font-size: 0.75rem; }

  /* 2×2 grid on mobile */
  .cards-row { grid-template-columns: 1fr 1fr; gap: 0.625rem; }
  .summary-card { padding: 0.875rem 0.75rem; border-radius: 12px; gap: 0.625rem; }
  .card-icon  { font-size: 1.25rem; }
  .card-value { font-size: 1.3rem; }
  .card-label { font-size: 0.7rem; }
  .card-unit  { font-size: 0.6rem; }

  /* single col */
  .two-col { grid-template-columns: 1fr; }

  /* larger tap targets */
  .strip-btn { padding: 12px 6px; font-size: 0.8rem; }
  .qa-card   { min-height: 60px; padding: 14px; }
  .qa-icon   { width: 38px; height: 38px; font-size: 1.2rem; }
  .qa-label span   { font-size: 0.68rem; }
  .qa-label strong { font-size: 0.86rem; }
  .activity-row { padding: 12px 8px; }
  .activity-msg  { font-size: 0.83rem; }
}

@media (max-width: 400px) {
  .cards-row { gap: 0.5rem; }
  .summary-card { padding: 0.75rem 0.625rem; }
}
</style>

