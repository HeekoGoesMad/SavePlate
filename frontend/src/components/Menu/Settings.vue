<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useToast } from '@/composables/useToast'
import { useNotifications } from '@/composables/useNotifications'
import { authService } from '@/services/authService'

const router = useRouter()

const { showToast } = useToast()
const { unreadCount } = useNotifications()

const userName = computed(() => authService.user.value?.name || 'User')
const profile  = computed(() => authService.user.value || {})

// ── Account Information ──
const userEmail = computed(() => authService.user.value?.email || '')
const editMode  = ref(false)
const editName  = ref('')
const editEmail = ref('')

function startEdit() {
  editName.value  = userName.value
  editEmail.value = userEmail.value
  editMode.value  = true
}
async function saveEdit() {
  try {
    await authService.updateProfile(editName.value, editEmail.value)
    editMode.value = false
    showToast('Profile updated successfully', 'success', '👤')
  } catch (err) {
    showToast(err.message || 'Failed to update profile', 'warning')
  }
}
function cancelEdit() { editMode.value = false }

// ── Security Settings ──
const twoFactorEnabled = ref(false)

async function saveProfileSettings(patch, successMessage, successType = 'success') {
  try {
    await authService.updateProfile({ name: userName.value, email: userEmail.value, ...patch })
    showToast(successMessage, successType)
  } catch (err) {
    showToast(err.message || 'Failed to save settings', 'warning')
    syncProfileSettings()
  }
}

async function toggle2FA() {
  const next = !twoFactorEnabled.value
  twoFactorEnabled.value = next
  await saveProfileSettings(
    { is2FAEnabled: next },
    next ? '2FA enabled — login will require an email code' : '2FA disabled',
    next ? 'success' : 'warning'
  )
}


// ── Visibility Settings ── (FR-1.4) — Public / Private only
const donationVisibility = ref('public')

const donationVisibilityOptions = [
  { value: 'public',  label: 'Public',  desc: 'Anyone can see your donation listings' },
  { value: 'private', label: 'Private', desc: 'Only you can see your donation listings' },
]

async function setDonationVisibility(val) {
  donationVisibility.value = val
  await saveProfileSettings(
    { listingVisibility: val },
    `Donation listings set to ${donationVisibilityOptions.find(o => o.value === val)?.label}`,
    'success'
  )
}

// ── Change Password ──
const showChangePw  = ref(false)
const currentPw     = ref('')
const newPw         = ref('')
const confirmPw     = ref('')
const pwLoading     = ref(false)
const pwError       = ref('')
const showCurrentPw = ref(false)
const showNewPw     = ref(false)
const showConfirmPw = ref(false)

function openChangePw()  { showChangePw.value = true; pwError.value = ''; currentPw.value = ''; newPw.value = ''; confirmPw.value = '' }
function closeChangePw() { showChangePw.value = false }

async function submitChangePw() {
  pwError.value = ''
  if (!currentPw.value || !newPw.value || !confirmPw.value) { pwError.value = 'All fields are required.'; return }
  if (newPw.value !== confirmPw.value) { pwError.value = 'New passwords do not match.'; return }
  if (newPw.value.length < 8 || !/[A-Z]/.test(newPw.value) || !/\d/.test(newPw.value)) {
    pwError.value = 'Password must be at least 8 characters, include one uppercase letter and one number.'; return
  }
  pwLoading.value = true
  try {
    await authService.changePassword(currentPw.value, newPw.value)
    closeChangePw()
    showToast('Password changed successfully', 'success', '🔐')
  } catch (err) {
    pwError.value = err.message || 'Failed to change password.'
  } finally {
    pwLoading.value = false
  }
}

function syncProfileSettings() {
  twoFactorEnabled.value = Boolean(profile.value.is2FAEnabled)
  const vis = profile.value.listingVisibility
  donationVisibility.value = (vis === 'public' || vis === 'private') ? vis : 'public'
}

onMounted(async () => {
  try { await authService.getProfile() } catch { /* layout auth guard handles this */ }
  syncProfileSettings()
})

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
            <button class="btn-ghost" @click="openChangePw">Change →</button>
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

      <!-- ── Change Password Modal ── -->
      <Transition name="modal">
        <div v-if="showChangePw" class="modal-backdrop" @click.self="closeChangePw">
          <div class="modal-card" style="max-width:420px;text-align:left;">
            <div class="modal-icon" style="text-align:center">🔐</div>
            <h3 class="modal-title" style="text-align:center">Change Password</h3>

            <div class="pw-field">
              <label>Current Password</label>
              <div class="password-wrap">
                <input :type="showCurrentPw ? 'text' : 'password'" v-model="currentPw" placeholder="Enter current password" class="form-input" />
                <button type="button" class="pw-eye" @click="showCurrentPw = !showCurrentPw" :aria-label="showCurrentPw ? 'Hide password' : 'Show password'">
                  <svg v-if="!showCurrentPw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="pw-field">
              <label>New Password</label>
              <div class="password-wrap">
                <input :type="showNewPw ? 'text' : 'password'" v-model="newPw" placeholder="Min 8 chars, 1 uppercase, 1 number" class="form-input" />
                <button type="button" class="pw-eye" @click="showNewPw = !showNewPw" :aria-label="showNewPw ? 'Hide password' : 'Show password'">
                  <svg v-if="!showNewPw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="pw-field">
              <label>Confirm New Password</label>
              <div class="password-wrap">
                <input :type="showConfirmPw ? 'text' : 'password'" v-model="confirmPw" placeholder="Re-enter new password" class="form-input" />
                <button type="button" class="pw-eye" @click="showConfirmPw = !showConfirmPw" :aria-label="showConfirmPw ? 'Hide password' : 'Show password'">
                  <svg v-if="!showConfirmPw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </div>

            <p v-if="pwError" class="pw-error">{{ pwError }}</p>

            <div class="modal-actions" style="margin-top:1.25rem">
              <button class="btn-cancel" @click="closeChangePw">Cancel</button>
              <button class="btn-save" @click="submitChangePw" :disabled="pwLoading">
                {{ pwLoading ? 'Saving...' : 'Update Password' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </AppLayout>
</template>

<style scoped>
/* Inter font loaded globally in style.css */

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

/* ── Change Password Modal Fields ── */
.pw-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 0.85rem;
}
.pw-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  letter-spacing: -0.01em;
}
.password-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.password-wrap .form-input {
  width: 100%;
  padding-right: 42px;
}
.pw-eye {
  position: absolute;
  right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #9ca3af;
  transition: color 150ms, background 150ms;
}
.pw-eye:hover { 
  color: #2da12b; 
  background: #f0fdf4;
}
.pw-eye:focus-visible { outline: 2px solid #2da12b; outline-offset: 1px; }

.pw-eye svg {
  width: 17px;
  height: 17px;
  stroke-width: 1.75;
}
.pw-error {
  font-size: 0.8rem;
  color: #ef4444;
  font-weight: 500;
  margin-top: 0.5rem;
}
</style>
