<script setup>
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Inventory.vue  â€“  Use Case 2: Manage Food Inventory
// Allows users to add, edit, mark as used, donate, and
// delete food items from their personal household inventory.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useNotifications } from '@/composables/useNotifications'
import { useToast } from '@/composables/useToast'
import { authService } from '@/services/authService'
import {
  items, isLoading as itemsLoading,
  fetchItems, addItem as apiAddItem, updateItem as apiUpdateItem,
  deleteItem as apiDeleteItem, markAsUsed as apiMarkUsed, donateItem as apiDonateItem,
  getTodayString, daysUntilExpiry, getExpiryStatus,
} from '@/services/inventoryService'
import { createDonation } from '@/services/donationService'

const emit = defineEmits(['navigate'])

const { unreadCount } = useNotifications()
const { showToast } = useToast()
const router = useRouter()

// â”€â”€ Fetch items on mount â”€â”€
onMounted(async () => {
  try {
    await fetchItems()
  } catch {
    showToast('Failed to load inventory. Please try again.', 'warning')
  }
})

// â”€â”€ CONSTANTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CATEGORIES = ['Vegetables', 'Dairy', 'Canned', 'Frozen', 'Bakery', 'Other']
const STORAGE_LOCATIONS = ['Fridge', 'Freezer', 'Pantry']
const UNITS = ['pcs', 'g', 'kg', 'ml', 'L']

// â”€â”€ COMPUTED: Summary Info Boxes â”€â”€
const summaryCards = computed(() => {
  const active = items.value.filter(i => i.status === 'available')
  const expiringSoon = active.filter(i => daysUntilExpiry(i.expiryDate) <= 3)
  const usedCount = items.value.filter(i => i.status === 'used').length

  return [
    { label: 'Total Items', value: active.length, unit: 'in inventory', icon: 'ðŸ“¦', color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Expiring Soon', value: expiringSoon.length, unit: 'within 3 days', icon: 'âš ï¸', color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Items Used', value: usedCount, unit: 'saved from waste', icon: 'âœ…', color: '#22c55e', bg: '#f0fdf4' },
  ]
})

// â”€â”€ FILTER / SORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const sortOption = ref('expiryDate')
const filterCategory = ref('All')
const filterStatus = ref('available')

const filteredItems = computed(() => {
  let list = items.value.filter(i => i.status === filterStatus.value)

  if (filterCategory.value !== 'All') {
    list = list.filter(i => i.category === filterCategory.value)
  }

  if (sortOption.value === 'name') {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortOption.value === 'category') {
    list = [...list].sort((a, b) => a.category.localeCompare(b.category))
  } else if (sortOption.value === 'dateAdded') {
    list = [...list].sort((a, b) => (b.id || '').localeCompare(a.id || ''))
  } else {
    list = [...list].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
  }
  return list
})

// â”€â”€ ADD FOOD ITEM MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const showAddModal = ref(false)
const newItem = ref(createEmptyItem())
const addError = ref('')

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

async function submitAddItem() {
  if (!newItem.value.name.trim()) { addError.value = 'Item name is required.'; return }
  if (!newItem.value.category) { addError.value = 'Please select a category.'; return }
  if (!newItem.value.quantity || newItem.value.quantity <= 0) { addError.value = 'Quantity must be a positive number.'; return }
  if (!newItem.value.expiryDate) { addError.value = 'Expiry date is required.'; return }
  if (newItem.value.expiryDate < getTodayString()) { addError.value = 'Expiry date cannot be in the past.'; return }

  try {
    await apiAddItem({
      name: newItem.value.name.trim(),
      category: newItem.value.category,
      quantity: Number(newItem.value.quantity),
      unit: newItem.value.unit,
      expiryDate: newItem.value.expiryDate,
      storageLocation: newItem.value.storageLocation,
      notes: newItem.value.notes,
    })
    showToast('Food item added successfully.', 'success')
    closeAddModal()
  } catch (err) {
    addError.value = err.message || 'Failed to add item.'
  }
}

// â”€â”€ EDIT ITEM MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const showEditModal = ref(false)
const editItem = ref(null)
const editError = ref('')

