<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useToast } from '@/composables/useToast'
import { useNotifications } from '@/composables/useNotifications'
import { authService } from '@/services/authService'

const router = useRouter()

const { showToast } = useToast()
const { unreadCount } = useNotifications()

const userName = ref('Adrienne Kayana')

// ── Account Information ──
const userEmail = ref('adrienne@example.com')
const editMode  = ref(false)
const editName  = ref(userName.value)
const editEmail = ref(userEmail.value)

function startEdit() {
  editName.value  = userName.value
  editEmail.value = userEmail.value
  editMode.value  = true
}
function saveEdit() {
  userName.value  = editName.value
  userEmail.value = editEmail.value
  editMode.value  = false
  showToast('Profile updated successfully', 'success', '👤')
}
function cancelEdit() {
  editMode.value = false
}

// ── Security Settings ──
const twoFactorEnabled = ref(false)

function toggle2FA() {
  twoFactorEnabled.value = !twoFactorEnabled.value
  showToast(
    twoFactorEnabled.value ? '2FA enabled — your account is more secure' : '2FA disabled',
    twoFactorEnabled.value ? 'success' : 'warning',
    '🔐'
  )
}

// ── Visibility Settings ── (FR-1.4)
const donationVisibility = ref('public')  // 'public' | 'community' | 'private'
const showFullName = ref(true)
const showLocation = ref(true)

const visibilityOptions = ref([
  { id: 'public-profile',   label: 'Public Profile',           desc: 'Let others find your profile',               enabled: true  },
  { id: 'show-activity',    label: 'Show Recent Activity',     desc: "Share what you've been saving lately",        enabled: true  },
])

const donationVisibilityOptions = [
  { value: 'public',    label: 'Public',          desc: 'Anyone can see your donation listings' },
  { value: 'community', label: 'Community Only',  desc: 'Only registered SavePlate users can see your listings' },
  { value: 'private',   label: 'Private',         desc: 'Only you can see your donation listings' },
]

function setDonationVisibility(val) {
  donationVisibility.value = val
  // FR-1.5: auto-applied to all existing and future listings
  showToast(`Donation listings set to ${donationVisibilityOptions.find(o => o.value === val)?.label}`, 'success', '🔒')
}

function toggleVisibility(opt) {
  opt.enabled = !opt.enabled
  showToast(`${opt.label} ${opt.enabled ? 'enabled' : 'disabled'}`, opt.enabled ? 'info' : 'warning', '👁️')
}

// ── Notification Settings ──
const notifOptions = ref([
  { id: 'expiry-alerts',    label: 'Expiry Alerts',            desc: 'Get notified when items are about to expire', enabled: true  },
  { id: 'donation-updates', label: 'Donation Updates',         desc: 'Updates on your donation activity',           enabled: true  },
  { id: 'meal-reminders',   label: 'Meal Plan Reminders',      desc: "Reminders so you don't miss planned meals",   enabled: false },
  { id: 'newsletter',       label: 'SavePlate Newsletter',     desc: 'Weekly tips on reducing food waste',          enabled: false },
])

function toggleNotif(opt) {
  opt.enabled = !opt.enabled
  showToast(`${opt.label} ${opt.enabled ? 'enabled' : 'disabled'}`, opt.enabled ? 'notification' : 'warning', '🔔')
}

