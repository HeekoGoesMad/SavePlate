<script setup>
// ─────────────────────────────────────────────────────────
// Inventory.vue  –  Use Case 2: Manage Food Inventory
// Allows users to add, edit, mark as used, donate, and
// delete food items from their personal household inventory.
// ─────────────────────────────────────────────────────────
import { ref, computed } from 'vue'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useNotifications } from '@/composables/useNotifications'
import { useToast }         from '@/composables/useToast'

const emit = defineEmits(['navigate'])

const { unreadCount }   = useNotifications()
const { showToast } = useToast()

// ── CONSTANTS ────────────────────────────────────────────
// Category list (matches DB schema enum)
const CATEGORIES = ['Vegetables', 'Dairy', 'Canned', 'Frozen', 'Bakery', 'Other']

// Storage location options (matches DB schema enum)
const STORAGE_LOCATIONS = ['Fridge', 'Freezer', 'Pantry']

// Unit options for quantity
const UNITS = ['pcs', 'g', 'kg', 'ml', 'L']

// ── MOCK INVENTORY DATA ───────────────────────────────────
// In a real app, this would come from: GET /api/items
// Each item follows the FoodItem schema from the Data Dictionary
const items = ref([
  {
    id: 1,
    name: 'Fresh Milk',
    category: 'Dairy',
    quantity: 1,
    unit: 'L',
    expiryDate: getTodayPlusDays(1),   // expires tomorrow → URGENT
    storageLocation: 'Fridge',
    status: 'available',               // available | used | donated | reserved
    notes: 'Opened on April 18',
  },
  {
    id: 2,
    name: 'Spinach',
    category: 'Vegetables',
    quantity: 200,
    unit: 'g',
    expiryDate: getTodayPlusDays(2),   // expires in 2 days → WARNING
    storageLocation: 'Fridge',
    status: 'available',
    notes: '',
  },
  {
    id: 3,
    name: 'Greek Yogurt',
    category: 'Dairy',
    quantity: 500,
    unit: 'g',
    expiryDate: getTodayPlusDays(4),   // expires in 4 days → SAFE
    storageLocation: 'Fridge',
    status: 'available',
    notes: '',
  },
  {
    id: 4,
    name: 'Canned Tuna',
    category: 'Canned',
    quantity: 3,
    unit: 'pcs',
    expiryDate: getTodayPlusDays(90),  // expires in 90 days → SAFE
    storageLocation: 'Pantry',
    status: 'available',
    notes: '',
  },
  {
    id: 5,
    name: 'Frozen Peas',
    category: 'Frozen',
    quantity: 400,
    unit: 'g',
    expiryDate: getTodayPlusDays(30),  // expires in 30 days → SAFE
    storageLocation: 'Freezer',
    status: 'available',
    notes: '',
  },
])