function openEditModal(item) {
  editItem.value = { ...item }
  editError.value = ''
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editItem.value = null
}

async function submitEditItem() {
  if (!editItem.value.name.trim()) { editError.value = 'Item name is required.'; return }
  if (!editItem.value.expiryDate) { editError.value = 'Expiry date is required.'; return }
  if (editItem.value.expiryDate < getTodayString()) { editError.value = 'Expiry date cannot be in the past.'; return }

  try {
    await apiUpdateItem(editItem.value)
    showToast('Food item updated successfully.', 'success')
    closeEditModal()
  } catch (err) {
    editError.value = err.message || 'Failed to update item.'
  }
}

// â”€â”€ CONFIRM MODAL LOGIC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const showConfirmModal = ref(false)
const confirmData = ref({
  title: '', message: '', confirmText: '', cancelText: 'Cancel', onConfirm: null, isDanger: false
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
  if (confirmData.value.onConfirm) confirmData.value.onConfirm()
  closeConfirmModal()
}

// â”€â”€ MARK AS USED â”€â”€
function markAsUsed(item) {
  openConfirmModal({
    title: 'Mark as Used',
    message: `Mark "${item.name}" as fully used? This will update your savings record.`,
    confirmText: 'Mark as Used',
    onConfirm: async () => {
      try {
        await apiMarkUsed(item.id)
        showToast(`Great job! ${item.name} has been marked as used.`, 'success')
      } catch { showToast('Failed to mark item as used.', 'warning') }
    }
  })
}

// â”€â”€ DELETE ITEM â”€â”€
function deleteItem(item) {
  if (item.status === 'reserved') {
    openConfirmModal({
      title: 'Action Denied',
      message: 'This item is reserved for your meal plan. Please remove it from the plan before deleting.',
      confirmText: 'OK', cancelText: '', onConfirm: () => { }
    })
    return
  }

  openConfirmModal({
    title: 'Delete Item',
    message: `Are you sure you want to remove ${item.name} from your inventory? This cannot be undone.`,
    confirmText: 'Delete', isDanger: true,
    onConfirm: async () => {
      try {
        await apiDeleteItem(item.id)
        showToast('Item removed from inventory.', 'success')
      } catch { showToast('Failed to delete item.', 'warning') }
    }
  })
}

// â”€â”€ DONATE MODAL â”€â”€
const showDonateModal = ref(false)
const donateTarget = ref(null)
const donateForm = ref({ location: '', availability: '' })
const donateError = ref('')

function openDonateModal(item) {
  donateTarget.value = item
  donateForm.value = { location: '', availability: '' }
  donateError.value = ''
  showDonateModal.value = true
}

function closeDonateModal() {
  showDonateModal.value = false
  donateTarget.value = null
}

async function submitDonate() {
  if (!donateForm.value.location.trim()) { donateError.value = 'Pickup location is required.'; return }
  if (!donateForm.value.availability.trim()) { donateError.value = 'Availability details are required.'; return }

  try {
    // Create the donation listing on the server
    await createDonation({
      name: donateTarget.value.name,
      qty: `${donateTarget.value.quantity} ${donateTarget.value.unit}`,
      category: donateTarget.value.category,
      expiryDate: donateTarget.value.expiryDate,
      storageType: donateTarget.value.storageLocation || 'Pantry',
      pickupLocation: donateForm.value.location.trim(),
      availability: donateForm.value.availability.trim(),
      notes: donateTarget.value.notes || '',
    })
    // Update inventory item status to 'donated'
    await apiDonateItem(donateTarget.value.id)
    showToast('Item ready for donation. Go to Browse Food to post it publicly.', 'success')
    closeDonateModal()
  } catch (err) {
    donateError.value = err.message || 'Failed to create donation listing.'
  }
}

// â”€â”€ CATEGORY ICON HELPER â”€â”€
function categoryIcon(category) {
  const map = {
    Vegetables: 'ðŸ¥¬', Dairy: 'ðŸ¥›', Canned: 'ðŸ¥«', Frozen: 'ðŸ§Š',
    Vegetables: '🥦', Dairy: '🧀', Canned: '🥫', Frozen: '🧊',
    Bakery: '🍞', Fruits: '🍎', Protein: '🥚', Grains: '🌾', Other: '📦',
  }
  return map[category] ?? '🍽️'
}

// ── DONATE ELIGIBILITY ──
const DONATE_THRESHOLD_DAYS = 7
function canDonate(item) {
  return daysUntilExpiry(item.expiryDate) <= DONATE_THRESHOLD_DAYS
}

// ── MEAL PLAN ELIGIBILITY ──
function canAddToMealPlan(item) {
  return item.status === 'available' && daysUntilExpiry(item.expiryDate) >= 0
}

function goToMealPlan(item) {
  showToast(`Navigate to Meal Planner to use "${item.name}" in your meals.`, 'success')
  router.push({ name: 'meal-planner' })
}
</script>

<template>
  <AppLayout current-page="inventory" :unread-count="unreadCount" user-name="Adrienne Kayana"
    @navigate="emit('navigate', $event)">
    <div class="inventory-page">

      <!-- â•â• PAGE HEADER â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
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

      <!-- â•â• INFO BOXES (Summary Cards) â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
      <!-- Match Dashboard summary card style -->
      <div class="cards-row">
        <div v-for="card in summaryCards" :key="card.label" class="summary-card"
          :style="{ '--card-color': card.color, '--card-bg': card.bg }">
          <div class="card-icon">{{ card.icon }}</div>
          <div class="card-body">
            <div class="card-value">{{ card.value }}</div>
            <div class="card-label">{{ card.label }}</div>
            <div class="card-unit">{{ card.unit }}</div>
          </div>
        </div>
      </div>

      <!-- â•â• FILTER & SORT BAR â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
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

      <!-- â•â• INVENTORY LIST â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
      <div class="panel-head">
        <h2>Inventory Items</h2>
        <span class="item-count">{{ filteredItems.length }} item(s)</span>
      </div>

      <!-- Empty state (NFR-US-4 / FR-4.5) -->
      <div v-if="filteredItems.length === 0" class="empty-state">
        <div class="empty-icon">ðŸ¥¡</div>
        <p>No items found. Try adjusting your filters or add a new food item!</p>
        <button class="btn-primary" @click="openAddModal">+ Add Food Item</button>
      </div>

      <!-- Item grid (matches BrowseFood card layout) -->
      <div v-else class="food-grid">
        <div v-for="item in filteredItems" :key="item.id" class="food-card"
          :class="{ urgent: item.status !== 'used' && daysUntilExpiry(item.expiryDate) <= 2 }"
          :style="{ '--card-bg': getExpiryStatus(item).bgColor }">
          <!-- Card top: icon + expiry badge -->
          <div class="card-top" :style="{ background: getExpiryStatus(item).bgColor }">
            <span class="food-icon">{{ categoryIcon(item.category) }}</span>
            <span class="urgency-chip" :style="{
              background: getExpiryStatus(item).color + '18',
              color: getExpiryStatus(item).color,
              borderColor: getExpiryStatus(item).color + '40'
            }">{{ getExpiryStatus(item).label }}</span>
          </div>

          <!-- Card body -->
          <div class="card-body">
            <div class="card-category">{{ item.category }}</div>
            <h3 class="card-name">{{ item.name }}</h3>

            <div class="card-meta-list">
              <div class="card-meta-row">
                <span class="meta-icon">ðŸ“¦</span>
                <span class="meta-text">{{ item.quantity }} {{ item.unit }}</span>
              </div>
              <div v-if="item.storageLocation" class="card-meta-row">
                <span class="meta-icon">ðŸ—„ï¸</span>
                <span class="meta-text">{{ item.storageLocation }}</span>
              </div>
              <div class="card-meta-row">
                <span class="meta-icon">ðŸ“…</span>
                <span class="meta-text" v-if="item.status === 'used'">Status: Consumed</span>
                <span class="meta-text" v-else>Expires {{ item.expiryDate }}</span>
              </div>
              <div v-if="item.notes" class="card-meta-row">
                <span class="meta-icon">ðŸ“</span>
                <span class="meta-text">{{ item.notes }}</span>
              </div>
            </div>
          </div>

          <!-- Card footer: action buttons -->
          <div class="card-footer">
            <div class="inv-actions">
              <button v-if="item.status !== 'used'" class="btn-action edit" @click="openEditModal(item)"
                title="Edit">Edit</button>
              <button v-if="canAddToMealPlan(item)" class="btn-action meal" title="Add to Meal Plan"
                @click="goToMealPlan(item)">Add to Meal Plan</button>
              <button v-if="item.status !== 'used'" class="btn-action donate"
                :class="{ 'btn-disabled': !canDonate(item) }" :disabled="!canDonate(item)"
                :title="canDonate(item) ? 'Convert to Donation' : 'Can only donate items expiring within 7 days'"
                @click="canDonate(item) && openDonateModal(item)">Donate</button>
              <button v-if="item.status !== 'used'" class="btn-action used" @click="markAsUsed(item)"
                title="Mark as used">Mark as Used</button>
              <button class="btn-action delete" @click="deleteItem(item)" title="Delete">Delete</button>
            </div>
            <p v-if="item.status !== 'used' && !canDonate(item)" class="donate-hint">
              Donate unlocks when â‰¤ 7 days to expiry
            </p>
          </div>
        </div>
      </div>

    </div><!-- end .inventory-page -->


    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         MODAL: Add Food Item (FR-2.1)
         Fields: Name, Category, Quantity, Unit,
                 Expiry Date, Storage Location, Notes
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
          <div class="modal" role="dialog" aria-labelledby="modal-add-title">

            <div class="modal-header">
              <h3 id="modal-add-title">âž• Add Food Item</h3>
              <button class="modal-close" @click="closeAddModal" aria-label="Close">âœ•</button>
            </div>

            <!-- Validation Error Banner -->
            <div v-if="addError" class="error-msg">â›” {{ addError }}</div>

            <div class="modal-body">
              <!-- Food Name (required) -->
              <div class="form-group">
                <label for="add-name">Food Name <span class="required">*</span></label>
                <input id="add-name" v-model="newItem.name" type="text" placeholder="e.g. Fresh Spinach"
                  class="form-input" />
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
                  <input id="add-qty" v-model.number="newItem.quantity" type="number" min="1" placeholder="e.g. 200"
                    class="form-input" />
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
                <input id="add-expiry" v-model="newItem.expiryDate" type="date" :min="getTodayString()"
                  class="form-input" />
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
                <textarea id="add-notes" v-model="newItem.notes" rows="2" placeholder="e.g. Opened on April 18"
                  class="form-input"></textarea>
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


    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         MODAL: Edit Food Item (FR-2.2)
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showEditModal && editItem" class="modal-overlay" @click.self="closeEditModal">
          <div class="modal" role="dialog" aria-labelledby="modal-edit-title">

            <div class="modal-header">
              <h3 id="modal-edit-title">âœï¸ Edit Food Item</h3>
              <button class="modal-close" @click="closeEditModal" aria-label="Close">âœ•</button>
            </div>

            <div v-if="editError" class="error-msg">â›” {{ editError }}</div>

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
                <input id="edit-expiry" v-model="editItem.expiryDate" type="date" :min="getTodayString()"
                  class="form-input" />
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


    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         MODAL: Donate Item (FR-2.4)
         Converts an inventory item to a donation listing.
         Fields: Pickup Location, Availability
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDonateModal && donateTarget" class="modal-overlay" @click.self="closeDonateModal">
          <div class="modal" role="dialog" aria-labelledby="modal-donate-title">

            <div class="modal-header">
              <h3 id="modal-donate-title">ðŸ¤ Donate Food Item</h3>
              <button class="modal-close" @click="closeDonateModal" aria-label="Close">âœ•</button>
            </div>

            <!-- Preview of which item is being donated -->
            <div class="donate-preview">
              Donating: <strong>{{ donateTarget.name }}</strong>
              ({{ donateTarget.quantity }}{{ donateTarget.unit }} Â· Expires {{ donateTarget.expiryDate }})
            </div>

            <div v-if="donateError" class="error-msg">â›” {{ donateError }}</div>

            <div class="modal-body">
              <!-- Pickup Location (required) -->
              <div class="form-group">
                <label for="donate-location">Pickup Location <span class="required">*</span></label>
                <input id="donate-location" v-model="donateForm.location" type="text"
                  placeholder="e.g. Jl. Diponegoro No. 12, Denpasar" class="form-input" />
              </div>

              <!-- Availability Window (required) -->
              <div class="form-group">
                <label for="donate-avail">Pickup Availability <span class="required">*</span></label>
                <input id="donate-avail" v-model="donateForm.availability" type="text"
                  placeholder="e.g. Weekdays 3PM â€“ 7PM" class="form-input" />
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" @click="closeDonateModal">Cancel</button>
              <button class="btn-donate" @click="submitDonate" id="btn-submit-donate">ðŸ¤ Post Donation</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>


    <!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         MODAL: Confirmation (Generic)
    â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showConfirmModal" class="modal-overlay" @click.self="closeConfirmModal">
          <div class="modal" role="dialog" aria-labelledby="modal-confirm-title">
            <div class="modal-header">
              <h3 id="modal-confirm-title">{{ confirmData.title }}</h3>
              <button class="modal-close" @click="closeConfirmModal" aria-label="Close">âœ•</button>
            </div>
            <div class="modal-body">
              <p style="font-size: 0.9rem; color: #3a4a3a; line-height: 1.5; margin: 0;">{{ confirmData.message }}</p>
            </div>
            <div class="modal-footer">
              <button v-if="confirmData.cancelText" class="btn-secondary" @click="closeConfirmModal">{{
                confirmData.cancelText }}</button>
              <button :class="confirmData.isDanger ? 'btn-danger' : 'btn-primary'" @click="executeConfirm">
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
/* â”€â”€ Page wrapper â”€â”€ */
.inventory-page {
  padding: 1.75rem 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  font-family: 'Inter', sans-serif;
}

