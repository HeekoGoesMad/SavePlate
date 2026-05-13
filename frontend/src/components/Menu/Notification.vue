<script setup>
import { ref, computed } from 'vue'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useNotifications } from '@/composables/useNotifications'
import { useToast }         from '@/composables/useToast'

const emit = defineEmits(['navigate'])

// ── Shared notification store ──
const { notifications, unreadCount, markRead: markReadShared, markAllRead: markAllReadShared } = useNotifications()
const { showToast } = useToast()

// ── Types config ──
const TYPE_CONFIG = {
  inventory: { label: 'Inventory Alert', icon: '⚠️', color: '#f59e0b', bg: '#fffbeb' },
  donation:  { label: 'Donation Update', icon: '🤝', color: '#2da12b', bg: '#f0faf0' },
  meal:      { label: 'Meal Reminder',   icon: '🍽️', color: '#3b82f6', bg: '#eff6ff' },
  account:   { label: 'Account Alert',   icon: '🔐', color: '#ef4444', bg: '#fef2f2' },
}

// ── State ──
const activeFilter  = ref('all')   // 'all' | type key
const showPrefModal = ref(false)
const visibleCount  = ref(8)

const prefToggles = ref({
  inventory: true,
  donation:  true,
  meal:      true,
  account:   true,
})

// ── Derived ──
// Only show notifications whose type is enabled in preferences
const filteredNotifications = computed(() => {
  let list = notifications.value.filter(n => prefToggles.value[n.type] !== false)
  if (activeFilter.value !== 'all') {
    list = list.filter(n => n.type === activeFilter.value)
  }
  return list.slice(0, visibleCount.value)
})

const hasMore = computed(() => {
  let list = notifications.value.filter(n => prefToggles.value[n.type] !== false)
  if (activeFilter.value !== 'all') {
    list = list.filter(n => n.type === activeFilter.value)
  }
  return visibleCount.value < list.length
})

// ── Actions ──
function markRead(id) {
  const n = notifications.value.find(n => n.id === id)
  if (n && !n.isRead) {
    markReadShared(id)
    showToast('Notification marked as read', 'notification', '🔔')
  }
}

function markAllRead() {
  const hadUnread = unreadCount.value > 0
  markAllReadShared()
  if (hadUnread) showToast('All notifications marked as read', 'success', '✓')
}

function clickNotification(n) {
  markRead(n.id)
  emit('navigate', n.link)
}

function loadMore() {
  visibleCount.value += 8
}

function setFilter(f) {
  activeFilter.value = f
  visibleCount.value = 8
}

function savePreferences() {
  showPrefModal.value = false
  showToast('Notification preferences saved', 'success', '⚙️')
}
</script>

<template>
  <AppLayout current-page="notifications" :unread-count="unreadCount" user-name="Adrienne Kayana" @navigate="emit('navigate', $event)">

    <div class="notif-page">

      <!-- ── Page Header ── -->
      <div class="notif-header">
        <div class="notif-title-row">
          <div>
            <h1>Notification Centre</h1>
            <p class="notif-sub">
              <span v-if="unreadCount > 0">{{ unreadCount }} unread notification{{ unreadCount !== 1 ? 's' : '' }}</span>
              <span v-else class="all-read">All caught up ✓</span>
            </p>
          </div>
          <div class="header-actions">
            <button class="btn-outline" :disabled="unreadCount === 0" @click="markAllRead">
              ✓ Mark all read
            </button>
            <button class="btn-outline" @click="showPrefModal = true">
              ⚙️ Preferences
            </button>
          </div>
        </div>

        <!-- Filter tabs -->
        <div class="filter-tabs">
          <button
            v-for="(cfg, key) in { all: { label: 'All', icon: '🔔' }, ...TYPE_CONFIG }"
            :key="key"
            class="filter-tab"
            :class="{ active: activeFilter === key }"
            @click="setFilter(key)"
          >
            <span>{{ cfg.icon }}</span>
            {{ cfg.label || 'All' }}
            <span v-if="key === 'all'" class="tab-count">{{ notifications.length }}</span>
            <span v-else class="tab-count">{{ notifications.filter(n => n.type === key).length }}</span>
          </button>
        </div>
      </div>

      <!-- ── Notification list ── -->
      <div class="notif-list">

        <div v-if="filteredNotifications.length === 0" class="empty-state">
          <div class="empty-icon">🔔</div>
          <p>No notifications yet.<br/>Your alerts will appear here.</p>
        </div>

        <div
          v-for="n in filteredNotifications"
          :key="n.id"
          class="notif-card"
          :class="{ unread: !n.isRead }"
          @click="clickNotification(n)"
          role="button"
          tabindex="0"
          @keydown.enter="clickNotification(n)"
        >
          <!-- Type color bar -->
          <div class="type-bar" :style="{ background: TYPE_CONFIG[n.type].color }"></div>

          <!-- Icon -->
          <div class="type-icon" :style="{ background: TYPE_CONFIG[n.type].bg }">
            {{ TYPE_CONFIG[n.type].icon }}
          </div>

          <!-- Body -->
          <div class="notif-body">
            <div class="notif-type-label" :style="{ color: TYPE_CONFIG[n.type].color }">
              {{ TYPE_CONFIG[n.type].label }}
            </div>
            <div class="notif-msg" :class="{ bold: !n.isRead }">{{ n.message }}</div>
            <div class="notif-time">{{ n.time }}</div>
          </div>

          <!-- Unread dot + mark read -->
          <div class="notif-actions" @click.stop>
            <span v-if="!n.isRead" class="unread-dot"></span>
            <button v-if="!n.isRead" class="mark-btn" @click.stop="markRead(n.id)">Mark read</button>
          </div>
        </div>

        <!-- Load more -->
        <div v-if="hasMore" class="load-more-wrap">
          <button class="load-more-btn" @click="loadMore">Load more notifications</button>
        </div>
      </div>

    </div>

    <!-- ── Preferences Modal ── -->
    <Teleport to="body">
      <div v-if="showPrefModal" class="modal-overlay" @click.self="showPrefModal = false">
        <div class="modal-card">
          <div class="modal-head">
            <h2>Notification Preferences</h2>
            <button class="modal-close" @click="showPrefModal = false">✕</button>
          </div>
          <p class="modal-sub">Choose which notifications you want to receive.</p>

          <div class="pref-list">
            <div v-for="(cfg, key) in TYPE_CONFIG" :key="key" class="pref-row">
              <div class="pref-info">
                <span class="pref-icon" :style="{ background: cfg.bg }">{{ cfg.icon }}</span>
                <div>
                  <div class="pref-label" :style="{ color: cfg.color }">{{ cfg.label }}</div>
                  <div class="pref-desc">
                    <template v-if="key === 'inventory'">Expiry alerts and inventory updates</template>
                    <template v-if="key === 'donation'">Donation claims and new listings</template>
                    <template v-if="key === 'meal'">Meal plan reminders and suggestions</template>
                    <template v-if="key === 'account'">Login activity and security events</template>
                  </div>
                </div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="prefToggles[key]" />
                <span class="toggle-track"></span>
              </label>
            </div>
          </div>

          <button class="btn-save" @click="savePreferences">Save Preferences</button>
        </div>
      </div>
    </Teleport>

  </AppLayout>
