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

        <div class="stats">
          <div class="stat">
            <strong>12,480+</strong>
            <span>Meals Saved</span>
          </div>
          <div class="stat">
            <strong>3.2 tons</strong>
            <span>CO₂ Reduced</span>
          </div>
        </div>
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
  background-color: #f8fafc; /* Lighter background for the whole page */
}

/* ── Left panel ── */
.panel-left {
  flex: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: linear-gradient(135deg, #047857 0%, #15803d 100%); /* Clean, modern emerald gradient */
  color: white;
  position: relative;
  overflow: hidden;
}

/* Subtle background circles for a premium feel */
.panel-left::before, .panel-left::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
}
.panel-left::before {
  width: 500px;
  height: 500px;
  top: -150px;
  left: -150px;
}
.panel-left::after {
  width: 400px;
  height: 400px;
  bottom: -100px;
  right: -50px;
}

.panel-content {
  max-width: 440px;
  position: relative;
  z-index: 10;
}

.badge {
  display: inline-block;
  padding: 8px 16px;
  margin-bottom: 1.5rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  backdrop-filter: blur(4px);
}

.panel-content h1 {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.25rem;
}

.panel-content p {
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 2.5rem;
}

.feature-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.feature-list li {
  font-size: 0.95rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stats {
  display: flex;
  gap: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat strong {
  font-size: 1.4rem;
  font-weight: 800;
}

.stat span {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ── Right panel ── */
.panel-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.form-card {
  width: 100%;
  max-width: 440px;
  padding: 3rem 2.5rem;
  background: #fff;
  border-radius: 24px; /* Softer, larger borders */
  box-shadow: 0 12px 32px rgba(0,0,0,0.05); /* Modern, subtle shadow */
}

.logo {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.form-card h2 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a; /* Darker slate color */
  text-align: center;
  margin-bottom: 0.5rem;
}

.subtitle {
  text-align: center;
  color: #64748b;
  font-size: 0.95rem;
  margin-bottom: 2rem;
}

/* ── Fields ── */
.field {
  margin-bottom: 1.25rem;
}

.field label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.field input,
.password-wrap input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  font-size: 0.95rem;
  font-family: 'Inter', sans-serif;
  color: #0f172a;
  outline: none;
  transition: all 0.2s ease;
}

.password-wrap input {
  padding-right: 48px;
}

.field input:focus,
.password-wrap input:focus {
  border-color: #10b981;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); /* Nice focus ring */
}

/* ── Password with show/hide ── */
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
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;
}

.toggle-btn:hover {
  color: #10b981;
  background: #f1f5f9;
}

.toggle-btn svg {
  width: 18px;
  height: 18px;
}

/* ── Forgot ── */
.forgot {
  text-align: right;
  margin-bottom: 1.75rem;
}

.forgot a {
  font-size: 0.85rem;
  font-weight: 600;
  color: #10b981;
  text-decoration: none;
  transition: color 0.2s;
}

.forgot a:hover {
  color: #059669;
}

/* ── Buttons ── */
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