/* â”€â”€ Page Header â”€â”€ */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.header-text {
  flex: 1;
  min-width: 0;
}

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

.sub {
  font-size: 0.78rem;
  color: #9ca3af;
  font-weight: 500;
}

/* â”€â”€ Summary Cards Row â”€â”€ */
.cards-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.875rem;
}

.summary-card {
  background: var(--card-bg, #fff);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 14px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms;
  cursor: default;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.card-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
}

.card-value {
  font-size: 1.65rem;
  font-weight: 900;
  color: var(--card-color, #3b82f6);
  line-height: 1;
  letter-spacing: -0.03em;
}

.card-label {
  font-size: 0.73rem;
  font-weight: 700;
  color: #374151;
  margin-top: 3px;
  letter-spacing: -0.01em;
}

.card-unit {
  font-size: 0.63rem;
  color: #9ca3af;
  font-weight: 500;
}

/* â”€â”€ Controls Bar â”€â”€ */
.controls-bar {
  display: flex;
  gap: 0.875rem;
  align-items: center;
  flex-wrap: wrap;
  padding: 0.875rem 1rem;
  background: #fff;
  border: 1px solid #e6ece6;
  border-radius: 12px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #6b7280;
  white-space: nowrap;
}

.select-control {
  padding: 6px 10px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.8rem;
  font-family: inherit;
  background: #f9fafb;
  color: #111827;
  cursor: pointer;
  outline: none;
  transition: border-color 150ms, box-shadow 150ms;
}

.select-control:hover {
  border-color: #d1d5db;
}

.select-control:focus {
  border-color: #2da12b;
  box-shadow: 0 0 0 3px rgba(45, 161, 43, 0.12);
  background: #fff;
}

/* â”€â”€ Panel Head â”€â”€ */
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0;
}

.panel-head h2 {
  font-size: 0.9rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.01em;
}

.item-count {
  font-size: 0.73rem;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 2px 10px;
  border-radius: 99px;
  font-weight: 500;
}

/* â”€â”€ Empty State â”€â”€ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.875rem;
  padding: 3rem 1rem;
  text-align: center;
  background: #fff;
  border: 1px solid #e6ece6;
  border-radius: 16px;
}

.empty-icon {
  font-size: 2.75rem;
}

.empty-state p {
  font-size: 0.88rem;
  color: #6b7280;
  line-height: 1.5;
}

/* â”€â”€ Food cards grid â”€â”€ */
.food-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.food-card {
  background: #fff;
  border: 1.5px solid #e6ece6;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms, border-color 150ms;
}

.food-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.09);
  border-color: #bcd8bc;
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

