<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useNotifications } from '@/composables/useNotifications'
import { useToast }         from '@/composables/useToast'

const emit = defineEmits(['navigate'])

// ── Shared stores ──
const { notifications, unreadCount, markRead } = useNotifications()
const { showToast } = useToast()

const today    = new Date()
const greeting = computed(() => {
  const h = today.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
})

// Summary cards — Unread Alerts uses live shared unreadCount
const summaryCards = computed(() => [
  { label: 'Items Saved',   value: '34',                      unit: 'total',         icon: '🥦', color: '#2da12b', bg: '#f0faf0' },
  { label: 'Expiring Soon', value: '3',                       unit: 'within 3 days', icon: '⚠️', color: '#f59e0b', bg: '#fffbeb' },
  { label: 'Meals Planned', value: '11',                      unit: 'this week',     icon: '🍽️', color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Unread Alerts', value: String(unreadCount.value), unit: 'new',           icon: '🔔', color: '#ef4444', bg: '#fef2f2' },
])

const expiringItems = [
  { name: 'Fresh Milk',   expireIn: 1, category: 'Dairy',   qty: '1L',   urgency: 'urgent'  },
  { name: 'Spinach',      expireIn: 2, category: 'Veggies', qty: '200g', urgency: 'warning' },
  { name: 'Greek Yogurt', expireIn: 3, category: 'Dairy',   qty: '500g', urgency: 'soon'    },
]

const recentActivity = [
  { color: '#f59e0b', msg: 'Fresh Milk expires tomorrow',              time: '2h ago',     read: false },
  { color: '#2da12b', msg: 'Your donation of bread was claimed',       time: '5h ago',     read: false },
  { color: '#3b82f6', msg: 'Meal reminder: Lunch not set for Wednesday', time: 'Yesterday', read: true  },
  { color: '#ef4444', msg: 'New login from Chrome on Windows',         time: '2 days ago', read: true  },
  { color: '#2da12b', msg: 'Spinach is close to expiry — add to plan?', time: '2 days ago', read: true },
]

const urgencyLabel = { urgent: '1 day', warning: '2 days', soon: '3 days' }
const urgencyColor  = { urgent: '#ef4444', warning: '#f59e0b', soon: '#22c55e' }

// ── Bell popup (desktop) — top 5 from shared store ──
const TYPE_CONFIG = {
  inventory: { label: 'Inventory', icon: '⚠️', color: '#f59e0b' },
  donation:  { label: 'Donation',  icon: '🤝', color: '#2da12b' },
  meal:      { label: 'Meal',      icon: '📅', color: '#3b82f6' },
  account:   { label: 'Account',   icon: '🔐', color: '#ef4444' },
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
function openNotifPage() { showPopup.value = false; emit('navigate', 'notifications') }

function handleClickOutside(e) {
  if (showPopup.value &&
    bellRef.value && !bellRef.value.contains(e.target) &&
    popupRef.value && !popupRef.value.contains(e.target)
  ) showPopup.value = false
}
onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <AppLayout current-page="dashboard" :unread-count="unreadCount" user-name="Adrienne Kayana" @navigate="emit('navigate', $event)">
    <div class="dashboard">

      <!-- ── Header ── -->
      <div class="page-header">
        <div class="header-text">
          <h1>{{ greeting }}, Adrienne 👋</h1>
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
            <button class="link-btn" @click="emit('navigate', 'inventory')">View all →</button>
          </div>
          <div class="expiry-list">
            <div v-for="item in expiringItems" :key="item.name" class="expiry-row">
              <div class="expiry-info">
                <span class="expiry-name">{{ item.name }}</span>
                <span class="expiry-meta">{{ item.category }} · {{ item.qty }}</span>
              </div>
              <span class="urgency-chip"
                :style="{ background: urgencyColor[item.urgency] + '20', color: urgencyColor[item.urgency], borderColor: urgencyColor[item.urgency] + '40' }"
              >{{ urgencyLabel[item.urgency] }}</span>
            </div>
            <div class="action-strip">
              <button class="strip-btn green" @click="emit('navigate', 'meal-planner')">📅 Plan items</button>
              <button class="strip-btn amber" @click="emit('navigate', 'inventory')">📦 Inventory</button>
            </div>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="panel">
          <div class="panel-head"><h2>⚡ Quick Actions</h2></div>
          <div class="quick-actions">
            <button class="qa-card" @click="emit('navigate', 'meal-planner')">
              <div class="qa-icon" style="background:#eff6ff">📅</div>
              <div class="qa-label"><span>Meal</span><strong>Planner</strong></div>
            </button>
            <button class="qa-card" @click="openNotifPage">
              <div class="qa-icon" style="background:#fef2f2">🔔</div>
              <div class="qa-label"><span>Alerts</span><strong>Centre</strong></div>
            </button>
            <button class="qa-card" @click="emit('navigate', 'inventory')">
              <div class="qa-icon" style="background:#f0faf0">📦</div>
              <div class="qa-label"><span>Food</span><strong>Inventory</strong></div>
            </button>
            <button class="qa-card" @click="emit('navigate', 'browse')">
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
  padding: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
  color: #1a1a1a;
  background: none;
  -webkit-text-fill-color: unset;
  margin-bottom: 3px;
  line-height: 1.2;
}
.date-sub { font-size: 0.78rem; color: #9aaa9a; }

/* Desktop bell only */
.bell-wrap { position: relative; flex-shrink: 0; }

.btn-bell {
  position: relative;
  display: flex; align-items: center; justify-content: center;
  width: 44px; height: 44px;
  font-size: 1.15rem;
  background: #fff; border: 1.5px solid #e8ede8; border-radius: 12px;
  cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s;
}
.btn-bell:hover, .btn-bell.active {
  border-color: #2da12b; box-shadow: 0 0 0 3px rgba(45,161,43,0.1);
}
.bell-count {
  position: absolute; top: -5px; right: -5px;
  background: #ef4444; color: #fff;
  font-size: 0.58rem; font-weight: 800; font-family: 'Inter', sans-serif;
  min-width: 16px; height: 16px; padding: 0 3px; border-radius: 99px;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #f0f4f0;
}

/* Hide desktop bell on mobile (AppLayout topbar handles it) */
@media (max-width: 860px) { .bell-wrap { display: none; } }

/* ── Notification popup (desktop) ── */
.notif-popup {
  position: absolute;
  top: calc(100% + 10px); right: 0;
  width: 340px;
  background: #fff; border: 1px solid #e8ede8; border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.14); overflow: hidden; z-index: 200;
}
.popup-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px 10px; border-bottom: 1px solid #f0f4f0;
}
.popup-title  { font-size: 0.9rem; font-weight: 800; color: #1a1a1a; }
.popup-unread { font-size: 0.72rem; font-weight: 700; color: #ef4444; background: #fef2f2; padding: 2px 8px; border-radius: 99px; }
.popup-list   { max-height: 300px; overflow-y: auto; }
.popup-list::-webkit-scrollbar { width: 4px; }
.popup-list::-webkit-scrollbar-thumb { background: #e8ede8; border-radius: 99px; }
.popup-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 11px 16px; border-bottom: 1px solid #f6f8f6;
  cursor: pointer; transition: background 0.15s; position: relative;
}
.popup-item:hover  { background: #f9fbf9; }
.popup-item.unread { background: #f6fdf6; }
.popup-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0; }
.popup-body { flex: 1; min-width: 0; }
.popup-type { font-size: 0.63rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
.popup-msg  { font-size: 0.8rem; color: #2a2a2a; line-height: 1.4; }
.popup-item.unread .popup-msg { font-weight: 600; }
.popup-time { font-size: 0.68rem; color: #9aaa9a; margin-top: 3px; }
.popup-dot  { width: 8px; height: 8px; border-radius: 50%; background: #2da12b; flex-shrink: 0; margin-top: 4px; }
.popup-footer {
  display: block; width: 100%; padding: 11px 16px;
  background: #f9fbf9; border: none; border-top: 1px solid #f0f4f0;
  color: #2da12b; font-size: 0.82rem; font-weight: 700;
  font-family: 'Inter', sans-serif; text-align: center; cursor: pointer;
}
.popup-footer:hover { background: #f0faf0; }
.popup-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.popup-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.popup-enter-from   { opacity: 0; transform: translateY(-8px) scale(0.97); }
.popup-leave-to     { opacity: 0; transform: translateY(-6px) scale(0.97); }

/* ── Summary cards ── */
.cards-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}
.summary-card {
  background: var(--card-bg);
  border-radius: 14px; padding: 1rem;
  display: flex; align-items: center; gap: 0.75rem;
  transition: transform 0.2s, box-shadow 0.2s;
}
.summary-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.07); }
.card-icon  { font-size: 1.6rem; line-height: 1; }
.card-value { font-size: 1.6rem; font-weight: 900; color: var(--card-color); line-height: 1; }
.card-label { font-size: 0.75rem; font-weight: 700; color: #2a2a2a; margin-top: 3px; }
.card-unit  { font-size: 0.65rem; color: #9aaa9a; }

/* ── Two-col ── */
.two-col { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem; }

/* ── Panel ── */
.panel { background: #fff; border: 1px solid #e8ede8; border-radius: 16px; padding: 1.1rem; }
.panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.9rem; }
.panel-head h2 { font-size: 0.92rem; font-weight: 700; color: #1a1a1a; }
.link-btn {
  background: none; border: none; color: #2da12b;
  font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
  min-height: 44px; display: flex; align-items: center; padding: 0 4px;
}
.link-btn:hover { text-decoration: underline; }

/* ── Expiry ── */
.expiry-list { display: flex; flex-direction: column; gap: 0.5rem; }
.expiry-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 11px; background: #f9fbf9; border-radius: 10px; border: 1px solid #f0f4f0;
}
.expiry-info { display: flex; flex-direction: column; }
.expiry-name { font-size: 0.85rem; font-weight: 700; color: #1a1a1a; }
.expiry-meta { font-size: 0.7rem; color: #9aaa9a; }
.urgency-chip { font-size: 0.7rem; font-weight: 700; padding: 3px 10px; border-radius: 99px; border: 1px solid; white-space: nowrap; }
.action-strip { display: flex; gap: 0.5rem; margin-top: 0.35rem; }
.strip-btn { flex: 1; padding: 10px 6px; border-radius: 10px; border: none; font-size: 0.78rem; font-weight: 700; font-family: 'Inter', sans-serif; cursor: pointer; min-height: 44px; transition: opacity 0.2s; }
.strip-btn:hover { opacity: 0.85; }
.strip-btn.green { background: #f0faf0; color: #2da12b; }
.strip-btn.amber { background: #fffbeb; color: #d97706; }

/* ── Quick actions ── */
.quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
.qa-card {
  display: flex; align-items: center; gap: 10px;
  padding: 12px; border: 1.5px solid #e8ede8; border-radius: 12px;
  background: #fff; cursor: pointer; min-height: 56px;
  transition: border-color 0.2s, transform 0.15s; font-family: 'Inter', sans-serif; text-align: left;
}
.qa-card:hover { border-color: #2da12b; transform: translateY(-1px); }
.qa-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
.qa-label { display: flex; flex-direction: column; gap: 0; }
.qa-label span   { font-size: 0.68rem; color: #7a8a7a; line-height: 1.2; }
.qa-label strong { font-size: 0.82rem; color: #1a1a1a; font-weight: 700; }

/* ── Activity ── */
.activity-list { display: flex; flex-direction: column; }
.activity-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 11px 8px; border-radius: 10px; transition: background 0.15s;
}
.activity-row:hover { background: #f9fbf9; }
.activity-row.unread { background: #f6fdf6; }
.activity-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.activity-body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.activity-msg { font-size: 0.83rem; color: #2a2a2a; line-height: 1.4; }
.activity-row.unread .activity-msg { font-weight: 600; }
.activity-time { font-size: 0.7rem; color: #9aaa9a; }
.unread-badge { font-size: 0.63rem; font-weight: 800; padding: 2px 7px; background: #2da12b; color: white; border-radius: 99px; align-self: center; flex-shrink: 0; }

/* ── MOBILE ── */
@media (max-width: 860px) {
  .dashboard { padding: 1rem; gap: 1rem; }

  .page-header h1 { font-size: 1.2rem; }
  .date-sub { font-size: 0.75rem; }

  /* 2×2 grid on mobile */
  .cards-row { grid-template-columns: 1fr 1fr; gap: 0.6rem; }
  .summary-card { padding: 0.85rem 0.75rem; border-radius: 12px; }
  .card-icon  { font-size: 1.3rem; }
  .card-value { font-size: 1.3rem; }
  .card-label { font-size: 0.7rem; }
  .card-unit  { font-size: 0.62rem; }

  /* single col */
  .two-col { grid-template-columns: 1fr; }

  /* larger tap targets */
  .strip-btn { padding: 12px 6px; font-size: 0.82rem; }
  .qa-card   { min-height: 60px; padding: 14px; }
  .qa-icon   { width: 40px; height: 40px; font-size: 1.3rem; }
  .qa-label span   { font-size: 0.7rem; }
  .qa-label strong { font-size: 0.88rem; }

  /* Activity rows easier to tap */
  .activity-row { padding: 13px 8px; }
  .activity-msg  { font-size: 0.85rem; }
}

@media (max-width: 400px) {
  .cards-row { gap: 0.5rem; }
  .summary-card { padding: 0.75rem 0.65rem; }
}
</style>
