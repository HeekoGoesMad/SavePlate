<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../../services/authService'

const router = useRouter()

const fullName       = ref('')
const email          = ref('')
const password       = ref('')
const confirmPass    = ref('')
const householdSize  = ref('')   // optional
const showPass       = ref(false)
const showConfirm    = ref(false)
const isLoading      = ref(false)
const submitted      = ref(false) // tracks whether user tried to submit
const serverError    = ref('')    // error from backend API

// ── Email validation regex ──────────────────────────────────
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const emailValid = computed(() => emailRegex.test(email.value.trim()))

// ── Password strength ───────────────────────────────────────
const passwordStrength = computed(() => {
  const p = password.value
  if (!p) return 0
  let score = 0
  if (p.length >= 8)           score++
  if (/[A-Z]/.test(p))        score++
  if (/[0-9]/.test(p))        score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return score
})

const strengthLabel = computed(() => ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength.value])
const strengthColor = computed(() => ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'][passwordStrength.value])

// ── Individual field error messages (shown after submit attempt) ──
const nameError = computed(() =>
  submitted.value && !fullName.value.trim() ? 'Full name is required.' : ''
)
const emailError = computed(() => {
  if (!submitted.value) return ''
  if (!email.value.trim()) return 'Email address is required.'
  if (!emailValid.value)  return 'Please enter a valid email address.'
  return ''
})
const passwordError = computed(() => {
  if (!submitted.value) return ''
  if (!password.value)            return 'Password is required.'
  if (password.value.length < 8)  return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(password.value)) return 'Password must contain at least one uppercase letter.'
  if (!/[0-9]/.test(password.value)) return 'Password must contain at least one number.'
  return ''
})
const confirmError = computed(() =>
  submitted.value && confirmPass.value !== password.value ? 'Passwords do not match.' : ''
)

// ── Password strength rule for formValid ───────────────────
const passwordMeetsRules = computed(() =>
  password.value.length >= 8 &&
  /[A-Z]/.test(password.value) &&
  /[0-9]/.test(password.value)
)

// ── Passwords match ─────────────────────────────────────────
const passwordsMatch = computed(() =>
  confirmPass.value === '' || password.value === confirmPass.value
)

// ── Overall form validity ────────────────────────────────────
const formValid = computed(() =>
  fullName.value.trim() !== '' &&
  emailValid.value &&
  passwordMeetsRules.value &&
  password.value === confirmPass.value
)

