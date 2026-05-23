<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'

const router = useRouter()

const email       = ref('')
const password    = ref('')
const showPass    = ref(false)
const isLoading   = ref(false)
const submitted   = ref(false)  

// 2FA state
const requires2FA  = ref(false)
const twoFAEmail   = ref('')
const otpCode      = ref('')
const otpLoading   = ref(false)
const otpError     = ref('')

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

const serverError = ref('')

const handleLogin = async () => {
  submitted.value = true
  serverError.value = ''
  if (emailError.value || passwordError.value) return
  isLoading.value = true
  try {
    const data = await authService.loginUser(email.value.trim(), password.value)
    if (data.requires2FA) {
      twoFAEmail.value = data.email
      requires2FA.value = true
    } else {
      router.push({ name: 'dashboard' })
    }
  } catch (err) {
    serverError.value = err.message || 'Login failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const handleVerify2FA = async () => {
  otpError.value = ''
  if (!otpCode.value.trim()) { otpError.value = 'Please enter the code from your email.'; return }
  otpLoading.value = true
  try {
    await authService.login2FA(twoFAEmail.value, otpCode.value.trim())
    router.push({ name: 'dashboard' })
  } catch (err) {
    otpError.value = err.message || 'Invalid code. Please try again.'
  } finally {
    otpLoading.value = false
  }
}

const backToLogin = () => {
  requires2FA.value = false
  otpCode.value = ''
  otpError.value = ''
  password.value = ''
  submitted.value = false
}

// Forgot password state
const fpStep        = ref('login')
const fpEmail       = ref('')
const fpOtp         = ref('')
const fpNewPass     = ref('')
const fpConfirmPass = ref('')
const fpShowNew     = ref(false)
const fpShowConfirm = ref(false)
const fpLoading     = ref(false)
const fpError       = ref('')
const fpSuccess     = ref('')
const fpSubmitted   = ref(false)

const fpEmailError = computed(() => {
  if (!fpSubmitted.value) return ''
  if (!fpEmail.value.trim()) return 'Email address is required.'
  if (!emailRegex.test(fpEmail.value.trim())) return 'Please enter a valid email address.'
  return ''
})

const fpNewPassError = computed(() => {
  if (!fpSubmitted.value) return ''
  if (!fpNewPass.value) return 'New password is required.'
  if (fpNewPass.value.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(fpNewPass.value)) return 'Must include one uppercase letter.'
  if (!/\d/.test(fpNewPass.value)) return 'Must include one number.'
  return ''
})

const fpConfirmError = computed(() => {
  if (!fpSubmitted.value) return ''
  if (!fpConfirmPass.value) return 'Please confirm your password.'
  if (fpNewPass.value !== fpConfirmPass.value) return 'Passwords do not match.'
  return ''
})

const openForgotPassword = () => {
  fpStep.value = 'fp-email'
  fpEmail.value = email.value
  fpOtp.value = ''
  fpNewPass.value = ''
  fpConfirmPass.value = ''
  fpError.value = ''
  fpSuccess.value = ''
  fpSubmitted.value = false
}

const handleFpSendOtp = async () => {
  fpSubmitted.value = true
  fpError.value = ''
  if (fpEmailError.value) return
  fpLoading.value = true
  try {
    await authService.forgotPassword(fpEmail.value.trim())
    fpStep.value = 'fp-otp'
    fpSubmitted.value = false
  } catch (err) {
    fpError.value = err.message || 'Failed to send reset code.'
  } finally {
    fpLoading.value = false
  }
}

const handleFpVerifyOtp = () => {
  fpError.value = ''
  if (!fpOtp.value.trim()) { fpError.value = 'Please enter the 6-digit code.'; return }
  fpStep.value = 'fp-newpass'
  fpSubmitted.value = false
}

const handleFpReset = async () => {
  fpSubmitted.value = true
  fpError.value = ''
  if (fpNewPassError.value || fpConfirmError.value) return
  fpLoading.value = true
  try {
    await authService.resetPassword(fpEmail.value.trim(), fpOtp.value.trim(), fpNewPass.value)
    fpSuccess.value = 'Password reset successfully! You can now log in.'
    fpStep.value = 'login'
    fpSubmitted.value = false
  } catch (err) {
    fpError.value = err.message || 'Failed to reset password.'
  } finally {
    fpLoading.value = false
  }
}

const cancelForgotPassword = () => {
  fpStep.value = 'login'
  fpError.value = ''
  fpSuccess.value = ''
  fpSubmitted.value = false
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

        <!-- ── Normal Login Form ── -->
        <template v-if="!requires2FA && fpStep === 'login'">
          <h2>Welcome back</h2>
          <p class="subtitle">Login into your account to continue</p>

          <!-- success banner after reset -->
          <p v-if="fpSuccess" class="success-text">✅ {{ fpSuccess }}</p>

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
              <p v-if="passwordError" class="error-text">{{ passwordError }}</p>
            </div>

            <div class="forgot">
              <a href="#" @click.prevent="openForgotPassword">Forgot password?</a>
            </div>

            <p v-if="serverError" class="error-text" style="text-align: center; margin-bottom: 0.75rem;">{{ serverError }}</p>

            <button type="submit" id="btn-login" class="btn-primary" :disabled="isLoading">
              {{ isLoading ? 'Logging in...' : 'Login Now' }}
            </button>

          </form>

          <div class="divider"><span>OR</span></div>

          <button type="button" id="btn-signup" class="btn-secondary" @click="router.push({ name: 'register' })">
            Don't have an account? <strong>Sign up</strong>
          </button>
        </template>

        <!-- ── 2FA OTP Step ── -->
        <template v-else-if="requires2FA">
          <div class="twofa-icon">🔒</div>
          <h2>Two-Factor Verification</h2>
          <p class="subtitle">A 6-digit code has been sent to<br/><strong>{{ twoFAEmail }}</strong></p>

          <form @submit.prevent="handleVerify2FA" novalidate>
            <div class="field">
              <label for="otp-code">Verification Code</label>
              <input
                id="otp-code"
                type="text"
                v-model="otpCode"
                placeholder="Enter 6-digit code"
                maxlength="6"
                inputmode="numeric"
                autocomplete="one-time-code"
                :class="{ 'input-error': otpError }"
                style="letter-spacing: 0.2em; font-size: 1.1rem; text-align: center;"
              />
              <p v-if="otpError" class="error-text">{{ otpError }}</p>
            </div>

            <button type="submit" id="btn-verify-2fa" class="btn-primary" :disabled="otpLoading">
              {{ otpLoading ? 'Verifying...' : 'Verify & Login' }}
            </button>
          </form>

          <button type="button" class="btn-secondary" style="margin-top: 0.75rem;" @click="backToLogin">
            ← Back to Login
          </button>
        </template>

        <!-- ── Forgot Password: Step 1 – Enter Email ── -->
        <template v-else-if="fpStep === 'fp-email'">
          <div class="twofa-icon">🔑</div>
          <h2>Forgot Password</h2>
          <p class="subtitle">Enter the email address linked to your account and we'll send you a reset code.</p>

          <form @submit.prevent="handleFpSendOtp" novalidate>
            <div class="field">
              <label for="fp-email">Email Address</label>
              <input
                id="fp-email"
                type="email"
                v-model="fpEmail"
                placeholder="your@email.com"
                autocomplete="email"
                :class="{ 'input-error': fpEmailError }"
              />
              <p v-if="fpEmailError" class="error-text">{{ fpEmailError }}</p>
            </div>
            <p v-if="fpError" class="error-text" style="text-align:center; margin-bottom:0.75rem;">{{ fpError }}</p>
            <button type="submit" id="btn-fp-send" class="btn-primary" :disabled="fpLoading">
              {{ fpLoading ? 'Sending...' : 'Send Reset Code' }}
            </button>
          </form>

          <button type="button" class="btn-secondary" style="margin-top:0.75rem;" @click="cancelForgotPassword">
            ← Back to Login
          </button>
        </template>

        <!-- ── Forgot Password: Step 2 – Enter OTP ── -->
        <template v-else-if="fpStep === 'fp-otp'">
          <div class="twofa-icon">📧</div>
          <h2>Check Your Email</h2>
          <p class="subtitle">A 6-digit reset code has been sent to<br/><strong>{{ fpEmail }}</strong></p>

          <form @submit.prevent="handleFpVerifyOtp" novalidate>
            <div class="field">
              <label for="fp-otp">Reset Code</label>
              <input
                id="fp-otp"
                type="text"
                v-model="fpOtp"
                placeholder="Enter 6-digit code"
                maxlength="6"
                inputmode="numeric"
                autocomplete="one-time-code"
                :class="{ 'input-error': fpError }"
                style="letter-spacing: 0.2em; font-size: 1.1rem; text-align: center;"
              />
              <p v-if="fpError" class="error-text">{{ fpError }}</p>
            </div>
            <button type="submit" id="btn-fp-verify" class="btn-primary">Continue</button>
          </form>

          <button type="button" class="btn-secondary" style="margin-top:0.75rem;" @click="fpStep = 'fp-email'">
            ← Change Email
          </button>
        </template>

        <!-- ── Forgot Password: Step 3 – New Password ── -->
        <template v-else-if="fpStep === 'fp-newpass'">
          <div class="twofa-icon">🔐</div>
          <h2>Set New Password</h2>
          <p class="subtitle">Choose a strong new password for your account.</p>

          <form @submit.prevent="handleFpReset" novalidate>
            <div class="field">
              <label for="fp-newpass">New Password</label>
              <div class="password-wrap">
                <input
                  id="fp-newpass"
                  :type="fpShowNew ? 'text' : 'password'"
                  v-model="fpNewPass"
                  placeholder="Min 8 chars, uppercase & number"
                  :class="{ 'input-error': fpNewPassError }"
                />
                <button type="button" class="toggle-btn" @click="fpShowNew = !fpShowNew" :aria-label="fpShowNew ? 'Hide' : 'Show'">
                  <svg v-if="!fpShowNew" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
              <p v-if="fpNewPassError" class="error-text">{{ fpNewPassError }}</p>
            </div>

            <div class="field">
              <label for="fp-confirm">Confirm Password</label>
              <div class="password-wrap">
                <input
                  id="fp-confirm"
                  :type="fpShowConfirm ? 'text' : 'password'"
                  v-model="fpConfirmPass"
                  placeholder="Re-enter new password"
                  :class="{ 'input-error': fpConfirmError }"
                />
                <button type="button" class="toggle-btn" @click="fpShowConfirm = !fpShowConfirm" :aria-label="fpShowConfirm ? 'Hide' : 'Show'">
                  <svg v-if="!fpShowConfirm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
              <p v-if="fpConfirmError" class="error-text">{{ fpConfirmError }}</p>
            </div>

            <p v-if="fpError" class="error-text" style="text-align:center; margin-bottom:0.75rem;">{{ fpError }}</p>
            <button type="submit" id="btn-fp-reset" class="btn-primary" :disabled="fpLoading">
              {{ fpLoading ? 'Resetting...' : 'Reset Password' }}
            </button>
          </form>

          <button type="button" class="btn-secondary" style="margin-top:0.75rem;" @click="fpStep = 'fp-otp'">
            ← Back
          </button>
        </template>

      </div>
    </div>

  </div>
</template>



<style scoped>

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
  background: linear-gradient(135deg, #2da12b, #22c55e);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(45, 161, 43, 0.28);
  transition: all 0.2s ease;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(45, 161, 43, 0.35);
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

.success-text {
  margin-bottom: 1rem;
  padding: 10px 14px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #15803d;
  text-align: center;
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
  color: #2da12b; 
  font-weight: 600;
}

.btn-secondary:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

/* ── 2FA icon ── */
.twofa-icon {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 0.75rem;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .panel-left { display: none; }
  .page { background: #fff; }
  .panel-right { padding: 1rem; }
  .form-card { box-shadow: none; padding: 2rem 1rem; }
}
</style>