</template>

<style scoped>
/* ── Page shell — mirrors Dashboard/Analytics/BrowseFood ── */
.notif-page {
  padding: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Header ── */
.notif-header {
  background: transparent;
  border-bottom: 1px solid #e8ede8;
  padding-bottom: 0;
}

.notif-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.notif-title-row h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a1a;
  background: none;
  -webkit-text-fill-color: unset;
}

.notif-sub { font-size: 0.82rem; color: #9aaa9a; margin-top: 4px; }
.all-read { color: #2da12b; font-weight: 600; }

.header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.btn-outline {
  padding: 8px 14px;
  border: 1.5px solid #e0e8e0;
  border-radius: 10px;
  background: #fff;
  font-size: 0.82rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: #4a5a4a;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
.btn-outline:hover:not(:disabled) { border-color: #2da12b; color: #2da12b; }
.btn-outline:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Filter tabs ── */
.filter-tabs {
  display: flex;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 0;
}
.filter-tabs::-webkit-scrollbar { display: none; }

.filter-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  font-size: 0.82rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: #7a8a7a;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
}
.filter-tab:hover { color: #2da12b; }
.filter-tab.active { color: #2da12b; border-bottom-color: #2da12b; }

.tab-count {
  background: #e8ede8;
  color: #5a6a5a;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 99px;
}
.filter-tab.active .tab-count { background: rgba(45,161,43,0.12); color: #2da12b; }

/* ── List ── */
.notif-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

/* ── Empty state ── */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #9aaa9a;
}
.empty-icon { font-size: 3rem; margin-bottom: 1rem; }
.empty-state p { font-size: 0.9rem; line-height: 1.7; }

/* ── Notification card ── */
.notif-card {
  display: flex;
  align-items: flex-start;
  gap: 0;
  background: #fff;
  border: 1px solid #e8ede8;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s;
  position: relative;
}
.notif-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-1px); }
.notif-card.unread { border-color: #d4edda; }

.type-bar {
  width: 4px;
  align-self: stretch;
  flex-shrink: 0;
}

.type-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  font-size: 1.15rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 14px 12px 14px 12px;
  flex-shrink: 0;
}

.notif-body {
  flex: 1;
  padding: 14px 8px 14px 0;
  min-width: 0;
}

.notif-type-label {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 3px;
}

.notif-msg {
  font-size: 0.88rem;
  color: #2a2a2a;
  line-height: 1.45;
}
.notif-msg.bold { font-weight: 700; }

.notif-time {
  font-size: 0.72rem;
  color: #9aaa9a;
  margin-top: 5px;
}

.notif-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  padding: 14px 14px 14px 6px;
  flex-shrink: 0;
}

.unread-dot {
  width: 9px; height: 9px; border-radius: 50%;
  background: #2da12b;
  flex-shrink: 0;
}

.mark-btn {
  font-size: 0.7rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: #2da12b;
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  padding: 0;
}
.mark-btn:hover { text-decoration: underline; }

/* ── Load more ── */
.load-more-wrap { display: flex; justify-content: center; margin-top: 0.5rem; }
.load-more-btn {
  padding: 10px 28px;
  border: 1.5px solid #e0e8e0;
  border-radius: 10px;
  background: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: #4a5a4a;
  cursor: pointer;
  transition: border-color 0.2s;
}
.load-more-btn:hover { border-color: #2da12b; color: #2da12b; }

/* ── Preferences Modal ── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  background: #fff;
  border-radius: 20px;
  padding: 2rem;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.modal-head h2 { font-size: 1.15rem; font-weight: 800; color: #1a1a1a; }
.modal-close {
  background: none; border: none; font-size: 1rem; cursor: pointer;
  color: #9aaa9a; width: 30px; height: 30px; border-radius: 8px;
}
.modal-close:hover { background: #f0f4f0; color: #1a1a1a; }

.modal-sub { font-size: 0.83rem; color: #7a8a7a; margin-bottom: 1.5rem; }

.pref-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }

.pref-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 12px;
  border: 1px solid #e8ede8;
  border-radius: 12px;
}

.pref-info { display: flex; align-items: center; gap: 12px; flex: 1; }

.pref-icon {
  width: 38px; height: 38px; border-radius: 10px;
  font-size: 1.1rem; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.pref-label { font-size: 0.85rem; font-weight: 700; margin-bottom: 2px; }
.pref-desc { font-size: 0.73rem; color: #9aaa9a; }

/* Toggle */
.toggle-switch { position: relative; flex-shrink: 0; }
.toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
.toggle-track {
  display: block; width: 42px; height: 24px;
  background: #d1d5db; border-radius: 99px; cursor: pointer;
  transition: background 0.2s; position: relative;
}
.toggle-track::after {
  content: '';
  position: absolute;
  top: 3px; left: 3px;
  width: 18px; height: 18px;
  border-radius: 50%; background: white;
  transition: transform 0.2s;
}
.toggle-switch input:checked + .toggle-track { background: #2da12b; }
.toggle-switch input:checked + .toggle-track::after { transform: translateX(18px); }

.btn-save {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #2da12b, #3dc43b);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(45,161,43,0.3);
  transition: opacity 0.2s;
}
.btn-save:hover { opacity: 0.9; }

/* ── Responsive ── */
@media (max-width: 860px) {
  .notif-page { padding: 1rem; gap: 1rem; }

  /* Title row: stacks nicely */
  .notif-title-row {
    gap: 0.6rem;
    margin-bottom: 0.75rem;
  }
  .notif-title-row h1 { font-size: 1.2rem; }
  .notif-sub          { font-size: 0.75rem; }

  /* Action buttons: full width row */
  .header-actions { width: 100%; gap: 0.5rem; }
  .header-actions .btn-outline {
    flex: 1;
    text-align: center;
    font-size: 0.78rem;
    padding: 10px 8px;
    min-height: 40px;
  }

  /* Filter tabs: pill style that scrolls */
  .filter-tabs {
    gap: 0.4rem;
    padding: 0.6rem 0 0.6rem;
    margin: 0 -1rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .filter-tab {
    padding: 7px 13px;
    border-radius: 99px;
    border: 1.5px solid #e8ede8;
    background: #fff;
    border-bottom: 1.5px solid #e8ede8;
    font-size: 0.78rem;
    min-height: 36px;
  }
  .filter-tab.active {
    background: rgba(45,161,43,0.08);
    border-color: #2da12b;
    color: #2da12b;
    border-bottom-color: #2da12b;
  }

  /* List */
  .notif-list   { gap: 0.5rem; padding-bottom: 4rem; }

  /* Card: slightly more compact but still comfortable */
  .notif-card { border-radius: 12px; }
  .type-icon  { width: 38px; height: 38px; font-size: 1rem; margin: 12px 10px; }
  .notif-body { padding: 12px 6px 12px 0; }
  .notif-msg  { font-size: 0.84rem; }

  /* Mark read: bigger tap target on mobile */
  .notif-actions { padding: 12px 12px 12px 4px; gap: 4px; }
  .mark-btn {
    font-size: 0; /* hide text */
    width: 32px; height: 32px;
    border-radius: 8px;
    background: rgba(45,161,43,0.08);
    display: flex; align-items: center; justify-content: center;
    padding: 0;
  }
  .mark-btn::before {
    content: '✓';
    font-size: 0.9rem;
    color: #2da12b;
    font-weight: 800;
  }
  .mark-btn:hover { background: rgba(45,161,43,0.15); }

  /* Load more — full width */
  .load-more-btn { width: 100%; padding: 14px; min-height: 48px; }

  /* Preferences modal: bottom sheet */
  .modal-overlay { align-items: flex-end; padding: 0; }
  .modal-card {
    border-radius: 20px 20px 0 0;
    max-width: 100%;
    padding: 1.5rem 1.25rem;
    padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
  }
}

@media (max-width: 480px) {
  .notif-title-row { flex-direction: column; }
}
</style>

