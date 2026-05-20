<script setup>
import { onMounted, ref, computed } from 'vue'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useNotifications } from '@/composables/useNotifications'
import { useToast } from '@/composables/useToast'
import {
  allItems, claimItemById, cancelClaimById, confirmHandoverById,
  convertToDonationById, cancelDonationById, markAsUsedById, fetchDonations
} from '@/services/donationService'

const { unreadCount, addNotification } = useNotifications()
const { showToast } = useToast()

// ── Filters Section ──
const searchQuery = ref('')
const filterCategory = ref('')   // '' | category label
const filterExpiry = ref('')   // '' | '1' | '3' | '7'
const filterStorage = ref('')   // '' | 'Fridge' | 'Freezer' | 'Pantry'
const filterSource = ref('')   // '' | 'own' | 'donation'  (FR-3.2)
const sortBy = ref('expiry')

// ── Categorization List ──
const CATEGORIES = [
  { label: 'Vegetables', icon: '🥬', bg: '#f0faf0' },
  { label: 'Dairy', icon: '🥛', bg: '#eff6ff' },
  { label: 'Canned', icon: '🥫', bg: '#fef9f0' },
  { label: 'Frozen', icon: '🧊', bg: '#f0f9ff' },
  { label: 'Bakery', icon: '🍞', bg: '#fffbeb' },
  { label: 'Other', icon: '🍱', bg: '#f8f8f8' },
]

// ── Current User ──
import { authService } from '@/services/authService'

const CURRENT_USER = computed(() => authService.user.value?.name || 'User')

function computeDaysLeft(expiryDateStr) {
  if (!expiryDateStr) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDateStr)
  expiry.setHours(0, 0, 0, 0)
  return Math.round((expiry - today) / (1000 * 60 * 60 * 24))
}

onMounted(() => {
  fetchDonations()
})

// dummy data moved to services/donationService.js

// ── Filtering Items
const filteredItems = computed(() => {
  let items = allItems.value.filter(item => {
    // Hide completed items
    if (item.status === 'completed') return false

    // Text search
    const q = searchQuery.value.toLowerCase()
    const matchText = !q || item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.address.toLowerCase().includes(q)

    // Category filter
    const matchCat = !filterCategory.value || item.category === filterCategory.value

    // Expiry filter
    const matchExpiry = !filterExpiry.value || item.daysLeft <= parseInt(filterExpiry.value)

    // Storage type filter
    const matchStorage = !filterStorage.value || item.storageType === filterStorage.value

    // Source filter (FR-3.2)
    const matchSource = !filterSource.value || item.source === filterSource.value

    return matchText && matchCat && matchExpiry && matchStorage && matchSource
  })

  if (sortBy.value === 'expiry') items = [...items].sort((a, b) => a.daysLeft - b.daysLeft)
  if (sortBy.value === 'name') items = [...items].sort((a, b) => a.name.localeCompare(b.name))
  return items
})

const hasActiveFilters = computed(() =>
  filterCategory.value || filterExpiry.value || filterStorage.value || filterSource.value || searchQuery.value
)

function clearFilters() {
  searchQuery.value = ''
  filterCategory.value = ''
  filterExpiry.value = ''
  filterStorage.value = ''
  filterSource.value = ''
}

// ── Helpers ──
function urgencyColor(daysLeft) {
  if (daysLeft <= 1) return '#ef4444'
  if (daysLeft <= 2) return '#f59e0b'
  return '#22c55e'
}
function urgencyLabel(daysLeft) {
  if (daysLeft <= 0) return 'Expired'
  if (daysLeft === 1) return '1 day left'
  return `${daysLeft} days left`
}

// ── Claim flow ──
const claimedId = ref(null)
const claimingId = ref(null)

function claimItem(item) {
  claimingId.value = item.id
  setTimeout(() => {
    item.claimed = true
    claimedId.value = item.id
    claimingId.value = null
    showToast(`"${item.name}" claimed successfully! 🎉`, 'success', '✅')
  }, 800)
}

// ── Item Detail Card
const detailItem = ref(null)

// Toast / inline confirmation
const confirmMsg = ref('')
let confirmTimer = null
function showConfirm(msg) {
  confirmMsg.value = msg
  clearTimeout(confirmTimer)
  confirmTimer = setTimeout(() => confirmMsg.value = '', 4500)
}