// ── Logout ──
const showLogoutConfirm = ref(false)
function confirmLogout() { showLogoutConfirm.value = true }
function cancelLogout()  { showLogoutConfirm.value = false }
function doLogout() {
  authService.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <AppLayout
    :unread-count="unreadCount"
    :user-name="userName"
  >
    <div class="settings-page">

      <!-- ── Page Header ── -->
      <div class="page-header">
        <h1>Settings</h1>
        <p class="subtitle">Manage your account preferences and app configuration.</p>
      </div>

      <!-- ══════════════════════════════════════
           1. Account Information
      ══════════════════════════════════════ -->
      <section class="settings-card">
        <div class="card-header">
          <div class="card-title-row">
            <span class="card-icon-wrap" style="--ic-bg:#e8f5e9;--ic-color:#2da12b;">👤</span>
            <h2>Account Information</h2>
          </div>
          <button v-if="!editMode" class="btn-edit" @click="startEdit">Edit Profile</button>
        </div>

        <!-- ── View Mode ── -->
        <div v-if="!editMode" class="info-grid">
          <div class="info-item">
            <span class="info-label">Name</span>
            <span class="info-value">{{ userName }}</span>
          </div>
          <div class="info-divider"></div>
          <div class="info-item">
            <span class="info-label">Email</span>
            <span class="info-value">{{ userEmail }}</span>
          </div>
        </div>

        <!-- ── Edit Mode ── -->
        <div v-else class="edit-form">
          <div class="form-group">
            <label for="edit-name">Name</label>
            <input id="edit-name" v-model="editName" type="text" placeholder="Your full name" class="form-input" />
          </div>
          <div class="form-group">
            <label for="edit-email">Email</label>
            <input id="edit-email" v-model="editEmail" type="email" placeholder="Your email address" class="form-input" />
          </div>
          <div class="edit-actions">
            <button class="btn-cancel" @click="cancelEdit">Cancel</button>
            <button class="btn-save" @click="saveEdit">Save Changes</button>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════
           2. Security Settings
      ══════════════════════════════════════ -->
      <section class="settings-card">
        <div class="card-header no-action">
          <div class="card-title-row">
            <span class="card-icon-wrap" style="--ic-bg:#fef3c7;--ic-color:#d97706;">🔐</span>
            <h2>Security Settings</h2>
          </div>
        </div>

        <div class="toggle-list">
          <!-- Two-Factor Auth -->
          <div class="toggle-item">
            <div class="toggle-info">
              <span class="toggle-label">Two-Factor Authentication</span>
              <span class="toggle-desc">Adds an extra layer of security to your account</span>
            </div>
            <button
              class="toggle-switch"
              :class="{ on: twoFactorEnabled }"
              @click="toggle2FA"
              :aria-checked="twoFactorEnabled"
              role="switch"
              aria-label="Toggle two-factor authentication"
            >
              <span class="toggle-thumb"></span>
            </button>
          </div>

          <!-- Change Password -->
          <div class="info-divider"></div>
          <div class="action-item">
            <div class="toggle-info">
              <span class="toggle-label">Change Password</span>
              <span class="toggle-desc">Update your account password</span>
            </div>
            <button class="btn-ghost">Change →</button>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════
           3. Visibility Settings
      ══════════════════════════════════════ -->
      <section class="settings-card">
        <div class="card-header no-action">
          <div class="card-title-row">
            <span class="card-icon-wrap" style="--ic-bg:#ede9fe;--ic-color:#7c3aed;">👁️</span>
            <h2>Privacy &amp; Visibility</h2>
          </div>
        </div>

        <!-- Donation Listing Visibility (FR-1.4) -->
        <div class="privacy-section">
          <div class="privacy-section-header">
            <span class="privacy-section-title">Donation Listing Visibility</span>
            <span class="privacy-section-desc">Choose who can see your donation listings. Changes apply automatically to all your current and future listings.</span>
          </div>
          <div class="visibility-options">
            <button
              v-for="opt in donationVisibilityOptions"
              :key="opt.value"
              :id="`visibility-${opt.value}`"
              class="visibility-option"
              :class="{ selected: donationVisibility === opt.value }"
              @click="setDonationVisibility(opt.value)"
              :aria-pressed="donationVisibility === opt.value"
            >
              <span class="vis-icon">
                <span v-if="opt.value === 'public'">🌐</span>
                <span v-else-if="opt.value === 'community'">👥</span>
                <span v-else>🔒</span>
              </span>
              <span class="vis-details">
                <strong>{{ opt.label }}</strong>
                <span>{{ opt.desc }}</span>
              </span>
              <span class="vis-check" v-if="donationVisibility === opt.value">✓</span>
            </button>
          </div>
        </div>

        <div class="info-divider" style="margin: 1rem 0"></div>

        <!-- Profile Visibility Toggles -->
        <div class="privacy-section">
          <div class="privacy-section-header">
            <span class="privacy-section-title">Profile Visibility</span>
            <span class="privacy-section-desc">Control what information is shown on your public profile.</span>
          </div>
          <div class="toggle-list">
            <!-- Show Full Name toggle -->
            <div class="toggle-item">
              <div class="toggle-info">
                <span class="toggle-label">Show Full Name</span>
                <span class="toggle-desc">Display your full name on donation listings and profile</span>
              </div>
              <button
                id="toggle-show-full-name"
                class="toggle-switch"
                :class="{ on: showFullName }"
                @click="showFullName = !showFullName; showToast(`Full name ${showFullName ? 'shown' : 'hidden'} on profile`, showFullName ? 'info' : 'warning', '👤')"
                :aria-checked="showFullName"
                role="switch"
                aria-label="Toggle full name visibility"
              >
                <span class="toggle-thumb"></span>
              </button>
            </div>
            <div class="info-divider"></div>
            <!-- Show Location toggle -->
            <div class="toggle-item">
              <div class="toggle-info">
                <span class="toggle-label">Show Location</span>
                <span class="toggle-desc">Display your general location on donation listings</span>
              </div>
              <button
                id="toggle-show-location"
                class="toggle-switch"
                :class="{ on: showLocation }"
                @click="showLocation = !showLocation; showToast(`Location ${showLocation ? 'shown' : 'hidden'} on listings`, showLocation ? 'info' : 'warning', '📍')"
                :aria-checked="showLocation"
                role="switch"
                aria-label="Toggle location visibility"
              >
                <span class="toggle-thumb"></span>
              </button>
            </div>
            <div v-for="(opt, i) in visibilityOptions" :key="opt.id">
              <div class="info-divider"></div>
              <div class="toggle-item">
                <div class="toggle-info">
                  <span class="toggle-label">{{ opt.label }}</span>
                  <span class="toggle-desc">{{ opt.desc }}</span>
                </div>
                <button
                  class="toggle-switch"
                  :class="{ on: opt.enabled }"
                  @click="toggleVisibility(opt)"
                  :aria-checked="opt.enabled"
                  role="switch"
                  :aria-label="`Toggle ${opt.label}`"
                >
                  <span class="toggle-thumb"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════
           4. Notification Settings
      ══════════════════════════════════════ -->
      <section class="settings-card">
        <div class="card-header no-action">
          <div class="card-title-row">
            <span class="card-icon-wrap" style="--ic-bg:#fce7f3;--ic-color:#db2777;">🔔</span>
            <h2>Notification Settings</h2>
          </div>
        </div>

        <div class="toggle-list">
          <div v-for="(opt, i) in notifOptions" :key="opt.id">
            <div class="info-divider" v-if="i > 0"></div>
            <div class="toggle-item">
              <div class="toggle-info">
                <span class="toggle-label">{{ opt.label }}</span>
                <span class="toggle-desc">{{ opt.desc }}</span>
              </div>
              <button
                class="toggle-switch"
                :class="{ on: opt.enabled }"
                @click="toggleNotif(opt)"
                :aria-checked="opt.enabled"
                role="switch"
                :aria-label="`Toggle ${opt.label}`"
              >
                <span class="toggle-thumb"></span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════
           5. About SavePlate
      ══════════════════════════════════════ -->
      <section class="settings-card">
        <div class="card-header no-action">
          <div class="card-title-row">
            <span class="card-icon-wrap" style="--ic-bg:#dcfce7;--ic-color:#16a34a;">🌿</span>
            <h2>About SavePlate</h2>
          </div>
        </div>

        <div class="about-content">
          <div class="about-row">
            <span class="about-key">Version</span>
            <span class="about-val">1.0.0</span>
          </div>
          <div class="info-divider"></div>
          <div class="about-row">
            <span class="about-key">Mission</span>
            <span class="about-val">Reduce food waste, one plate at a time 🌍</span>
          </div>
          <div class="info-divider"></div>
          <div class="about-row link-row">
            <span class="about-key">Privacy Policy</span>
            <button class="btn-ghost">View →</button>
          </div>
          <div class="info-divider"></div>
          <div class="about-row link-row">
            <span class="about-key">Terms of Service</span>
            <button class="btn-ghost">View →</button>
          </div>
        </div>
      </section>

      <!-- ── Logout Button ── -->
      <div class="logout-row">
        <button class="btn-logout" id="logout-btn" @click="confirmLogout">
          🚪 Log Out
        </button>
      </div>

    </div>

    <!-- ── Logout Confirm Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showLogoutConfirm" class="modal-backdrop" @click.self="cancelLogout">
          <div class="modal-card">
            <div class="modal-icon">🚪</div>
            <h3 class="modal-title">Log Out?</h3>
            <p class="modal-body">Are you sure you want to log out of your SavePlate account?</p>
            <div class="modal-actions">
              <button class="btn-cancel" @click="cancelLogout">Cancel</button>
              <button class="btn-logout-confirm" @click="doLogout">Log Out</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </AppLayout>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.settings-page {
  padding: 1.75rem 1.5rem;
  max-width: 780px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  font-family: 'Inter', sans-serif;
}

/* ── Page header ── */
.page-header { margin-bottom: 0.25rem; }
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
.subtitle { font-size: 0.83rem; color: #9ca3af; font-weight: 500; }


/* ── Card ── */
.settings-card {
  background: #fff;
  border: 1px solid #e6ece6;
  border-radius: 18px;
  padding: 1.375rem 1.5rem;
  transition: box-shadow 200ms;
}
.settings-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

/* ── Card header ── */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.1rem;
}
.card-header.no-action { margin-bottom: 1rem; }

.card-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.card-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--ic-bg);
  color: var(--ic-color);
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.card-header h2 {
  font-size: 0.95rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.01em;
}