// ── HELPER: Date Utilities ────────────────────────────────
// Returns a date string "YYYY-MM-DD" n days from today
function getTodayPlusDays(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// Returns today as "YYYY-MM-DD" string (used as min for date picker)
function getTodayString() {
  return new Date().toISOString().split('T')[0]
}

// Returns days remaining until expiry (negative = already expired)
function daysUntilExpiry(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(dateStr)
  return Math.round((expiry - today) / (1000 * 60 * 60 * 24))
}

// Returns { label, color, bgColor } for the expiry badge
function getExpiryStatus(item) {
  if (item.status === 'used') return { label: 'Used', color: '#6b7280', bgColor: '#f3f4f6' }
  const days = daysUntilExpiry(item.expiryDate)
  if (days < 0)  return { label: 'Expired',            color: '#dc2626', bgColor: '#fef2f2' }
  if (days === 0) return { label: 'Expires Today',      color: '#f59e0b', bgColor: '#fffbeb' }
  if (days <= 3)  return { label: `${days}d left`,      color: '#f59e0b', bgColor: '#fffbeb' }
  return           { label: `${days}d left`,             color: '#22c55e', bgColor: '#f0fdf4' }
}

// ── COMPUTED: Summary Info Boxes (Dashboard‐style cards) ──
const summaryCards = computed(() => {
  const active      = items.value.filter(i => i.status === 'available')
  const expiringSoon = active.filter(i => daysUntilExpiry(i.expiryDate) <= 3)
  const usedCount   = items.value.filter(i => i.status === 'used').length

  return [
    { label: 'Total Items',   value: active.length,       unit: 'in inventory', icon: '📦', color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Expiring Soon', value: expiringSoon.length, unit: 'within 3 days', icon: '⚠️', color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Items Used',    value: usedCount,            unit: 'saved from waste', icon: '✅', color: '#22c55e', bg: '#f0fdf4' },
  ]
})

// ── FILTER / SORT ─────────────────────────────────────────
const sortOption     = ref('expiryDate')  // 'expiryDate' | 'name' | 'category' | 'dateAdded'
const filterCategory = ref('All')         // 'All' or a specific category
const filterStatus   = ref('available')   // 'available' | 'used'

// Only show items matching the selected status (active inventory or used history)
const filteredItems = computed(() => {
  let list = items.value.filter(i => i.status === filterStatus.value)

  // Filter by category
  if (filterCategory.value !== 'All') {
    list = list.filter(i => i.category === filterCategory.value)
  }

  // Sort
  if (sortOption.value === 'name') {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortOption.value === 'category') {
    list = [...list].sort((a, b) => a.category.localeCompare(b.category))
  } else if (sortOption.value === 'dateAdded') {
    list = [...list].sort((a, b) => b.id - a.id) // Mock sorting by date added using ID descending
  } else {
    // Default: sort by soonest expiry first
    list = [...list].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
  }
  return list
})

// ── ADD FOOD ITEM MODAL ───────────────────────────────────
const showAddModal = ref(false)

// Form data bound to the "Add Food Item" modal inputs
const newItem = ref(createEmptyItem())

// Validation error message shown in the modal
const addError = ref('')

// Creates a fresh empty form object
function createEmptyItem() {
  return {
    name: '',
    category: '',
    quantity: 1,
    unit: 'pcs',
    expiryDate: getTodayString(),
    storageLocation: '',
    notes: '',
  }
}

function openAddModal() {
  newItem.value = createEmptyItem()
  addError.value = ''
  showAddModal.value = true
}

function closeAddModal() {
  showAddModal.value = false
}

// Validates the form and saves the new item to the list
// In a real app: POST /api/items, then update local state
function submitAddItem() {
  // ── Validation (FR-2.1) ──
  if (!newItem.value.name.trim()) {
    addError.value = 'Item name is required.'
    return
  }
  if (!newItem.value.category) {
    addError.value = 'Please select a category.'
    return
  }
  if (!newItem.value.quantity || newItem.value.quantity <= 0) {
    addError.value = 'Quantity must be a positive number.'
    return
  }
  if (!newItem.value.expiryDate) {
    addError.value = 'Expiry date is required.'
    return
  }
  if (newItem.value.expiryDate < getTodayString()) {
    addError.value = 'Expiry date cannot be in the past.'
    return
  }

  // ── Save (mock: push to local array) ──
  items.value.push({
    id: Date.now(),                      // temporary ID; real app uses MongoDB _id
    name: newItem.value.name.trim(),
    category: newItem.value.category,
    quantity: Number(newItem.value.quantity),
    unit: newItem.value.unit,
    expiryDate: newItem.value.expiryDate,
    storageLocation: newItem.value.storageLocation,
    notes: newItem.value.notes,
    status: 'available',
  })

  showToast('Food item added successfully.', 'success')
  closeAddModal()
}

// ── EDIT ITEM MODAL ───────────────────────────────────────
const showEditModal = ref(false)
const editItem = ref(null)          // holds a copy of the item being edited
const editError = ref('')

function openEditModal(item) {
  // Make a shallow copy so edits don't mutate the original until saved
  editItem.value = { ...item }
  editError.value = ''
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editItem.value = null
}

// Applies edits to the item in the items array
// In a real app: PUT /api/items/:id
function submitEditItem() {
  if (!editItem.value.name.trim()) {
    editError.value = 'Item name is required.'
    return
  }
  if (!editItem.value.expiryDate) {
    editError.value = 'Expiry date is required.'
    return
  }
  if (editItem.value.expiryDate < getTodayString()) {
    editError.value = 'Expiry date cannot be in the past.'
    return
  }

  // Find the item in the array and replace it with the edited copy
  const idx = items.value.findIndex(i => i.id === editItem.value.id)
  if (idx !== -1) {
    items.value[idx] = { ...editItem.value }
  }

  showToast('Food item updated successfully.', 'success')
  closeEditModal()
}

// ── CONFIRM MODAL LOGIC ───────────────────────────────────
const showConfirmModal = ref(false)
const confirmData = ref({
  title: '',
  message: '',
  confirmText: '',
  cancelText: 'Cancel',
  onConfirm: null,
  isDanger: false
})

function openConfirmModal({ title, message, confirmText, cancelText = 'Cancel', onConfirm, isDanger = false }) {
  confirmData.value = { title, message, confirmText, cancelText, onConfirm, isDanger }
  showConfirmModal.value = true
}

function closeConfirmModal() {
  showConfirmModal.value = false
  confirmData.value.onConfirm = null
}

function executeConfirm() {
  if (confirmData.value.onConfirm) {
    confirmData.value.onConfirm()
  }
  closeConfirmModal()
}

// ── MARK AS USED ──────────────────────────────────────────
// (FR-2.3) Updates the item's status to 'used'
// In a real app: PATCH /api/items/:id/status { status: 'used' }
function markAsUsed(item) {
  openConfirmModal({
    title: 'Mark as Used',
    message: `Mark "${item.name}" as fully used? This will update your savings record.`,
    confirmText: 'Mark as Used',
    onConfirm: () => {
      item.status = 'used'
      showToast(`Great job! ${item.name} has been marked as used.`, 'success')
    }
  })
}

// ── DELETE ITEM ───────────────────────────────────────────
// (FR-2.2) Removes the item from the list
// In a real app: DELETE /api/items/:id
function deleteItem(item) {
  if (item.status === 'reserved') {
    openConfirmModal({
      title: 'Action Denied',
      message: 'This item is reserved for your meal plan. Please remove it from the plan before deleting.',
      confirmText: 'OK',
      cancelText: '',
      onConfirm: () => {}
    })
    return
  }
  
  openConfirmModal({
    title: 'Delete Item',
    message: `Are you sure you want to remove ${item.name} from your inventory? This cannot be undone.`,
    confirmText: 'Delete',
    isDanger: true,
    onConfirm: () => {
      items.value = items.value.filter(i => i.id !== item.id)
      showToast('Item removed from inventory.', 'success')
    }
  })
}

// ── DONATE MODAL ──────────────────────────────────────────
// (FR-2.4) Converts an inventory item into a donation listing
const showDonateModal = ref(false)
const donateTarget    = ref(null)     // which item is being donated
const donateForm      = ref({ location: '', availability: '' })
const donateError     = ref('')

function openDonateModal(item) {
  donateTarget.value = item
  donateForm.value   = { location: '', availability: '' }
  donateError.value  = ''
  showDonateModal.value = true
}

function closeDonateModal() {
  showDonateModal.value = false
  donateTarget.value    = null
}

// Converts item to donation and updates its status
// In a real app: POST /api/donations, then PATCH item status → 'donated'
function submitDonate() {
  if (!donateForm.value.location.trim()) {
    donateError.value = 'Pickup location is required.'
    return
  }
  if (!donateForm.value.availability.trim()) {
    donateError.value = 'Availability details are required.'
    return
  }

  // Update item status to 'donated' (removes it from active inventory view)
  donateTarget.value.status = 'donated'
  showToast('Your item has been listed for donation. Nearby users will be notified.', 'success')
  closeDonateModal()
}

// ── CATEGORY ICON HELPER ──────────────────────────────────
// Returns an emoji icon based on the item's category
function categoryIcon(category) {
  const map = {
    Vegetables: '🥬',
    Dairy:      '🥛',
    Canned:     '🥫',
    Frozen:     '🧊',
    Bakery:     '🍞',
    Fruits:     '🍎',
    Protein:    '🥚',
    Grains:     '🍚',
    Other:      '📦',
  }
  return map[category] ?? '🍽️'
}

// ── DONATE ELIGIBILITY (UC2 – item nearing expiry) ────────
// Only items expiring within 7 days can be converted to donation
const DONATE_THRESHOLD_DAYS = 7
function canDonate(item) {
  return daysUntilExpiry(item.expiryDate) <= DONATE_THRESHOLD_DAYS
}
</script>

<template>
  <AppLayout current-page="inventory" :unread-count="unreadCount" user-name="Adrienne Kayana" @navigate="emit('navigate', $event)">
    <div class="inventory-page">

      <!-- ══ PAGE HEADER ══════════════════════════════════ -->
      <div class="page-header">
        <div class="header-text">
          <h1>Food Inventory</h1>
          <p class="sub">Manage your household food items</p>
        </div>
        <!-- Primary action: Add a new food item (FR-2.1) -->
        <button class="btn-primary" @click="openAddModal" id="btn-add-item">
          + Add Food Item
        </button>
      </div>

      <!-- ══ INFO BOXES (Summary Cards) ══════════════════════ -->
      <!-- Match Dashboard summary card style -->
      <div class="cards-row">
        <div
          v-for="card in summaryCards"
          :key="card.label"
          class="summary-card"
          :style="{ '--card-color': card.color, '--card-bg': card.bg }"
        >
          <div class="card-icon">{{ card.icon }}</div>
          <div class="card-body">
            <div class="card-value">{{ card.value }}</div>
            <div class="card-label">{{ card.label }}</div>
            <div class="card-unit">{{ card.unit }}</div>
          </div>
        </div>
      </div>

      <!-- ══ FILTER & SORT BAR ════════════════════════════ -->
      <div class="controls-bar">
        <!-- Filter by Status -->
        <div class="filter-group">
          <span class="control-label">Status:</span>
          <select v-model="filterStatus" class="select-control" id="filter-status">
            <option value="available">Active Inventory</option>
            <option value="used">Recently Used</option>
          </select>
        </div>

        <!-- Filter by category -->
        <div class="filter-group">
          <span class="control-label">Category:</span>
          <select v-model="filterCategory" class="select-control" id="filter-category">
            <option value="All">All</option>
            <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <!-- Sort by field -->
        <div class="filter-group">
          <span class="control-label">Sort by:</span>
          <select v-model="sortOption" class="select-control" id="sort-option">
            <option value="expiryDate">Expiry Date</option>
            <option value="name">Name</option>
            <option value="category">Category</option>
            <option value="dateAdded">Date Added</option>
          </select>
        </div>
      </div>

      <!-- ══ INVENTORY LIST ════════════════════════════════ -->
      <div class="panel-head">
        <h2>Inventory Items</h2>
        <span class="item-count">{{ filteredItems.length }} item(s)</span>
      </div>

      <!-- Empty state (NFR-US-4 / FR-4.5) -->
      <div v-if="filteredItems.length === 0" class="empty-state">
        <div class="empty-icon">🥡</div>
        <p>No items found. Try adjusting your filters or add a new food item!</p>
        <button class="btn-primary" @click="openAddModal">+ Add Food Item</button>
      </div>

      <!-- Item grid (matches BrowseFood card layout) -->
      <div v-else class="food-grid">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="food-card"
          :class="{ urgent: item.status !== 'used' && daysUntilExpiry(item.expiryDate) <= 2 }"
          :style="{ '--card-bg': getExpiryStatus(item).bgColor }"
        >
          <!-- Card top: icon + expiry badge -->
          <div class="card-top" :style="{ background: getExpiryStatus(item).bgColor }">
            <span class="food-icon">{{ categoryIcon(item.category) }}</span>
            <span
              class="urgency-chip"
              :style="{
                background: getExpiryStatus(item).color + '18',
                color: getExpiryStatus(item).color,
                borderColor: getExpiryStatus(item).color + '40'
              }"
            >{{ getExpiryStatus(item).label }}</span>
          </div>

          <!-- Card body -->
          <div class="card-body">
            <div class="card-category">{{ item.category }}</div>
            <h3 class="card-name">{{ item.name }}</h3>

            <div class="card-meta-list">
              <div class="card-meta-row">
                <span class="meta-icon">📦</span>
                <span class="meta-text">{{ item.quantity }} {{ item.unit }}</span>
              </div>
              <div v-if="item.storageLocation" class="card-meta-row">
                <span class="meta-icon">🗄️</span>
                <span class="meta-text">{{ item.storageLocation }}</span>
              </div>
              <div class="card-meta-row">
                <span class="meta-icon">📅</span>
                <span class="meta-text" v-if="item.status === 'used'">Status: Consumed</span>
                <span class="meta-text" v-else>Expires {{ item.expiryDate }}</span>
              </div>
              <div v-if="item.notes" class="card-meta-row">
                <span class="meta-icon">📝</span>
                <span class="meta-text">{{ item.notes }}</span>
              </div>
            </div>
          </div>

          <!-- Card footer: action buttons -->
          <div class="card-footer">
            <div class="inv-actions">
              <button v-if="item.status !== 'used'" class="btn-action edit" @click="openEditModal(item)" title="Edit">Edit</button>
              <button
                v-if="item.status !== 'used'"
                class="btn-action donate"
                :class="{ 'btn-disabled': !canDonate(item) }"
                :disabled="!canDonate(item)"
                :title="canDonate(item) ? 'Convert to Donation' : 'Can only donate items expiring within 7 days'"
                @click="canDonate(item) && openDonateModal(item)"
              >Donate</button>
              <button v-if="item.status !== 'used'" class="btn-action used" @click="markAsUsed(item)" title="Mark as used">Mark as Used</button>
              <button class="btn-action delete" @click="deleteItem(item)" title="Delete">Delete</button>
            </div>
            <p v-if="item.status !== 'used' && !canDonate(item)" class="donate-hint">
              Donate unlocks when ≤ 7 days to expiry
            </p>
          </div>
        </div>
      </div>

    </div><!-- end .inventory-page -->


    <!-- ══════════════════════════════════════════════════
         MODAL: Add Food Item (FR-2.1)
         Fields: Name, Category, Quantity, Unit,
                 Expiry Date, Storage Location, Notes
    ═══════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
          <div class="modal" role="dialog" aria-labelledby="modal-add-title">

            <div class="modal-header">
              <h3 id="modal-add-title">➕ Add Food Item</h3>
              <button class="modal-close" @click="closeAddModal" aria-label="Close">✕</button>
            </div>

            <!-- Validation Error Banner -->
            <div v-if="addError" class="error-msg">⛔ {{ addError }}</div>

            <div class="modal-body">
              <!-- Food Name (required) -->
              <div class="form-group">
                <label for="add-name">Food Name <span class="required">*</span></label>
                <input
                  id="add-name"
                  v-model="newItem.name"
                  type="text"
                  placeholder="e.g. Fresh Spinach"
                  class="form-input"
                />
              </div>

              <!-- Category (required) -->
              <div class="form-group">
                <label for="add-category">Category <span class="required">*</span></label>
                <select id="add-category" v-model="newItem.category" class="form-input">
                  <option value="" disabled>Select a category</option>
                  <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </div>

              <!-- Quantity + Unit (required) -->
              <div class="form-row">
                <div class="form-group">
                  <label for="add-qty">Quantity <span class="required">*</span></label>
                  <input
                    id="add-qty"
                    v-model.number="newItem.quantity"
                    type="number"
                    min="1"
                    placeholder="e.g. 200"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label for="add-unit">Unit <span class="required">*</span></label>
                  <select id="add-unit" v-model="newItem.unit" class="form-input">
                    <option v-for="u in UNITS" :key="u" :value="u">{{ u }}</option>
                  </select>
                </div>
              </div>

              <!-- Expiry Date (required, must not be in the past) -->
              <div class="form-group">
                <label for="add-expiry">Expiry Date <span class="required">*</span></label>
                <input
                  id="add-expiry"
                  v-model="newItem.expiryDate"
                  type="date"
                  :min="getTodayString()"
                  class="form-input"
                />
              </div>

              <!-- Storage Location (optional) -->
              <div class="form-group">
                <label>Storage Location <span class="optional">(optional)</span></label>
                <div class="radio-group">
                  <label v-for="loc in STORAGE_LOCATIONS" :key="loc" class="radio-label">
                    <input type="radio" v-model="newItem.storageLocation" :value="loc" name="add-storage" />
                    {{ loc }}
                  </label>
                </div>
              </div>

              <!-- Notes (optional) -->
              <div class="form-group">
                <label for="add-notes">Notes <span class="optional">(optional)</span></label>
                <textarea
                  id="add-notes"
                  v-model="newItem.notes"
                  rows="2"
                  placeholder="e.g. Opened on April 18"
                  class="form-input"
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" @click="closeAddModal">Cancel</button>
              <button class="btn-primary" @click="submitAddItem" id="btn-submit-add">Add Item</button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>


    <!-- ══════════════════════════════════════════════════
         MODAL: Edit Food Item (FR-2.2)
    ═══════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showEditModal && editItem" class="modal-overlay" @click.self="closeEditModal">
          <div class="modal" role="dialog" aria-labelledby="modal-edit-title">

            <div class="modal-header">
              <h3 id="modal-edit-title">✏️ Edit Food Item</h3>
              <button class="modal-close" @click="closeEditModal" aria-label="Close">✕</button>
            </div>

            <div v-if="editError" class="error-msg">⛔ {{ editError }}</div>

            <div class="modal-body">
              <div class="form-group">
                <label for="edit-name">Food Name <span class="required">*</span></label>
                <input id="edit-name" v-model="editItem.name" type="text" class="form-input" />
              </div>

              <div class="form-group">
                <label for="edit-category">Category <span class="required">*</span></label>
                <select id="edit-category" v-model="editItem.category" class="form-input">
                  <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="edit-qty">Quantity <span class="required">*</span></label>
                  <input id="edit-qty" v-model.number="editItem.quantity" type="number" min="1" class="form-input" />
                </div>
                <div class="form-group">
                  <label for="edit-unit">Unit</label>
                  <select id="edit-unit" v-model="editItem.unit" class="form-input">
                    <option v-for="u in UNITS" :key="u" :value="u">{{ u }}</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="edit-expiry">Expiry Date <span class="required">*</span></label>
                <input
                  id="edit-expiry"
                  v-model="editItem.expiryDate"
                  type="date"
                  :min="getTodayString()"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Storage Location</label>
                <div class="radio-group">
                  <label v-for="loc in STORAGE_LOCATIONS" :key="loc" class="radio-label">
                    <input type="radio" v-model="editItem.storageLocation" :value="loc" name="edit-storage" />
                    {{ loc }}
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label for="edit-notes">Notes</label>
                <textarea id="edit-notes" v-model="editItem.notes" rows="2" class="form-input"></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" @click="closeEditModal">Cancel</button>
              <button class="btn-primary" @click="submitEditItem" id="btn-submit-edit">Save Changes</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>


    <!-- ══════════════════════════════════════════════════
         MODAL: Donate Item (FR-2.4)
         Converts an inventory item to a donation listing.
         Fields: Pickup Location, Availability
    ═══════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDonateModal && donateTarget" class="modal-overlay" @click.self="closeDonateModal">
          <div class="modal" role="dialog" aria-labelledby="modal-donate-title">

            <div class="modal-header">
              <h3 id="modal-donate-title">🤝 Donate Food Item</h3>
              <button class="modal-close" @click="closeDonateModal" aria-label="Close">✕</button>
            </div>

            <!-- Preview of which item is being donated -->
            <div class="donate-preview">
              Donating: <strong>{{ donateTarget.name }}</strong>
              ({{ donateTarget.quantity }}{{ donateTarget.unit }} · Expires {{ donateTarget.expiryDate }})
            </div>

            <div v-if="donateError" class="error-msg">⛔ {{ donateError }}</div>

            <div class="modal-body">
              <!-- Pickup Location (required) -->
              <div class="form-group">
                <label for="donate-location">Pickup Location <span class="required">*</span></label>
                <input
                  id="donate-location"
                  v-model="donateForm.location"
                  type="text"
                  placeholder="e.g. Jl. Diponegoro No. 12, Denpasar"
                  class="form-input"
                />
              </div>

              <!-- Availability Window (required) -->
              <div class="form-group">
                <label for="donate-avail">Pickup Availability <span class="required">*</span></label>
                <input
                  id="donate-avail"
                  v-model="donateForm.availability"
                  type="text"
                  placeholder="e.g. Weekdays 3PM – 7PM"
                  class="form-input"
                />
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" @click="closeDonateModal">Cancel</button>
              <button class="btn-donate" @click="submitDonate" id="btn-submit-donate">🤝 Post Donation</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>


    <!-- ══════════════════════════════════════════════════
         MODAL: Confirmation (Generic)
    ═══════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showConfirmModal" class="modal-overlay" @click.self="closeConfirmModal">
          <div class="modal" role="dialog" aria-labelledby="modal-confirm-title">
            <div class="modal-header">
              <h3 id="modal-confirm-title">{{ confirmData.title }}</h3>
              <button class="modal-close" @click="closeConfirmModal" aria-label="Close">✕</button>
            </div>
            <div class="modal-body">
              <p style="font-size: 0.9rem; color: #3a4a3a; line-height: 1.5; margin: 0;">{{ confirmData.message }}</p>
            </div>
            <div class="modal-footer">
              <button v-if="confirmData.cancelText" class="btn-secondary" @click="closeConfirmModal">{{ confirmData.cancelText }}</button>
              <button
                :class="confirmData.isDanger ? 'btn-danger' : 'btn-primary'"
                @click="executeConfirm"
              >
                {{ confirmData.confirmText }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </AppLayout>
</template>

<style scoped>
/* ─────────────────────────────────────────────
   INVENTORY PAGE  – matches Dashboard.vue theme
   Font: Inter (loaded in style.css)
   Colors: same as Dashboard (white panels,
           green accent #2da12b, clean borders)
───────────────────────────────────────────── */

/* ── Page wrapper ── */
.inventory-page {
  padding: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Page Header ── */
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
  /* Override global h1 gradient */
  background: none;
  -webkit-text-fill-color: unset;
  margin-bottom: 3px;
  line-height: 1.2;
}
.sub { font-size: 0.78rem; color: #9aaa9a; }

/* ── Summary Cards Row (same as Dashboard) ── */
.cards-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}
.summary-card {
  background: var(--card-bg, #fff);
  border: 1px solid #e8ede8;
  border-radius: 14px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: transform 0.2s, box-shadow 0.2s;
}
.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.07);
}
.card-icon  { font-size: 1.6rem; line-height: 1; }
.card-value { font-size: 1.6rem; font-weight: 900; color: var(--card-color, #3b82f6); line-height: 1; }
.card-label { font-size: 0.75rem; font-weight: 700; color: #2a2a2a; margin-top: 3px; }
.card-unit  { font-size: 0.65rem; color: #9aaa9a; }

/* ── Controls Bar (Filter + Sort) ── */
.controls-bar {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.control-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
  white-space: nowrap;
}
.select-control {
  padding: 6px 10px;
  border: 1.5px solid #e8ede8;
  border-radius: 8px;
  font-size: 0.82rem;
  font-family: inherit;
  background: #fff;
  color: #1a1a1a;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}
.select-control:focus { border-color: #2da12b; }

/* ── Panel (same style as Dashboard .panel) ── */
.panel {
  background: #fff;
  border: 1px solid #e8ede8;
  border-radius: 16px;
  padding: 1.1rem;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.9rem;
}
.panel-head h2 {
  font-size: 0.92rem;
  font-weight: 700;
  color: #1a1a1a;
}
.item-count {
  font-size: 0.75rem;
  color: #9aaa9a;
  background: #f0f4f0;
  padding: 2px 10px;
  border-radius: 99px;
}

/* ── Empty State ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2.5rem 1rem;
  text-align: center;
}
.empty-icon { font-size: 2.5rem; }
.empty-state p { font-size: 0.88rem; color: #7a8a7a; }

/* ── Food cards grid (matches BrowseFood) ── */
.food-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.food-card {
  background: #fff;
  border: 1.5px solid #e8ede8;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.food-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(0,0,0,0.09);
  border-color: #c8dcc8;
}
.food-card.urgent {
  border-left: 3px solid #ef4444;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1rem 0.75rem;
}
.food-icon { font-size: 2rem; line-height: 1; }
.urgency-chip {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 99px;
  border: 1px solid;
  white-space: nowrap;
}

.card-body {
  padding: 0 1rem 0.75rem;
  flex: 1;
}
.card-category {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #2da12b;
  margin-bottom: 4px;
}
.card-name {
  font-size: 1rem;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 0.65rem;
  line-height: 1.25;
  background: none;
  -webkit-text-fill-color: unset;
}

.card-meta-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.card-meta-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.meta-icon { font-size: 0.82rem; flex-shrink: 0; line-height: 1.5; }
.meta-text {
  font-size: 0.78rem;
  color: #5a6a5a;
  line-height: 1.45;
}

.card-footer {
  padding: 0 1rem 1rem;
}

/* Donate hint text */
.donate-hint {
  margin-top: 6px;
  font-size: 0.68rem;
  color: #f59e0b;
  font-weight: 600;
}

/* Disabled donate button */
.btn-action.btn-disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.btn-action.btn-disabled:hover {
  opacity: 0.35;
  transform: none;
}

/* Action buttons inside inventory card */
.inv-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.btn-action {
  padding: 5px 10px;
  font-size: 0.72rem;
  font-weight: 700;
  font-family: inherit;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  transition: opacity 0.18s, transform 0.15s;
  white-space: nowrap;
}
.btn-action:hover { opacity: 0.8; transform: translateY(-1px); }
.btn-action:active { transform: scale(0.95); }

.btn-action.edit   { background: #eff6ff; color: #3b82f6; }
.btn-action.donate { background: #f0faf0; color: #43c73a; }
.btn-action.used   { background: #f0fdf4; color: #16a34a; }

.btn-action.delete { background: #fef2f2; color: #ef4444; font-size: 0.85rem; padding: 5px 8px; }

/* ── Primary & Secondary Buttons ── */
.btn-primary {
  background: #2da12b;
  color: #fff;
  border: none;
  padding: 9px 18px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: inherit;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
  white-space: nowrap;
}
.btn-primary:hover { background: #25881f; transform: translateY(-1px); }
.btn-primary:active { transform: scale(0.97); }

.btn-secondary {
  background: #f0f4f0;
  color: #3a4a3a;
  border: none;
  padding: 9px 18px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: inherit;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-secondary:hover { background: #e2e8e2; }

.btn-donate {
  background: #2da12b;
  color: #fff;
  border: none;
  padding: 9px 18px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: inherit;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-donate:hover { background: #25881f; }

.btn-danger {
  background: #ef4444;
  color: #fff;
  border: none;
  padding: 9px 18px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: inherit;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
  white-space: nowrap;
}
.btn-danger:hover { background: #dc2626; transform: translateY(-1px); }
.btn-danger:active { transform: scale(0.97); }

/* ── Modal Overlay ── */
.modal-overlay {
  position: fixed;
  inset: 0;                       /* top/right/bottom/left all = 0 */
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

/* ── Modal Box ── */
.modal {
  background: #fff;
  border-radius: 18px;
  width: 100%;
  max-width: 460px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.25rem 0.75rem;
  border-bottom: 1px solid #f0f4f0;
}
.modal-header h3 {
  font-size: 1rem;
  font-weight: 800;
  color: #1a1a1a;
}
.modal-close {
  background: #f0f4f0;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.modal-close:hover { background: #e2e8e2; }

.modal-body {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  padding: 0.85rem 1.25rem 1.1rem;
  border-top: 1px solid #f0f4f0;
}

/* ── Donate Preview Box ── */
.donate-preview {
  margin: 0 1.25rem;
  padding: 10px 14px;
  background: #f0faf0;
  border: 1px solid #c6e8c5;
  border-radius: 8px;
  font-size: 0.83rem;
  color: #2a4a2a;
  margin-top: 0.75rem;
}

/* ── Form Elements ── */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}
label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #3a4a3a;
}
.required { color: #ef4444; }
.optional { font-size: 0.72rem; font-weight: 400; color: #9aaa9a; }

.form-input {
  padding: 9px 12px;
  border: 1.5px solid #e8ede8;
  border-radius: 9px;
  font-size: 0.85rem;
  font-family: inherit;
  color: #1a1a1a;
  background: #fff;
  outline: none;
  transition: border-color 0.2s;
  resize: vertical;
}
.form-input:focus { border-color: #2da12b; box-shadow: 0 0 0 3px rgba(45,161,43,0.1); }

/* ── Radio Group for Storage Location ── */
.radio-group {
  display: flex;
  gap: 1.25rem;
  margin-top: 5px;
}
.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #1a1a1a;
  cursor: pointer;
}
.radio-label input[type="radio"] {
  accent-color: #2da12b;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* ── Validation Error Banner ── */
.error-msg {
  margin: 0.5rem 1.25rem 0;
  padding: 9px 13px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 0.82rem;
  color: #b91c1c;
  font-weight: 600;
}

/* ── Toast Notification ── */
.toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 11px 22px;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: inherit;
  z-index: 2000;
  box-shadow: 0 6px 24px rgba(0,0,0,0.15);
  white-space: nowrap;
  pointer-events: none;
}
.toast.success { background: #2da12b; color: #fff; }
.toast.info    { background: #3b82f6; color: #fff; }
.toast.error   { background: #ef4444; color: #fff; }

/* ── Vue Transition: Modal Fade ── */
.fade-enter-active { transition: opacity 0.2s ease; }
.fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Vue Transition: Toast Slide Up ── */
.slide-up-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.slide-up-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.slide-up-enter-from   { opacity: 0; transform: translateX(-50%) translateY(16px); }
.slide-up-leave-to     { opacity: 0; transform: translateX(-50%) translateY(16px); }

/* ── MOBILE RESPONSIVE ── */
@media (max-width: 860px) {
  .inventory-page { padding: 1rem; gap: 1rem; }
  .page-header h1 { font-size: 1.2rem; }
  .cards-row { grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; }
  .food-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
}

@media (max-width: 600px) {
  .cards-row { grid-template-columns: 1fr; }
  .food-grid { grid-template-columns: 1fr; }
  .inv-actions { gap: 0.3rem; }
  .btn-action { padding: 5px 7px; font-size: 0.68rem; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