function openDetail(item) {
  detailItem.value = { ...item }
  confirmMsg.value = ''
}
function closeDetail() {
  detailItem.value = null
  confirmMsg.value = ''
}

async function markAsUsed(item) {
  try {
    await markAsUsedById(item.id)
    closeDetail()
    showToast(`✅ "${item.name}" marked as used and removed from your inventory.`, 'success', '✅')
  } catch (err) {
    showToast(err.message || 'Failed to mark item as used', 'warning', '⚠️')
  }
}


// ── Helper: is the current user the donor of this donation item? ──
function isOwnDonation(item) {
  return item.source === 'donation' && item.donorName === CURRENT_USER.value
}

// ── Claim Action ──
async function submitClaim(item) {
  if (!item) return

  // Guard: prevent the original donor from claiming their own item
  if (isOwnDonation(item)) {
    showToast('You cannot claim your own donated item.', 'warning', '⚠️')
    return
  }

  try {
    // Update status → reserved in allItems
    await claimItemById(item.id)
    // Sync detailItem if open
    if (detailItem.value?.id === item.id) {
      detailItem.value = {
        ...detailItem.value,
        status: 'reserved',
        claimedBy: CURRENT_USER.value,
      }
    }
    showToast(`"${item.name}" claimed successfully! 🎉`, 'success', '✅')

    // Notify the donor (FR-3.4)
    if (item.donorName && item.donorName !== CURRENT_USER.value) {
      addNotification('donation', `Your item "${item.name}" has been claimed by ${CURRENT_USER.value}.`, 'browse')
    }
  } catch (err) {
    showToast(err.message || 'Failed to claim item', 'warning', '⚠️')
  }
}

// Cancel Claim
function cancelClaim(item) {
  cancelClaimById(item.id)

  if (detailItem.value?.id === item.id) {
    detailItem.value = { ...detailItem.value, status: 'available', claimedBy: undefined }
  }
  showConfirm('Your claim has been cancelled. The item is now available again.')
}

// ── Confirm Handover ──
function confirmHandover(item) {
  confirmHandoverById(item.id)
  if (detailItem.value?.id === item.id) {
    detailItem.value = { ...detailItem.value, status: 'completed' }
  }
  showToast(`Handover confirmed! Item marked as completed ✅`, 'success', '🎉')
  addNotification('donation', `You confirmed handover for "${item.name}".`, 'browse')
  closeDetail()
}

// ── Convert to Donation (FR-3.3) ──
async function convertToDonation(item) {
  await convertToDonationById(item.id)
  if (detailItem.value?.id === item.id) {
    detailItem.value = { ...detailItem.value, source: 'donation', convertedFromOwn: true }
  }
  showToast(`"${item.name}" is now listed as a donation`, 'success')
  addNotification('donation', `You converted "${item.name}" into a donation listing.`, 'browse')
}

// ── Cancel Donation — return item to inventory (FR-3.3) ──
async function cancelDonation(item) {
  // Only allowed if no one has claimed the item yet
  const idx = allItems.value.findIndex(i => i.id === item.id)
  if (idx === -1 || allItems.value[idx].status !== 'available') {
    showToast('This item has already been claimed and cannot be returned.', 'warning', '⚠️')
    return
  }

  try {
    await cancelDonationById(item.id)
    if (detailItem.value?.id === item.id) {
      detailItem.value = { ...detailItem.value, source: 'own', convertedFromOwn: undefined }
    }
    showToast(`"${item.name}" returned to your inventory`, 'success')
    addNotification('inventory', `You returned "${item.name}" to your inventory.`, 'browse')
  } catch (err) {
    showToast('Failed to cancel donation', 'warning', '⚠️')
  }
}

</script>