.food-icon {
  font-size: 2rem;
  line-height: 1;
}

.urgency-chip {
  font-size: 0.67rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 99px;
  border: 1px solid;
  white-space: nowrap;
  letter-spacing: 0.01em;
}

.card-body {
  padding: 0 1rem 0.75rem;
  flex: 1;
}

.card-category {
  font-size: 0.63rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #2da12b;
  margin-bottom: 4px;
}

.card-name {
  font-size: 0.98rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.625rem;
  line-height: 1.25;
  background: none;
  -webkit-text-fill-color: unset;
  letter-spacing: -0.01em;
}

.card-meta-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.card-meta-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.meta-icon {
  font-size: 0.78rem;
  flex-shrink: 0;
  line-height: 1.5;
}

.meta-text {
  font-size: 0.76rem;
  color: #6b7280;
  line-height: 1.45;
}

.card-footer {
  padding: 0 1rem 1rem;
}

/* Donate hint text */
.donate-hint {
  margin-top: 5px;
  font-size: 0.66rem;
  color: #d97706;
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
  font-size: 0.71rem;
  font-weight: 700;
  font-family: inherit;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  transition: opacity 150ms, transform 150ms cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
  min-height: 28px;
}

.btn-action:hover:not(.btn-disabled) {
  opacity: 0.8;
  transform: translateY(-1px);
}