/* ── Edit button ── */
.btn-edit {
  padding: 7px 16px;
  border-radius: 9px;
  border: 1.5px solid #2da12b;
  background: transparent;
  color: #2da12b;
  font-size: 0.8rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 150ms, color 150ms, box-shadow 150ms;
  letter-spacing: -0.01em;
}
.btn-edit:hover {
  background: #2da12b;
  color: #fff;
  box-shadow: 0 2px 8px rgba(45,161,43,0.2);
}
.btn-edit:focus-visible { outline: 2px solid #2da12b; outline-offset: 2px; }

/* ── Info grid (view mode) ── */
.info-grid { display: flex; flex-direction: column; gap: 0; }
.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0;
}
.info-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 600;
  min-width: 80px;
}
.info-value {
  font-size: 0.88rem;
  font-weight: 600;
  color: #111827;
  text-align: right;
}

/* ── Divider ── */
.info-divider {
  height: 1px;
  background: #f0f4f0;
  margin: 0;
}

/* ── Edit form ── */
.edit-form { display: flex; flex-direction: column; gap: 0.85rem; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  letter-spacing: -0.01em;
}
.form-input {
  padding: 10px 13px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.88rem;
  font-family: 'Inter', sans-serif;
  color: #111827;
  background: #f9fafb;
  transition: border-color 150ms, box-shadow 150ms, background 150ms;
  outline: none;
}
.form-input:hover { border-color: #d1d5db; }
.form-input:focus {
  border-color: #2da12b;
  box-shadow: 0 0 0 3px rgba(45,161,43,0.12);
  background: #fff;
}
.edit-actions {
  display: flex;
  gap: 0.65rem;
  justify-content: flex-end;
  margin-top: 0.25rem;
}

/* ── Toggle list ── */
.toggle-list { display: flex; flex-direction: column; gap: 0; }
.toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;
}
.action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;
}
.toggle-info { display: flex; flex-direction: column; gap: 2px; }
.toggle-label {
  font-size: 0.87rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.01em;
}
.toggle-desc {
  font-size: 0.74rem;
  color: #9ca3af;
  line-height: 1.4;
}