<template>
  <AppLayout :unread-count="unreadCount" :user-name="CURRENT_USER">
    <div class="browse-page">

      <!-- ── Page Header ── -->
      <div class="page-header">
        <div class="header-text">
          <h1>Browse Food</h1>
          <p class="header-sub">Discover claimable food items near you</p>
        </div>
      </div>

      <!-- ── Filter Panel (FR-3.2) ── -->
      <div class="filter-panel">
        <div class="filter-title">Search &amp; Filter</div>
        <div class="filter-row">
          <!-- Text search -->
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input id="browse-search" v-model="searchQuery" class="form-input search-input" type="text"
              placeholder="Search food, category, or location…" autocomplete="off" />
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">✕</button>
          </div>

          <!-- Source filter (FR-3.2) -->
          <select id="filter-source" v-model="filterSource" class="form-input filter-select">
            <option value="">All Sources</option>
            <option value="own">My Items</option>
            <option value="donation">Community Donations</option>
          </select>

          <!-- Category filter -->
          <select id="filter-category" v-model="filterCategory" class="form-input filter-select">
            <option value="">All Categories</option>
            <option v-for="cat in CATEGORIES" :key="cat.label" :value="cat.label">
              {{ cat.icon }} {{ cat.label }}
            </option>
          </select>

          <!-- Expiry filter -->
          <select id="filter-expiry" v-model="filterExpiry" class="form-input filter-select">
            <option value="">Any Expiry</option>
            <option value="1">Expiring Within 1 Day</option>
            <option value="3">Expiring Within 3 Days</option>
            <option value="7">Expiring Within 7 Days</option>
          </select>

          <!-- Sort -->
          <select id="sort-select" v-model="sortBy" class="form-input filter-select">
            <option value="expiry">Expiry Date</option>
            <option value="name">Name(A–Z)</option>
          </select>

          <!-- Storage type filter -->
          <select id="filter-storage" v-model="filterStorage" class="form-input filter-select">
            <option value="">Any Storage</option>
            <option value="Fridge">Fridge</option>
            <option value="Freezer">Freezer</option>
            <option value="Pantry">Pantry</option>
          </select>

          <!-- Clear filters -->
          <button v-if="hasActiveFilters" class="clear-filters-btn" @click="clearFilters">
            ✕ Clear Filters
          </button>
        </div>
      </div>

      <!-- Sort strip -->
      <div class="sort-strip">
        <span class="sort-badge">
          {{ sortBy === 'expiry' ? 'Sorted by Expiry Date' : 'Sorted by Name' }}
          <span v-if="filterExpiry"> · Expiring ≤ {{ filterExpiry }}d</span>
          <span v-if="filterSource"> · {{ filterSource === 'own' ? 'My Items' : 'Donations' }}</span>
        </span>
        <span class="results-count">{{ filteredItems.length }} item{{ filteredItems.length !== 1 ? 's' : '' }}
          found</span>
      </div>

      <!-- Empty state -->
      <div v-if="filteredItems.length === 0" class="empty-state">
        <h3>No items found</h3>
        <p>No items match the selected filters. Please adjust your filters.</p>
      </div>

      <!-- Unified food grid (FR-3.1) -->
      <div v-else class="food-grid">
        <div v-for="item in filteredItems" :key="item.id" class="food-card"
          :class="{ 'is-reserved': item.status === 'reserved', 'is-own': item.source === 'own' }"
          :style="{ '--card-bg': item.bg }" @click="openDetail(item)">
          <div class="card-top" :style="{ background: item.bg }">
            <span class="food-icon">{{ item.icon }}</span>
            <div class="card-top-badges">
              <!-- Source badge -->
              <span class="source-chip" :class="item.source === 'own' ? 'source-own' : 'source-donation'">
                {{ item.source === 'own' ? 'My Item' : 'Donation' }}
              </span>
              <span class="urgency-chip" :style="{
                background: urgencyColor(item.daysLeft) + '18',
                color: urgencyColor(item.daysLeft),
                borderColor: urgencyColor(item.daysLeft) + '40'
              }">{{ urgencyLabel(item.daysLeft) }}</span>
            </div>
          </div>

          <div class="card-body">
            <div class="card-category">{{ item.category }}</div>
            <h3 class="card-name">{{ item.name }}</h3>
            <div class="card-meta-list">
              <div class="card-meta-row"><span class="meta-icon">📦</span><span class="meta-text">{{ item.qty }}</span>
              </div>
              <div v-if="item.storageType" class="card-meta-row"><span class="meta-icon">🗄️</span><span
                  class="meta-text">{{ item.storageType }}</span></div>
              <div class="card-meta-row"><span class="meta-icon">📍</span><span class="meta-text address">{{
                item.address }}</span></div>
              <div class="card-meta-row"><span class="meta-icon">📅</span><span class="meta-text">Expires {{ item.expiry
              }}</span></div>
            </div>
          </div>

          <!-- Unified card footer (FR-3.3) -->
          <div class="card-footer" @click.stop>
            <!-- DONATION items -->
            <template v-if="item.source === 'donation'">
              <!-- Donated by ME — cannot claim own item -->
              <template v-if="item.donorName === CURRENT_USER">
                <div v-if="item.status === 'available'" class="donor-actions">
                  <span class="donor-badge">Your Donation</span>
                  <button class="cancel-donation-btn" @click="cancelDonation(item)">Return to Inventory</button>
                </div>
                <div v-else-if="item.status === 'reserved'" class="reserved-row">
                  <div class="reserved-badge">Claimed by {{ item.claimedBy }}</div>
                  <button class="confirm-handover-btn" @click="confirmHandover(item)">Confirm Handover</button>
                </div>
              </template>
              <!-- Donated by OTHERS — normal claim flow -->
              <template v-else>
                <div v-if="item.status === 'reserved' && item.claimedBy === CURRENT_USER" class="reserved-row">
                  <div class="reserved-badge">Reserved by You</div>
                  <button class="cancel-claim-btn" @click="cancelClaim(item)">Cancel</button>
                </div>
                <div v-else-if="item.status === 'reserved'" class="reserved-badge reserved-badge--other">
                  Reserved
                </div>
                <button v-else-if="item.status === 'available'" class="claim-btn" @click="submitClaim(item)">Request /
                  Claim Item</button>
              </template>
            </template>
            <!-- OWN items -->
            <template v-else-if="item.source === 'own'">
              <button class="share-btn" @click="convertToDonation(item)">Convert to Donation</button>
            </template>
          </div>
        </div>
      </div>

    </div>

    <!-- ══════════════════════════════════════════════════
         DETAIL MODAL (UC 1.2.1-12)
    ═══════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="detailItem" class="modal-overlay" @click.self="closeDetail">
          <div class="modal-sheet detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
            <button class="modal-close" aria-label="Close" @click="closeDetail">✕</button>

            <!-- Banner -->
            <div class="detail-banner" :style="{ background: detailItem.bg }">
              <span class="detail-icon">{{ detailItem.icon }}</span>
              <div class="detail-banner-text">
                <div class="detail-chips-row">
                  <span class="urgency-chip" :style="{
                    background: urgencyColor(detailItem.daysLeft) + '22',
                    color: urgencyColor(detailItem.daysLeft),
                    borderColor: urgencyColor(detailItem.daysLeft) + '55'
                  }">{{ urgencyLabel(detailItem.daysLeft) }}</span>
                  <span v-if="detailItem.source" class="source-chip"
                    :class="detailItem.source === 'own' ? 'source-own' : 'source-donation'">
                    {{ detailItem.source === 'own' ? 'My Inventory' : 'Donation Listing' }}
                  </span>
                </div>
                <div class="detail-category">{{ detailItem.category }}</div>
              </div>
            </div>

            <!-- Body -->
            <div class="detail-body">
              <h2 id="detail-title" class="detail-name">{{ detailItem.name }}</h2>

              <!-- Confirmation message -->
              <Transition name="toast-fade">
                <div v-if="confirmMsg" class="confirm-toast">{{ confirmMsg }}</div>
              </Transition>

              <!-- Info grid (UC 1.2.1-12: storage location, expiry, notes, pickup arrangements) -->
              <div class="detail-info-grid">
                <div class="info-card">
                  <span class="info-label">📦 Quantity</span>
                  <span class="info-value">{{ detailItem.qty }}</span>
                </div>
                <div class="info-card">
                  <span class="info-label">📅 Expiry Date</span>
                  <span class="info-value">{{ detailItem.expiry }}</span>
                </div>
                <div v-if="detailItem.storageLocation" class="info-card info-card--wide">
                  <span class="info-label">🗄️ Storage Location</span>
                  <span class="info-value">{{ detailItem.storageLocation }}</span>
                </div>

                <div class="info-card info-card--wide">
                  <span class="info-label">📍 Pickup Address</span>
                  <span class="info-value">{{ detailItem.address }}</span>
                </div>
                <div v-if="detailItem.notes" class="info-card info-card--wide">
                  <span class="info-label">📝 Notes</span>
                  <span class="info-value info-notes">{{ detailItem.notes }}</span>
                </div>
                <!-- Pickup arrangement details if reserved -->
                <div v-if="detailItem.status === 'reserved' && detailItem.claimedBy"
                  class="info-card info-card--wide status-reserved-card">
                  <span class="info-label">🔒 Claim Status</span>
                  <span class="info-value">Reserved by <strong>{{ detailItem.claimedBy }}</strong></span>
                  <span v-if="detailItem.preferredPickup" class="info-value">⏰ Pickup: {{ detailItem.preferredPickup
                  }}</span>
                  <span v-if="detailItem.claimNote" class="info-value info-notes">{{ detailItem.claimNote }}</span>
                </div>
              </div>

              <!-- ── Contextual Actions (FR-3.3) ── -->
              <div class="detail-actions">

                <!-- DONATION items -->
                <template v-if="detailItem.source === 'donation'">
                  <!-- Donated by ME — cannot claim own item -->
                  <template v-if="detailItem.donorName === CURRENT_USER">
                    <div v-if="detailItem.status === 'available'" class="donor-actions donor-actions--lg">
                      <span class="donor-badge donor-badge--lg">Your Donation</span>
                      <button class="cancel-donation-btn cancel-donation-btn--lg"
                        @click="cancelDonation(detailItem)">Return to Inventory</button>
                    </div>
                    <div v-else-if="detailItem.status === 'reserved'" class="two-btn-row">
                      <div class="reserved-badge reserved-badge--lg">Claimed by {{ detailItem.claimedBy }}</div>
                      <button class="confirm-handover-btn confirm-handover-btn--lg"
                        @click="confirmHandover(detailItem)">Confirm Handover</button>
                    </div>
                  </template>
                  <!-- Donated by OTHERS — normal claim flow -->
                  <template v-else>
                    <button v-if="detailItem.status === 'available'" class="claim-btn claim-btn--lg"
                      @click="submitClaim(detailItem)">Request / Claim Item</button>

                    <!-- Reserved by me -->
                    <div v-else-if="detailItem.status === 'reserved' && detailItem.claimedBy === CURRENT_USER"
                      class="two-btn-row">
                      <div class="reserved-badge reserved-badge--lg">Reserved by You</div>
                      <button class="cancel-claim-btn cancel-claim-btn--lg" @click="cancelClaim(detailItem)">Cancel
                        Claim</button>
                    </div>

                    <!-- Reserved by someone else -->
                    <div v-else-if="detailItem.status === 'reserved'" class="reserved-badge reserved-badge--lg">
                      Currently Reserved
                    </div>
                  </template>
                </template>

                <!-- OWN items (FR-3.3: Mark as Used, Convert to Donation) -->
                <template v-else-if="detailItem.source === 'own'">
                  <div class="action-group-label">Actions</div>
                  <div class="action-grid">
                    <button class="action-btn action-btn--used" @click="markAsUsed(detailItem)">
                      <span class="action-btn-icon"></span>
                      <span>Mark as Used</span>
                    </button>
                    <button class="action-btn action-btn--donate" @click="convertToDonation(detailItem)">
                      <span class="action-btn-icon"></span>
                      <span>Convert to Donation</span>
                    </button>
                  </div>
                </template>

                <button class="detail-close-btn" @click="closeDetail">Close</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>



  </AppLayout>