.btn-action:active:not(.btn-disabled) {
  transform: scale(0.96);
  opacity: 1;
}

.btn-action:focus-visible {
  outline: 2px solid #2da12b;
  outline-offset: 2px;
}

.btn-action.edit {
  background: #eff6ff;
  color: #3b82f6;
}

.btn-action.meal {
  background: #eef2ff;
  color: #6366f1;
}

.btn-action.donate {
  background: #f0faf0;
  color: #2da12b;
}

.btn-action.used {
  background: #f0fdf4;
  color: #16a34a;
}

.btn-action.delete {
  background: #fef2f2;
  color: #ef4444;
}

/* â”€â”€ Primary & Secondary Buttons â”€â”€ */
.btn-primary {
  background: linear-gradient(135deg, #2da12b, #22c55e);
  color: #fff;
  border: none;
  padding: 9px 18px;
  font-size: 0.84rem;
  font-weight: 700;
  font-family: inherit;
  border-radius: 9px;
  cursor: pointer;
  transition: opacity 150ms, transform 150ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(45, 161, 43, 0.2);
  letter-spacing: -0.01em;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(45, 161, 43, 0.28);
}

.btn-primary:active {
  transform: scale(0.97);
  opacity: 1;
}

.btn-primary:focus-visible {
  outline: 2px solid #2da12b;
  outline-offset: 3px;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1.5px solid #e5e7eb;
  padding: 9px 18px;
  font-size: 0.84rem;
  font-weight: 700;
  font-family: inherit;
  border-radius: 9px;
  cursor: pointer;
  transition: background 150ms, border-color 150ms;
  letter-spacing: -0.01em;
}

.btn-secondary:hover {
  background: #e9eaec;
  border-color: #d1d5db;
}

.btn-secondary:focus-visible {
  outline: 2px solid #2da12b;
  outline-offset: 3px;
}

.btn-donate {
  background: linear-gradient(135deg, #2da12b, #22c55e);
  color: #fff;
  border: none;
  padding: 9px 18px;
  font-size: 0.84rem;
  font-weight: 700;
  font-family: inherit;
  border-radius: 9px;
  cursor: pointer;
  transition: opacity 150ms, transform 150ms;
  box-shadow: 0 2px 8px rgba(45, 161, 43, 0.2);
  letter-spacing: -0.01em;
}

.btn-donate:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-donate:focus-visible {
  outline: 2px solid #2da12b;
  outline-offset: 3px;
}

.btn-danger {
  background: #ef4444;
  color: #fff;
  border: none;
  padding: 9px 18px;
  font-size: 0.84rem;
  font-weight: 700;
  font-family: inherit;
  border-radius: 9px;
  cursor: pointer;
  transition: background 150ms, transform 150ms, box-shadow 150ms;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.28);
}

.btn-danger:active {
  transform: scale(0.97);
}

.btn-danger:focus-visible {
  outline: 2px solid #ef4444;
  outline-offset: 3px;
}

/* â”€â”€ Modal Overlay â”€â”€ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

/* â”€â”€ Modal Box â”€â”€ */
.modal {
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 460px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18), 0 4px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  border: 1px solid #e6ece6;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.25rem 0.875rem;
  border-bottom: 1px solid #f0f4f0;
}

