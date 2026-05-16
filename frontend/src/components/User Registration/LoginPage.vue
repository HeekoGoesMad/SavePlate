<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'

const router = useRouter()

const email       = ref('')
const password    = ref('')
const showPass    = ref(false)
const isLoading   = ref(false)
const submitted   = ref(false)  // tracks whether user tried to submit

// ── Email regex validation ────────────────────────────────
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const emailError = computed(() => {
  if (!submitted.value) return ''
  if (!email.value.trim()) return 'Email address is required.'
  if (!emailRegex.test(email.value.trim())) return 'Please enter a valid email address.'
  return ''
})

const passwordError = computed(() =>
  submitted.value && !password.value ? 'Password is required.' : ''
)

const handleLogin = async () => {
  submitted.value = true
  if (emailError.value || passwordError.value) return
  isLoading.value = true
  await new Promise((r) => setTimeout(r, 1500))
  isLoading.value = false
  authService.login()
  router.push({ name: 'dashboard' })
}
</script>


<template>
  <div class="page">

    <!-- LEFT PANEL -->
    <div class="panel-left">
      <div class="panel-content">
        <div class="badge">🛡️ Reduce Food Waste</div>
        <h1>Save food.<br />Save the planet.</h1>
        <p>Join thousands of people reducing food waste and making a difference — one plate at a time.</p>

        <ul class="feature-list">
          <li>📍 Rescue surplus food near you</li>
          <li>📦 Track your food inventory</li>
          <li>📊 View your savings analytics</li>
        </ul>


      </div>
    </div>

    <!-- RIGHT PANEL -->
    <div class="panel-right">
      <div class="form-card">

        <div class="logo">
          <img src="@/assets/Save Plate Logo.png" width="180" height="67" alt="SavePlate Logo" />
        </div>

        <h2>Welcome back</h2>
        <p class="subtitle">Login into your account to continue</p>

        <form @submit.prevent="handleLogin" novalidate>

          <div class="field">
            <label for="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              v-model="email"
              placeholder="your@email.com"
              autocomplete="email"
              :class="{ 'input-error': emailError }"
            />
            <p v-if="emailError" class="error-text">{{ emailError }}</p>
          </div>

          <div class="field">
            <label for="login-password">Password</label>
            <div class="password-wrap">
              <input
                id="login-password"
                :type="showPass ? 'text' : 'password'"
                v-model="password"
                placeholder="Enter your password"
                autocomplete="current-password"
                :class="{ 'input-error': passwordError }"
              />
              <button type="button" class="toggle-btn" @click="showPass = !showPass" :aria-label="showPass ? 'Hide password' : 'Show password'">
                <!-- Eye open -->
                <svg v-if="!showPass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <!-- Eye closed -->
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
            <p v-if="passwordError" class="error-text">{{ passwordError }}</p>
          </div>

          <div class="forgot">
            <a href="#">Forgot password?</a>
          </div>

          <button type="submit" id="btn-login" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Logging in...' : 'Login Now' }}
          </button>

        </form>

        <div class="divider"><span>OR</span></div>

        <button type="button" id="btn-signup" class="btn-secondary" @click="router.push({ name: 'register' })">
          Don't have an account? <strong>Sign up</strong>
        </button>

      </div>
    </div>

  </div>
</template>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

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

/* Decorative orbs */
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

.feature-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.feature-list li {
  font-size: 0.93rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 10px 14px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  backdrop-filter: blur(4px);
  transition: background 200ms;
}
.feature-list li:hover { background: rgba(255,255,255,0.13); }

/* ── Right panel ── */
.panel-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #f4f7f4;
}

.form-card {
  width: 100%;
  max-width: 420px;
  padding: 2.75rem 2.5rem;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
  border: 1px solid #e6ece6;
  animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.logo {
  display: flex;
  justify-content: center;
  margin-bottom: 1.75rem;
}

.form-card h2 {
  font-size: 1.625rem;
  font-weight: 800;
  color: #111827;
  text-align: center;
  margin-bottom: 0.375rem;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.subtitle {
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 1.875rem;
  line-height: 1.5;
}

/* ── Fields ── */
.field {
  margin-bottom: 1.125rem;
}

.field label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.83rem;
  font-weight: 600;
  color: #374151;
  letter-spacing: -0.01em;
}

.field input,
.password-wrap input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 11px;
  background: #f9fafb;
  font-size: 0.925rem;
  font-family: 'Inter', sans-serif;
  color: #111827;
  outline: none;
  transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.password-wrap input {
  padding-right: 48px;
}

.field input:focus,
.password-wrap input:focus {
  border-color: #2da12b;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(45,161,43,0.12);
}

.field input:hover:not(:focus),
.password-wrap input:hover:not(:focus) {
  border-color: #d1d5db;
}

/* ── Password show/hide ── */
.password-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.toggle-btn {
  position: absolute;
  right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  transition: color 150ms, background 150ms;
  flex-shrink: 0;
}

.toggle-btn:hover {
  color: #2da12b;
  background: #f0fdf4;
}
.toggle-btn:focus-visible { outline: 2px solid #2da12b; outline-offset: 2px; }

.toggle-btn svg {
  width: 17px;
  height: 17px;
  stroke-width: 1.75;
}

/* ── Forgot ── */
.forgot {
  text-align: right;
  margin-bottom: 1.5rem;
  margin-top: -0.25rem;
}

.forgot a {
  font-size: 0.82rem;
  font-weight: 600;
  color: #2da12b;
  text-decoration: none;
  transition: color 150ms;
  padding: 2px 0;
}

.forgot a:hover { color: #1e8a1c; }
.forgot a:focus-visible { outline: 2px solid #2da12b; border-radius: 3px; outline-offset: 2px; }

/* ── Primary Button ── */
.btn-primary {
  width: 100%;
  padding: 14px;
  background: #10b981; /* Solid attractive green */
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

/* ── Inline error messages ── */
.input-error {
  border-color: #ef4444 !important;
  background: #fff5f5 !important;
}

.error-text {
  margin-top: 6px;
  font-size: 0.8rem;
  color: #ef4444;
  font-weight: 500;
}

.divider {
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  color: #94a3b8;
  font-size: 0.85rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e2e8f0;
}

.divider span { padding: 0 12px; }

.btn-secondary {
  width: 100%;
  padding: 14px;
  background: #fff;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary strong { 
  color: #10b981; 
  font-weight: 600;
}

.btn-secondary:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .panel-left { display: none; }
  .page { background: #fff; }
  .panel-right { padding: 1rem; }
  .form-card { box-shadow: none; padding: 2rem 1rem; }
}
</style>