</template>

<style scoped>
/* ── Page shell ── */
.browse-page {
  padding: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a1a;
  background: none;
  -webkit-text-fill-color: unset;
  margin-bottom: 3px;
  line-height: 1.2;
}

.header-sub {
  font-size: 0.78rem;
  color: #9aaa9a;
}

.header-add-btn {
  padding: 10px 18px;
  background: linear-gradient(135deg, #2da12b, #3dc43b);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 3px 10px rgba(45, 161, 43, 0.25);
  transition: opacity 0.2s, transform 0.15s;
  flex-shrink: 0;
}

.header-add-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* ── Tab bar ── */
.tab-bar {
  display: flex;
  background: #f0f4f0;
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  background: transparent;
  color: #7a8a7a;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
}

.tab-btn:hover {
  background: #fff;
  color: #2da12b;
}

.tab-btn.active {
  background: #fff;
  color: #2da12b;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
}

.tab-count {
  background: #2da12b;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 99px;
  min-width: 18px;
  text-align: center;
}

.tab-count--neutral {
  background: #e0e7e0;
  color: #5a6a5a;
}

/* ── Filter panel (UC 1.2.1-11) ── */
.filter-panel {
  background: #f8faf8;
  border: 1.5px solid #e8ede8;
  border-radius: 14px;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.filter-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #5a6a5a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-row {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-wrap {
  position: relative;
  flex: 2;
  min-width: 180px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 0.9rem;
  pointer-events: none;
}

.search-input {
  padding-left: 36px !important;
  padding-right: 36px;
}

.search-clear {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #9aaa9a;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 4px;
}

.search-clear:hover {
  color: #ef4444;
}

.filter-select {
  flex: 1;
  min-width: 150px;
  cursor: pointer;
}

.clear-filters-btn {
  padding: 9px 14px;
  background: #fef2f2;
  border: 1.5px solid #fca5a5;
  border-radius: 10px;
  color: #ef4444;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}

.clear-filters-btn:hover {
  background: #fee2e2;
}

.mt-1 {
  margin-top: 0.75rem;
}

/* ── Sort strip ── */
.sort-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.sort-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #f0f4f0;
  color: #5a6a5a;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 99px;
  border: 1px solid #e8ede8;
}

.results-count {
  font-size: 0.75rem;
  color: #9aaa9a;
  font-weight: 500;
}

/* ── Food grid ── */
.food-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

/* ── Food card ── */
.food-card {
  background: #fff;
  border: 1.5px solid #e8ede8;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  cursor: pointer;
}

.food-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.09);
  border-color: #c8dcc8;
}