.modal-header h3 {
  font-size: 1rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.01em;
}

.modal-close {
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 0.78rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms, color 150ms;
  color: #6b7280;
}

.modal-close:hover {
  background: #e5e7eb;
  color: #111827;
}

.modal-close:focus-visible {
  outline: 2px solid #2da12b;
  outline-offset: 2px;
}

.modal-body {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  padding: 0.875rem 1.25rem 1.1rem;
  border-top: 1px solid #f0f4f0;
}

/* â”€â”€ Donate Preview Box â”€â”€ */
.donate-preview {
  margin: 0 1.25rem;
  padding: 10px 14px;
  background: #f0faf0;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  font-size: 0.83rem;
  color: #166534;
  margin-top: 0.75rem;
  line-height: 1.5;
}

/* â”€â”€ Form Elements â”€â”€ */
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
  color: #374151;
  letter-spacing: -0.01em;
}

.required {
  color: #ef4444;
}

.optional {
  font-size: 0.72rem;
  font-weight: 400;
  color: #9ca3af;
}

.form-input {
  padding: 9px 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 9px;
  font-size: 0.85rem;
  font-family: inherit;
  color: #111827;
  background: #f9fafb;
  outline: none;
  transition: border-color 150ms, box-shadow 150ms, background 150ms;
  resize: vertical;
}