/* ── Toggle switch ── */
.toggle-switch {
  width: 46px;
  height: 26px;
  border-radius: 99px;
  border: none;
  background: #dde8dd;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: background 0.22s cubic-bezier(0.4,0,0.2,1);
  outline: none;
}
.toggle-switch.on { background: #2da12b; }
.toggle-switch:focus-visible {
  box-shadow: 0 0 0 3px rgba(45,161,43,0.25);
}

.toggle-thumb {
  position: absolute;
  top: 3px; left: 3px;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  transition: transform 0.22s cubic-bezier(0.4,0,0.2,1);
}
.toggle-switch.on .toggle-thumb { transform: translateX(20px); }

/* ── Ghost button (inline action) ── */
.btn-ghost {
  padding: 6px 14px;
  border-radius: 9px;
  border: 1.5px solid #e5e7eb;
  background: transparent;
  color: #6b7280;
  font-size: 0.78rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 150ms, color 150ms, background 150ms;
  flex-shrink: 0;
  letter-spacing: -0.01em;
}
.btn-ghost:hover {
  border-color: #2da12b;
  color: #2da12b;
  background: #f0faf0;
}
.btn-ghost:focus-visible { outline: 2px solid #2da12b; outline-offset: 2px; }

/* ── About section ── */
.about-content { display: flex; flex-direction: column; gap: 0; }
.about-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0;
}
.link-row { cursor: default; }
.about-key {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}
.about-val {
  font-size: 0.83rem;
  color: #9ca3af;
  text-align: right;
}

/* ── Save / Cancel buttons ── */
.btn-save {
  padding: 9px 20px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #2da12b, #22c55e);
  color: #fff;
  font-size: 0.84rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(45,161,43,0.28);
  transition: opacity 150ms, transform 150ms;
  letter-spacing: -0.01em;
}
.btn-save:hover { opacity: 0.9; transform: translateY(-1px); }
.btn-save:active { transform: translateY(0); }
.btn-save:focus-visible { outline: 2px solid #2da12b; outline-offset: 3px; }

.btn-cancel {
  padding: 9px 20px;
  border-radius: 10px;
  border: 1.5px solid #e5e7eb;
  background: transparent;
  color: #6b7280;
  font-size: 0.84rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 150ms, border-color 150ms;
  letter-spacing: -0.01em;
}
.btn-cancel:hover { background: #f3f4f6; border-color: #d1d5db; }
.btn-cancel:focus-visible { outline: 2px solid #2da12b; outline-offset: 3px; }

/* ── Logout row ── */
.logout-row {
  display: flex;
  justify-content: flex-end;
  padding-bottom: 1rem;
}
.btn-logout {
  padding: 11px 28px;
  border-radius: 12px;
  border: 2px solid #ef4444;
  background: transparent;
  color: #ef4444;
  font-size: 0.9rem;
  font-weight: 800;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 150ms, color 150ms, box-shadow 150ms, transform 150ms;
  letter-spacing: -0.01em;
}
.btn-logout:hover {
  background: #ef4444;
  color: #fff;
  box-shadow: 0 4px 16px rgba(239,68,68,0.28);
  transform: translateY(-1px);
}
.btn-logout:active { transform: translateY(0); }
.btn-logout:focus-visible { outline: 2px solid #ef4444; outline-offset: 3px; }

/* ── Mobile ── */
@media (max-width: 860px) {
  .settings-page { padding: 1rem; gap: 1rem; }
  .page-header h1 { font-size: 1.25rem; }
  .settings-card { padding: 1.1rem 1.15rem; }
}

/* ── Privacy section ── */
.privacy-section { display: flex; flex-direction: column; gap: 0.75rem; }
.privacy-section + .privacy-section { margin-top: 0; }

.privacy-section-header {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 0.5rem;
}
.privacy-section-title {
  font-size: 0.85rem;
  font-weight: 800;
  color: #1a1a1a;
}
.privacy-section-desc {
  font-size: 0.76rem;
  color: #9aaa9a;
  line-height: 1.45;
}

/* ── Visibility option buttons (radio-style) ── */
.visibility-options {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.visibility-option {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 11px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  text-align: left;
  transition: border-color 150ms, background 150ms, box-shadow 150ms;
  width: 100%;
}

.visibility-option:hover {
  border-color: #a7c6a7;
  background: #f4fbf4;
}

.visibility-option.selected {
  border-color: #2da12b;
  background: #f0faf0;
  box-shadow: 0 0 0 3px rgba(45,161,43,0.1);
}
.visibility-option:focus-visible { outline: 2px solid #2da12b; outline-offset: 2px; }

.vis-icon {
  font-size: 1.25rem;
  min-width: 28px;
  text-align: center;
  flex-shrink: 0;
}

.vis-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.vis-details strong {
  font-size: 0.85rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.01em;
}

.vis-details span {
  font-size: 0.73rem;
  color: #9ca3af;
  line-height: 1.35;
}

.vis-check {
  font-size: 0.95rem;
  font-weight: 800;
  color: #2da12b;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}
</style>

<!-- ── Modal styles (Teleport, not scoped) ── -->
<style>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.38);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.modal-card {
  background: #fff;
  border-radius: 20px;
  padding: 2rem 1.75rem;
  max-width: 360px;
  width: 100%;
  text-align: center;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08);
  border: 1px solid #e6ece6;
}
.modal-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
.modal-title { font-size: 1.15rem; font-weight: 800; color: #111827; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
.modal-body  { font-size: 0.86rem; color: #6b7280; line-height: 1.55; margin-bottom: 1.5rem; }
.modal-actions {
  display: flex;
  gap: 0.75rem;
}
.modal-actions .btn-cancel  { flex: 1; font-size: 0.88rem; }
.btn-logout-confirm {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  border: none;
  background: #ef4444;
  color: #fff;
  font-size: 0.88rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: opacity 150ms, transform 150ms;
  letter-spacing: -0.01em;
}
.btn-logout-confirm:hover { opacity: 0.88; transform: translateY(-1px); }
.btn-logout-confirm:active { transform: translateY(0); }
.btn-logout-confirm:focus-visible { outline: 2px solid #ef4444; outline-offset: 3px; }

/* Modal animation */
.modal-enter-active { transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.modal-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.modal-enter-from   { opacity: 0; transform: scale(0.88); }
.modal-leave-to     { opacity: 0; transform: scale(0.92); }
</style>