.food-card.is-reserved {
  opacity: 0.72;
}

.food-card.is-own {
  border-color: #b8d4f8;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 0.9rem 0.7rem;
  gap: 0.4rem;
}

.card-top-badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.food-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}

/* Source chip (UC 1.2.1-11) */
.source-chip {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 99px;
  border: 1px solid;
  white-space: nowrap;
}

.source-donation {
  background: #eff6ff;
  color: #3b82f6;
  border-color: #bfdbfe;
}

.source-own {
  background: #f0f9ff;
  color: #0ea5e9;
  border-color: #bae6fd;
}

.urgency-chip {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 99px;
  border: 1px solid;
  white-space: nowrap;
}

.card-body {
  padding: 0 1rem 0.75rem;
  flex: 1;
}

.card-category {
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #2da12b;
  margin-bottom: 3px;
}

.card-name {
  font-size: 0.95rem;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 0.6rem;
  line-height: 1.25;
  background: none;
  -webkit-text-fill-color: unset;
}

.card-meta-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.card-meta-row {
  display: flex;
  align-items: flex-start;
  gap: 5px;
}

.meta-icon {
  font-size: 0.8rem;
  flex-shrink: 0;
  line-height: 1.5;
}

.meta-text {
  font-size: 0.75rem;
  color: #5a6a5a;
  line-height: 1.4;
}

