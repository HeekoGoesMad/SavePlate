<script setup>
import { ref } from 'vue'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useToast } from '@/composables/useToast'
import { useNotifications } from '@/composables/useNotifications'

const emit = defineEmits(['navigate'])

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

// ── Visibility Settings ──
const visibilityOptions = ref([
  { id: 'public-profile',   label: 'Public Profile',           desc: 'Let others find your profile',               enabled: true  },
  { id: 'show-donations',   label: 'Show Donation History',    desc: 'Display your past donations publicly',        enabled: false },
  { id: 'show-activity',    label: 'Show Recent Activity',     desc: "Share what you've been saving lately",        enabled: true  },
])

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
function doLogout()      { emit('navigate', 'logout') }
</script>

<template>
  <AppLayout
    current-page="settings"
    :unread-count="unreadCount"
    :user-name="userName"
    @navigate="emit('navigate', $event)"
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
            <h2>Visibility Settings</h2>
          </div>
        </div>

        <div class="toggle-list">
          <div v-for="(opt, i) in visibilityOptions" :key="opt.id">
            <div class="info-divider" v-if="i > 0"></div>
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
  color: #1a1a1a;
  background: none;
  -webkit-text-fill-color: unset;
  margin-bottom: 3px;
  line-height: 1.2;
}
.subtitle { font-size: 0.85rem; color: #7a8a7a; }

/* ── Card ── */
.settings-card {
  background: #fff;
  border: 1px solid #e8ede8;
  border-radius: 18px;
  padding: 1.4rem 1.5rem;
  transition: box-shadow 0.2s;
}
.settings-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
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
  font-size: 1rem;
  font-weight: 800;
  color: #1a1a1a;
}

/* ── Edit button ── */
.btn-edit {
  padding: 7px 16px;
  border-radius: 10px;
  border: 1.5px solid #2da12b;
  background: transparent;
  color: #2da12b;
  font-size: 0.82rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.btn-edit:hover {
  background: #2da12b;
  color: #fff;
}

/* ── Info grid (view mode) ── */
.info-grid { display: flex; flex-direction: column; gap: 0; }
.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0;
}
.info-label {
  font-size: 0.82rem;
  color: #7a8a7a;
  font-weight: 600;
  min-width: 80px;
}
.info-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a1a;
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
  font-size: 0.78rem;
  font-weight: 700;
  color: #5a6a5a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.form-input {
  padding: 10px 14px;
  border: 1.5px solid #e8ede8;
  border-radius: 10px;
  font-size: 0.9rem;
  font-family: 'Inter', sans-serif;
  color: #1a1a1a;
  background: #fafbfa;
  transition: border-color 0.15s, box-shadow 0.15s;
  outline: none;
}
.form-input:focus {
  border-color: #2da12b;
  box-shadow: 0 0 0 3px rgba(45,161,43,0.1);
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
  font-size: 0.88rem;
  font-weight: 700;
  color: #1a1a1a;
}
.toggle-desc {
  font-size: 0.76rem;
  color: #9aaa9a;
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
  border: 1.5px solid #e8ede8;
  background: transparent;
  color: #5a6a5a;
  font-size: 0.8rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  flex-shrink: 0;
}
.btn-ghost:hover {
  border-color: #2da12b;
  color: #2da12b;
  background: #f0faf0;
}

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
  font-size: 0.88rem;
  font-weight: 600;
  color: #3a3a3a;
}
.about-val {
  font-size: 0.85rem;
  color: #7a8a7a;
  text-align: right;
}

/* ── Save / Cancel buttons ── */
.btn-save {
  padding: 9px 20px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #2da12b, #3dc43b);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(45,161,43,0.28);
  transition: opacity 0.15s;
}
.btn-save:hover { opacity: 0.9; }

.btn-cancel {
  padding: 9px 20px;
  border-radius: 10px;
  border: 1.5px solid #e8ede8;
  background: transparent;
  color: #5a6a5a;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-cancel:hover { background: #f0f4f0; }

/* ── Logout row ── */
.logout-row {
  display: flex;
  justify-content: flex-end;
  padding-bottom: 1rem;
}
.btn-logout {
  padding: 12px 28px;
  border-radius: 12px;
  border: 2px solid #ef4444;
  background: transparent;
  color: #ef4444;
  font-size: 0.92rem;
  font-weight: 800;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}
.btn-logout:hover {
  background: #ef4444;
  color: #fff;
  box-shadow: 0 4px 16px rgba(239,68,68,0.28);
}

/* ── Mobile ── */
@media (max-width: 860px) {
  .settings-page { padding: 1rem; gap: 1rem; }
  .page-header h1 { font-size: 1.25rem; }
  .settings-card { padding: 1.1rem 1.15rem; }
}
</style>

<!-- ── Modal styles (Teleport, not scoped) ── -->
<style>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.38);
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
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
}
.modal-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
.modal-title { font-size: 1.2rem; font-weight: 800; color: #1a1a1a; margin-bottom: 0.5rem; }
.modal-body  { font-size: 0.88rem; color: #7a8a7a; line-height: 1.55; margin-bottom: 1.5rem; }
.modal-actions {
  display: flex;
  gap: 0.75rem;
}
.modal-actions .btn-cancel  { flex: 1; font-size: 0.9rem; }
.btn-logout-confirm {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  border: none;
  background: #ef4444;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-logout-confirm:hover { opacity: 0.88; }

/* Modal animation */
.modal-enter-active { transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.modal-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.modal-enter-from   { opacity: 0; transform: scale(0.88); }
.modal-leave-to     { opacity: 0; transform: scale(0.92); }
</style>