const handleRegister = async () => {
  submitted.value = true
  serverError.value = ''
  if (!formValid.value) return

  isLoading.value = true
  try {
    // Call backend API — creates user in MongoDB + sends OTP email via Brevo
    await authService.registerUser(
      fullName.value.trim(),
      email.value.trim(),
      password.value
    )
    // Navigate to the OTP verification page
    router.push({ name: 'verify', query: { email: email.value.trim() } })
  } catch (err) {
    serverError.value = err.message || 'Registration failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>


<template>
  <div class="page">

    <!-- LEFT PANEL -->
    <div class="panel-left">
      <div class="panel-content">
        <div class="badge">🌱 Join the Movement</div>
        <h1>Start saving<br />food today.</h1>
        <p>Create your free account and become part of a community fighting food waste — one plate at a time.</p>

        <ul class="steps-list">
          <li>
            <span class="step-num">01</span>
            <div>
              <strong>Create your account</strong>
              <span>Set up your profile in under a minute</span>
            </div>
          </li>
          <li>
            <span class="step-num">02</span>
            <div>
              <strong>Find surplus food</strong>
              <span>Discover restaurants offering rescue meals</span>
            </div>
          </li>
          <li>
            <span class="step-num">03</span>
            <div>
              <strong>Make an impact</strong>
              <span>Track how much food & CO₂ you've saved</span>
            </div>
          </li>
        </ul>

      </div>
    </div>

    <!-- RIGHT PANEL -->
    <div class="panel-right">
      <div class="form-card">

        <div class="logo">
          <img src="@/assets/Save Plate Logo.png" width="180" height="67" alt="SavePlate Logo" />
        </div>

        <h2>Create an account</h2>
        <p class="subtitle">Join SavePlate and start reducing food waste</p>

        <form @submit.prevent="handleRegister" novalidate>

          <!-- Full Name (required) -->
          <div class="field">
            <label for="reg-name">Full Name <span class="req">*</span></label>
            <input
              id="reg-name"
              type="text"
              v-model="fullName"
              placeholder="Your full name"
              autocomplete="name"
              :class="{ 'input-error': nameError }"
            />
            <p v-if="nameError" class="error-text">{{ nameError }}</p>
          </div>

          <!-- Email (required, regex validated) -->
          <div class="field">
            <label for="reg-email">Email <span class="req">*</span></label>
            <input
              id="reg-email"
              type="email"
              v-model="email"
              placeholder="your@email.com"
              autocomplete="email"
              :class="{ 'input-error': emailError }"
            />
            <p v-if="emailError" class="error-text">{{ emailError }}</p>
          </div>

          <!-- Password (required, min 8 chars, 1 uppercase, 1 number) -->
          <div class="field">
            <label for="reg-password">Password <span class="req">*</span></label>
            <div class="password-wrap">
              <input
                id="reg-password"
                :type="showPass ? 'text' : 'password'"
                v-model="password"
                placeholder="Min. 8 chars, 1 uppercase, 1 number"
                autocomplete="new-password"
                :class="{ 'input-error': passwordError }"
              />
              <button type="button" class="toggle-btn" @click="showPass = !showPass" :aria-label="showPass ? 'Hide password' : 'Show password'">
                <svg v-if="!showPass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
            <!-- Strength bar -->
            <div v-if="password" class="strength-wrap">
              <div class="strength-bar">
                <div
                  class="strength-fill"
                  :style="{ width: (passwordStrength / 4 * 100) + '%', background: strengthColor }"
                ></div>
              </div>
              <span class="strength-label" :style="{ color: strengthColor }">{{ strengthLabel }}</span>
            </div>
            <p v-if="passwordError" class="error-text">{{ passwordError }}</p>
          </div>

          <!-- Confirm Password (required) -->
          <div class="field">
            <label for="reg-confirm">Confirm Password <span class="req">*</span></label>
            <div class="password-wrap">
              <input
                id="reg-confirm"
                :type="showConfirm ? 'text' : 'password'"
                v-model="confirmPass"
                placeholder="Repeat your password"
                autocomplete="new-password"
                :class="{ 'input-error': confirmError }"
              />
              <button type="button" class="toggle-btn" @click="showConfirm = !showConfirm" :aria-label="showConfirm ? 'Hide password' : 'Show password'">
                <svg v-if="!showConfirm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
            <p v-if="confirmError" class="error-text">{{ confirmError }}</p>
          </div>

          <!-- Household Size (optional) -->
          <div class="field">
            <label for="reg-household">Household Size <span class="optional">(optional)</span></label>
            <select id="reg-household" v-model="householdSize" class="select-input">
              <option value="">— Select number of people —</option>
              <option value="1">1 person (solo)</option>
              <option value="2">2 people</option>
              <option value="3">3 people</option>
              <option value="4">4 people</option>
              <option value="5+">5 or more</option>
            </select>
          </div>

          <p v-if="serverError" class="error-text" style="text-align: center; margin-bottom: 0.75rem;">{{ serverError }}</p>

          <button type="submit" id="btn-register" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Creating account...' : 'Create Account' }}
          </button>

        </form>

        <div class="divider"><span>OR</span></div>

        <button type="button" id="btn-go-login" class="btn-secondary" @click="router.push({ name: 'login' })">
          Already have an account? <strong>Log in</strong>
        </button>

      </div>
    </div>

  </div>
</template>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Page layout ── */
.page {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  background-color: #f4f7f4;
}

/* ── Left panel ── */
.panel-left {
  flex: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: linear-gradient(150deg, #064e3b 0%, #047857 40%, #15803d 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.panel-left::before {
  content: '';
  position: absolute;
  width: 600px; height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%);
  top: -200px; left: -200px;
}
.panel-left::after {
  content: '';
  position: absolute;
  width: 450px; height: 450px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
  bottom: -150px; right: -100px;
}

.panel-content {
  max-width: 420px;
  position: relative;
  z-index: 10;
  animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  margin-bottom: 1.75rem;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
}

.panel-content h1 {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.08;
  margin-bottom: 1.25rem;
  letter-spacing: -0.03em;
  background: none;
  -webkit-text-fill-color: white;
}

.panel-content p {
  font-size: 1rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.78);
  margin-bottom: 2.5rem;
}

/* Steps */
.steps-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.steps-list li {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 10px 14px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  backdrop-filter: blur(4px);
  transition: background 200ms;
}
.steps-list li:hover { background: rgba(255,255,255,0.13); }

.step-num {
  min-width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.steps-list li div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.steps-list li strong {
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.3;
}

.steps-list li span {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.4;
}

/* ── Right panel ── */
.panel-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: #f4f7f4;
  overflow-y: auto;
}

.form-card {
  width: 100%;
  max-width: 420px;
  padding: 2rem 2.5rem;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
  border: 1px solid #e6ece6;
  animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.logo {
  display: flex;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.form-card h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  text-align: center;
  margin-bottom: 0.25rem;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.subtitle {
  text-align: center;
  color: #6b7280;
  font-size: 0.88rem;
  margin-bottom: 1.375rem;
  line-height: 1.5;
}

/* ── Fields ── */
.field {
  margin-bottom: 0.875rem;
}

.field label {
  display: block;
  margin-bottom: 5px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
  letter-spacing: -0.01em;
}

.field input,
.password-wrap input {
  width: 100%;
  padding: 11px 13px;
  border: 1.5px solid #e5e7eb;
  border-radius: 11px;
  background: #f9fafb;
  font-size: 0.9rem;
  font-family: 'Inter', sans-serif;
  color: #111827;
  outline: none;
  transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.password-wrap input { padding-right: 48px; }

.field input:focus,
.password-wrap input:focus {
  border-color: #2da12b;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(45,161,43,0.12);
}

.field input:hover:not(:focus),
.password-wrap input:hover:not(:focus) { border-color: #d1d5db; }

.input-error { border-color: #f87171 !important; }

/* ── Password show/hide ── */
.password-wrap { position: relative; display: flex; align-items: center; }

.toggle-btn {
  position: absolute; right: 6px;
  display: flex; align-items: center; justify-content: center;
  width: 34px; height: 34px;
  border: none; border-radius: 8px;
  background: transparent; color: #9ca3af;
  cursor: pointer;
  transition: color 150ms, background 150ms;
  flex-shrink: 0;
}
.toggle-btn:hover { color: #2da12b; background: #f0fdf4; }
.toggle-btn:focus-visible { outline: 2px solid #2da12b; outline-offset: 2px; }
.toggle-btn svg { width: 17px; height: 17px; stroke-width: 1.75; }

/* ── Strength bar ── */
.strength-wrap {
  display: flex; align-items: center; gap: 10px; margin-top: 7px;
}
.strength-bar {
  flex: 1; height: 5px; background: #e5e7eb;
  border-radius: 999px; overflow: hidden;
}
.strength-fill {
  height: 100%; border-radius: 999px;
  transition: width 300ms ease, background 300ms ease;
}
.strength-label {
  font-size: 0.72rem; font-weight: 700; min-width: 38px; text-align: right;
}

/* ── Error text ── */
.error-text {
  margin-top: 5px; font-size: 0.77rem; color: #dc2626; font-weight: 500;
  display: flex; align-items: center; gap: 4px;
}
.error-text::before { content: '⚠'; font-size: 0.68rem; }

/* ── Labels ── */
.req      { color: #ef4444; font-size: 0.8rem; }
.optional { color: #9ca3af; font-size: 0.73rem; font-weight: 400; }

/* ── Household select ── */
.select-input {
  width: 100%;
  padding: 11px 13px;
  border: 1.5px solid #e5e7eb;
  border-radius: 11px;
  background: #f9fafb;
  font-size: 0.9rem;
  font-family: 'Inter', sans-serif;
  color: #111827;
  outline: none;
  cursor: pointer;
  transition: border-color 150ms, box-shadow 150ms, background 150ms;
}
.select-input:hover { border-color: #d1d5db; }
.select-input:focus {
  border-color: #2da12b;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(45,161,43,0.12);
}

/* ── Buttons ── */
.btn-primary {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #2da12b, #22c55e);
  color: white;
  border: none;
  border-radius: 11px;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(45,161,43,0.28);
  transition: opacity 150ms, transform 150ms cubic-bezier(0.16,1,0.3,1), box-shadow 150ms;
  letter-spacing: -0.01em;
  margin-top: 0.375rem;
}
.btn-primary:hover:not(:disabled) {
  opacity: 0.92; transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(45,161,43,0.35);
}
.btn-primary:active:not(:disabled) { transform: translateY(0) scale(0.99); }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; transform: none; }
.btn-primary:focus-visible { outline: 2px solid #2da12b; outline-offset: 3px; }

.divider {
  display: flex; align-items: center;
  margin: 1.25rem 0; color: #9ca3af;
  font-size: 0.8rem; font-weight: 500;
}
.divider::before, .divider::after {
  content: ''; flex: 1; border-bottom: 1px solid #e5e7eb;
}
.divider span { padding: 0 14px; }

.btn-secondary {
  width: 100%; padding: 13px;
  background: #fff; color: #4b5563;
  border: 1.5px solid #e5e7eb; border-radius: 11px;
  font-size: 0.9rem; font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: border-color 150ms, background 150ms, color 150ms;
  letter-spacing: -0.01em;
}
.btn-secondary strong { color: #2da12b; font-weight: 700; }
.btn-secondary:hover { border-color: #2da12b; background: #f0fdf4; }
.btn-secondary:focus-visible { outline: 2px solid #2da12b; outline-offset: 3px; }

/* ── Responsive ── */
@media (max-width: 900px) {
  .panel-left { display: none; }
  .page { background: #fff; }
  .panel-right { padding: 1.25rem 1rem; background: #fff; overflow-y: visible; }
  .form-card {
    box-shadow: none; border: none;
    padding: 1.5rem 0.5rem; border-radius: 0; animation: none;
  }
}
</style>