.meta-text.address {
  color: #7a8a7a;
  font-style: italic;
}

/* ── Card footer ── */
.card-footer {
  padding: 0 0.9rem 0.9rem;
}

.claim-btn {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #2da12b, #3dc43b);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  min-height: 40px;
}

.claim-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.claim-btn--lg {
  padding: 13px;
  font-size: 0.95rem;
  border-radius: 12px;
  width: 100%;
}

/* Reserved badge */
.reserved-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.reserved-badge {
  flex: 1;
  padding: 8px 10px;
  background: #fff7ed;
  border: 1.5px solid #fed7aa;
  border-radius: 10px;
  color: #c2410c;
  font-size: 0.75rem;
  font-weight: 700;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reserved-badge--other {
  width: 100%;
  flex: unset;
}

.reserved-badge--lg {
  padding: 13px;
  font-size: 0.9rem;
  border-radius: 12px;
}

/* Donor-specific UI (FR-3.3) */
.donor-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.donor-actions--lg {
  gap: 8px;
}

.donor-badge {
  flex: 1;
  padding: 10px;
  background: #f0fdf4;
  border: 1.5px solid #86efac;
  border-radius: 10px;
  color: #166534;
  font-size: 0.75rem;
  font-weight: 700;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.donor-badge--lg {
  padding: 10px;
  font-size: 0.9rem;
  border-radius: 12px;
}

.cancel-donation-btn {
  padding: 10px;
  border: 1.5px solid #fde68a;
  border-radius: 10px;
  background: #fffbeb;
  color: #b45309;
  font-size: 0.73rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
  min-height: 40px;
}

.cancel-donation-btn:hover {
  border-color: #f59e0b;
  color: #92400e;
  background: #fef3c7;
}

.cancel-donation-btn--lg {
  padding: 11px 16px;
  font-size: 0.85rem;
  border-radius: 12px;
}

/* Confirm Handover */
.confirm-handover-btn {
  padding: 8px 11px;
  background: linear-gradient(135deg, #2da12b, #3dc43b);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 0.73rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s, transform 0.15s;
  min-height: 40px;
}

.confirm-handover-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.confirm-handover-btn--lg {
  padding: 11px 16px;
  font-size: 0.85rem;
  border-radius: 12px;
}

/* Cancel claim */
.cancel-claim-btn {
  padding: 8px 11px;
  border: 1.5px solid #e8ede8;
  border-radius: 10px;
  background: #fff;
  color: #9aaa9a;
  font-size: 0.73rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.2s, color 0.2s;
  min-height: 40px;
}

.cancel-claim-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.cancel-claim-btn--lg {
  padding: 11px 16px;
  font-size: 0.85rem;
  border-radius: 12px;
}

/* Own badge */
.own-badge {
  width: 100%;
  padding: 9px;
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  border-radius: 10px;
  color: #3b82f6;
  font-size: 0.78rem;
  font-weight: 700;
  text-align: center;
}

.own-badge--lg {
  padding: 13px;
  font-size: 0.9rem;
  border-radius: 12px;
}

/* Share button */
.share-btn {
  width: 100%;
  padding: 10px;
  border: 1.5px solid #e8ede8;
  border-radius: 10px;
  background: #fff;
  color: #5a6a5a;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  min-height: 40px;
}

.share-btn:hover {
  border-color: #2da12b;
  color: #2da12b;
}

/* Shared state */
.shared-badge-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.shared-badge {
  flex: 1;
  padding: 10px;
  background: #f0faf0;
  border: 1.5px solid #2da12b;
  border-radius: 10px;
  color: #2da12b;
  font-size: 0.82rem;
  font-weight: 700;
  text-align: center;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shared-badge--lg {
  padding: 13px;
  font-size: 0.9rem;
  border-radius: 12px;
}

.unshare-btn {
  padding: 10px 12px;
  border: 1.5px solid #e8ede8;
  border-radius: 10px;
  background: #fff;
  color: #9aaa9a;
  font-size: 0.73rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
  white-space: nowrap;
  min-height: 40px;
}

.unshare-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
}

/* ── Add item CTA ── */
.add-item-cta {
  display: flex;
  justify-content: center;
  padding: 0.5rem 0 0;
}

.add-btn {
  padding: 12px 28px;
  background: linear-gradient(135deg, #2da12b, #3dc43b);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(45, 161, 43, 0.25);
  transition: opacity 0.2s, transform 0.15s;
}

.add-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* ── Empty state ── */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #9aaa9a;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
}

.empty-state h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #5a6a5a;
  margin-bottom: 0.3rem;
  background: none;
  -webkit-text-fill-color: unset;
}

.empty-state p {
  font-size: 0.83rem;
}

/* ═══════════════════════════════════════════════════
   MODAL BASE
═══════════════════════════════════════════════════ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 20, 10, 0.48);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-sheet {
  position: relative;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
  width: 100%;
  max-height: 92vh;
  overflow-y: auto;
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.88);
  border: 1.5px solid #e8ede8;
  border-radius: 50%;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  cursor: pointer;
  color: #5a6a5a;
  transition: background 0.2s, color 0.2s;
}

.modal-close:hover {
  background: #fef2f2;
  color: #ef4444;
  border-color: #ef4444;
}

/* ── Detail modal ── */
.detail-modal {
  max-width: 520px;
}

.detail-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.75rem 1.5rem 1.25rem;
}

.detail-icon {
  font-size: 3.5rem;
  line-height: 1;
  flex-shrink: 0;
}

.detail-banner-text {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-chips-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.detail-category {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #2da12b;
  margin-top: 3px;
}

.detail-body {
  padding: 0 1.5rem 1.5rem;
}

.detail-name {
  font-size: 1.35rem;
  font-weight: 800;
  color: #1a1a1a;
  background: none;
  -webkit-text-fill-color: unset;
  margin-bottom: 0.85rem;
  line-height: 1.25;
}

/* Inline confirm toast */
.confirm-toast {
  background: #f0faf0;
  border: 1.5px solid #86efac;
  border-radius: 10px;
  color: #166534;
  font-size: 0.83rem;
  font-weight: 600;
  padding: 10px 14px;
  margin-bottom: 0.85rem;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
}

/* Info grid */
.detail-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem;
  margin-bottom: 1.1rem;
}

.info-card {
  background: #f8faf8;
  border: 1px solid #e8ede8;
  border-radius: 12px;
  padding: 0.7rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.info-card--wide {
  grid-column: 1 / -1;
}

.status-reserved-card {
  background: #fff7ed;
  border-color: #fed7aa;
}

.info-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: #9aaa9a;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.info-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
}

.info-notes {
  font-style: italic;
  color: #5a6a5a;
}

/* Detail actions */
.detail-actions {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.two-btn-row {
  display: flex;
  gap: 0.55rem;
}

.two-btn-row>* {
  flex: 1;
}

/* Action grid (inventory contextual actions) */
.action-group-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #9aaa9a;
  margin-bottom: -2px;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 12px 8px;
  border: 1.5px solid #e8ede8;
  border-radius: 12px;
  background: #fff;
  font-size: 0.78rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  color: #5a6a5a;
}

.action-btn-icon {
  font-size: 1.3rem;
}

.action-btn--used:hover {
  background: #f0faf0;
  border-color: #2da12b;
  color: #2da12b;
}



.action-btn--donate:hover {
  background: #fff7ed;
  border-color: #f59e0b;
  color: #b45309;
}

.action-btn--share:hover {
  background: #f0fdf4;
  border-color: #22c55e;
  color: #16a34a;
}

.detail-close-btn {
  width: 100%;
  padding: 11px;
  border: 1.5px solid #e8ede8;
  border-radius: 12px;
  background: #fff;
  color: #7a8a7a;
  font-size: 0.88rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.detail-close-btn:hover {
  border-color: #c0ccc0;
  color: #1a1a1a;
}

/* ── Claim confirmation modal (UC 1.2.1-13) ── */
.claim-modal {
  max-width: 500px;
}

.claim-modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 1.5rem 0;
}

.claim-item-icon {
  font-size: 2.8rem;
  line-height: 1;
}

.claim-summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem;
  margin-bottom: 1rem;
}