.form-input:hover {
  border-color: #d1d5db;
}

.form-input:focus {
  border-color: #2da12b;
  box-shadow: 0 0 0 3px rgba(45, 161, 43, 0.12);
  background: #fff;
}

/* â”€â”€ Radio Group for Storage Location â”€â”€ */
.radio-group {
  display: flex;
  gap: 1.25rem;
  margin-top: 5px;
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.84rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
}

.radio-label input[type="radio"] {
  accent-color: #2da12b;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* â”€â”€ Validation Error Banner â”€â”€ */
.error-msg {
  margin: 0.5rem 1.25rem 0;
  padding: 9px 13px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 9px;
  font-size: 0.81rem;
  color: #b91c1c;
  font-weight: 600;
}

/* â”€â”€ Vue Transition: Modal Fade â”€â”€ */
.fade-enter-active {
  transition: opacity 200ms ease;
}

.fade-leave-active {
  transition: opacity 150ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* â”€â”€ MOBILE RESPONSIVE â”€â”€ */
@media (max-width: 860px) {
  .inventory-page {
    padding: 1rem;
    gap: 1rem;
  }

  .page-header h1 {
    font-size: 1.2rem;
  }

  .cards-row {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.5rem;
  }

  .food-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .controls-bar {
    padding: 0.75rem;
    gap: 0.625rem;
  }
}

@media (max-width: 600px) {
  .cards-row {
    grid-template-columns: 1fr;
  }

  .food-grid {
    grid-template-columns: 1fr;
  }

  .inv-actions {
    gap: 0.3rem;
  }

  .btn-action {
    padding: 5px 7px;
    font-size: 0.67rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