/* Claim success screen */
.claim-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2.5rem 2rem;
  gap: 0.6rem;
}

.claim-success-icon {
  font-size: 4rem;
}

.claim-success-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #1a1a1a;
  background: none;
  -webkit-text-fill-color: unset;
}

.claim-success-msg {
  font-size: 0.9rem;
  color: #5a6a5a;
  line-height: 1.55;
  max-width: 300px;
}

.claim-detail-pill {
  background: #f0faf0;
  border: 1.5px solid #86efac;
  border-radius: 99px;
  color: #166534;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 6px 16px;
}

/* Forms */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 0.8rem;
}

.form-group.error .form-input {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
}

.form-label {
  font-size: 0.73rem;
  font-weight: 700;
  color: #5a6a5a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.optional {
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  color: #b0bdb0;
}

.form-input {
  padding: 10px 13px;
  border: 1.5px solid #e8ede8;
  border-radius: 10px;
  font-size: 0.88rem;
  font-family: 'Inter', sans-serif;
  color: #1a1a1a;
  background: #fff;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #2da12b;
  box-shadow: 0 0 0 3px rgba(45, 161, 43, 0.1);
}

.form-select {
  cursor: pointer;
}

.form-textarea {
  resize: vertical;
  min-height: 76px;
}

.form-error {
  font-size: 0.72rem;
  color: #ef4444;
  font-weight: 500;
}

/* ── Modal transition ── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.22s ease;
}

.modal-fade-enter-active .modal-sheet,
.modal-fade-leave-active .modal-sheet {
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-sheet {
  transform: translateY(16px) scale(0.97);
  opacity: 0;
}

.modal-fade-leave-to .modal-sheet {
  transform: translateY(10px) scale(0.98);
  opacity: 0;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .browse-page {
    padding: 1rem;
    gap: 0.9rem;
  }

  .food-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .tab-btn {
    font-size: 0.78rem;
    padding: 9px 10px;
  }

  .filter-row {
    flex-direction: column;
  }

  .filter-select,
  .search-wrap {
    width: 100%;
    flex: unset;
    min-width: unset;
  }
}

@media (max-width: 540px) {
  .food-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .detail-info-grid {
    grid-template-columns: 1fr;
  }

  .info-card--wide {
    grid-column: unset;
  }

  .action-grid {
    grid-template-columns: 1fr 1fr;
  }

  .claim-summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
