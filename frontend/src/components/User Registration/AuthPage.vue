<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const email = computed(() => route.query.email || '')

// ── OTP state ────────────────────────────────────────────────
const otp        = ref(['', '', '', '', '', ''])
const isLoading  = ref(false)
const errorMsg   = ref('')
const successMsg = ref('')
const submitted  = ref(false)

// Simulate the OTP sent to the user's email (prototype)
const DEMO_OTP = '123456'

// ── Resend cooldown ──────────────────────────────────────────
const resendCooldown = ref(60)
const resendDisabled = computed(() => resendCooldown.value > 0)
let cooldownTimer = null

function startCooldown() {
  resendCooldown.value = 60
  cooldownTimer = setInterval(() => {
    if (resendCooldown.value > 0) resendCooldown.value--
    else clearInterval(cooldownTimer)
  }, 1000)
}

onMounted(() => startCooldown())
onUnmounted(() => clearInterval(cooldownTimer))

// ── OTP input logic ──────────────────────────────────────────
const inputRefs = ref([])

function onInput(index, event) {
  const val = event.target.value.replace(/\D/g, '')
  if (!val) { otp.value[index] = ''; return }

  // Handle paste of full code
  if (val.length > 1) {
    const digits = val.slice(0, 6).split('')
    digits.forEach((d, i) => { if (i < 6) otp.value[i] = d })
    inputRefs.value[5]?.focus()
    return
  }

  otp.value[index] = val[0]
  errorMsg.value = ''
  if (index < 5) inputRefs.value[index + 1]?.focus()
}

function onKeydown(index, event) {
  if (event.key === 'Backspace') {
    if (otp.value[index]) {
      otp.value[index] = ''
    } else if (index > 0) {
      inputRefs.value[index - 1]?.focus()
    }
  }
}

function onPaste(event) {
  event.preventDefault()
  const text = event.clipboardData.getData('text').replace(/\D/g, '')
  const digits = text.slice(0, 6).split('')
  digits.forEach((d, i) => { if (i < 6) otp.value[i] = d })
  const lastFilled = Math.min(digits.length, 5)
  inputRefs.value[lastFilled]?.focus()
}

// ── Verify ───────────────────────────────────────────────────
const otpCode = computed(() => otp.value.join(''))
const isComplete = computed(() => otpCode.value.length === 6)

const handleVerify = async () => {
  submitted.value = true
  errorMsg.value = ''

  if (!isComplete.value) {
    errorMsg.value = 'Please enter the complete 6-digit verification code.'
    return
  }

  isLoading.value = true
  await new Promise(r => setTimeout(r, 1500))
  isLoading.value = false

  if (otpCode.value !== DEMO_OTP) {
    errorMsg.value = 'Invalid or expired verification code. Please try again or request a new code.'
    otp.value = ['', '', '', '', '', '']
    inputRefs.value[0]?.focus()
    return
  }

  successMsg.value = 'Email verified! Activating your account…'
  await new Promise(r => setTimeout(r, 1200))
  router.push({ name: 'login' })
}

async function handleResend() {
  if (resendDisabled.value) return
  errorMsg.value = ''
  otp.value = ['', '', '', '', '', '']
  inputRefs.value[0]?.focus()
  startCooldown()
  // TODO: POST /api/auth/resend-otp
}
</script>


<template>
  <div class="page">

    <!-- LEFT PANEL -->
    <div class="panel-left">
      <div class="panel-content">

        <div class="panel-eyebrow">
          <span class="badge">📧 Email Verification</span>
        </div>

        <h1>One last<br />step.</h1>
        <p>We've sent a 6-digit verification code to your email address. Enter it to activate your account.</p>

        <!-- Vertical stepper -->
        <div class="stepper">
          <div class="step done">
            <div class="step-dot"><span>✓</span></div>
            <div class="step-line"></div>
            <div class="step-body">
              <span class="step-label">Account created</span>
              <span class="step-sub">Registration details saved</span>
            </div>
          </div>

          <div class="step active">
            <div class="step-dot"></div>
            <div class="step-line"></div>
            <div class="step-body">
              <span class="step-label">Verify your email</span>
              <span class="step-sub">Enter the 6-digit code we sent you</span>
            </div>
          </div>

          <div class="step pending">
            <div class="step-dot"></div>
            <div class="step-body">
              <span class="step-label">Account activated</span>
              <span class="step-sub">Ready to start saving food</span>
            </div>
          </div>
        </div>

        <div class="tip-box">
          <span class="tip-icon">💡</span>
          <p>Can't find the email? Check your spam folder. The code expires in <strong>10 minutes</strong>.</p>
        </div>

      </div>
    </div>

    <!-- RIGHT PANEL -->
    <div class="panel-right">
      <div class="form-card">

        <div class="logo">
          <img src="@/assets/Save Plate Logo.png" width="180" height="67" alt="SavePlate Logo" />
        </div>

        <h2>Verify your email</h2>
        <p class="subtitle">
          Enter the 6-digit code sent to<br />
          <strong class="email-display">{{ email || 'your email address' }}</strong>
        </p>

        <!-- Success state -->
        <div v-if="successMsg" class="success-banner">
          <span class="success-icon">✅</span>
          {{ successMsg }}
        </div>

        <!-- OTP Input -->
        <form v-else @submit.prevent="handleVerify" novalidate>

          <div class="otp-group" @paste="onPaste">
            <input
              v-for="(_, i) in otp"
              :key="i"
              :ref="el => { if (el) inputRefs[i] = el }"
              :id="`otp-digit-${i}`"
              type="text"
              inputmode="numeric"
              maxlength="6"
              :value="otp[i]"
              :class="['otp-input', { 'otp-filled': otp[i], 'otp-error': errorMsg }]"
              @input="onInput(i, $event)"
              @keydown="onKeydown(i, $event)"
              autocomplete="one-time-code"
              :aria-label="`Digit ${i + 1} of verification code`"
            />
          </div>

          <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

          <button
            type="submit"
            id="btn-verify-otp"
            class="btn-primary"
            :disabled="isLoading || !isComplete"
          >
            <span v-if="isLoading" class="spinner"></span>
            {{ isLoading ? 'Verifying…' : 'Verify Email' }}
          </button>

        </form>

        <div class="resend-section">
          <span class="resend-text">Didn't receive the code?</span>
          <button
            type="button"
            id="btn-resend-otp"
            class="btn-resend"
            :disabled="resendDisabled"
            @click="handleResend"
          >
            {{ resendDisabled ? `Resend in ${resendCooldown}s` : 'Resend Code' }}
          </button>
        </div>

        <div class="divider"><span>OR</span></div>

        <button type="button" id="btn-back-to-login" class="btn-secondary" @click="router.push({ name: 'login' })">
          ← Back to Login
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
  background-color: #f8fafc;
}

/* ── Left panel ── */
.panel-left {
  flex: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: linear-gradient(135deg, #047857 0%, #15803d 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.panel-left::before, .panel-left::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
}
.panel-left::before {
  width: 500px; height: 500px;
  top: -150px; left: -150px;
}
.panel-left::after {
  width: 400px; height: 400px;
  bottom: -100px; right: -50px;
}

.panel-content {
  max-width: 440px;
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
}

/* Eyebrow row — ensures badge stays above h1 */
.panel-eyebrow {
  display: block;
  margin-bottom: 1.25rem;
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

.panel-content > p {
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 2.5rem;
}

/* ── Vertical stepper ── */
.stepper {
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem;
}

.step {
  display: grid;
  grid-template-columns: 28px 2px 1fr;
  grid-template-rows: auto 1fr;
  column-gap: 14px;
  align-items: start;
}

/* Last step has no line */
.step:last-child {
  grid-template-columns: 28px 1fr;
  grid-template-rows: auto;
}
.step:last-child .step-line { display: none; }

.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  flex-shrink: 0;
  grid-row: 1;
  grid-column: 1;
  z-index: 1;
}

.step-line {
  width: 2px;
  background: rgba(255,255,255,0.18);
  min-height: 28px;
  grid-row: 2;
  grid-column: 2;
  margin: 4px auto;
}

.step-body {
  grid-row: 1 / 3;
  grid-column: 3;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0 18px;
}

/* Last step — body spans only row 1 */
.step:last-child .step-body {
  grid-row: 1;
  grid-column: 2;
  padding-bottom: 0;
}

.step-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: rgba(255,255,255,0.55);
  line-height: 1.3;
}

.step-sub {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.38);
  line-height: 1.4;
}

/* Done step */
.step.done .step-dot {
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.5);
  color: #fff;
}
.step.done .step-label { color: rgba(255,255,255,0.7); }
.step.done .step-sub   { color: rgba(255,255,255,0.45); }
.step.done .step-line  { background: rgba(255,255,255,0.28); }

/* Active step */
.step.active .step-dot {
  background: #fff;
  border-color: #fff;
  color: #047857;
}
.step.active .step-label {
  color: #fff;
  font-weight: 800;
  font-size: 0.95rem;
}
.step.active .step-sub { color: rgba(255,255,255,0.7); }

/* Active step */
.step.active .step-dot {
  background: transparent;
  border-color: rgba(255,255,255,0.2);
}
.step.pending .step-label { color: rgba(255,255,255,0.35); }
.step.pending .step-sub   { color: rgba(255,255,255,0.22); }


/* Tip box */
.tip-box {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 14px 16px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.tip-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 2px; }

.tip-box p {
  font-size: 0.83rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  margin: 0;
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
  border-radius: 24px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.05);
}

.logo {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.form-card h2 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  text-align: center;
  margin-bottom: 0.5rem;
}

.subtitle {
  text-align: center;
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.5;
  margin-bottom: 2rem;
}

.email-display {
  color: #047857;
  font-weight: 700;
  word-break: break-all;
}

/* ── OTP Input Group ── */
.otp-group {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.otp-input {
  width: 52px;
  height: 62px;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 800;
  font-family: 'Inter', sans-serif;
  color: #0f172a;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
  outline: none;
  transition: all 0.2s ease;
  caret-color: transparent;
}

.otp-input:focus {
  border-color: #10b981;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.12);
  transform: translateY(-2px);
}

.otp-input.otp-filled {
  border-color: #10b981;
  background: #f0fdf4;
  color: #047857;
}

.otp-input.otp-error {
  border-color: #ef4444;
  background: #fff5f5;
}

/* ── Error ── */
.error-text {
  text-align: center;
  margin-bottom: 1rem;
  font-size: 0.83rem;
  color: #ef4444;
  font-weight: 500;
  line-height: 1.45;
}

/* ── Success banner ── */
.success-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 14px;
  padding: 16px 20px;
  font-size: 0.92rem;
  font-weight: 600;
  color: #047857;
  margin-bottom: 1.5rem;
  text-align: left;
}

.success-icon { font-size: 1.25rem; flex-shrink: 0; }

/* ── Primary button ── */
.btn-primary {
  width: 100%;
  padding: 14px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 1.5rem;
}

.btn-primary:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
}

.btn-primary:active:not(:disabled) { transform: translateY(0); }

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

/* Spinner */
.spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Resend section ── */
.resend-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.resend-text {
  font-size: 0.85rem;
  color: #64748b;
}

.btn-resend {
  background: none;
  border: none;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  color: #10b981;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  transition: color 0.2s, background 0.2s;
}

.btn-resend:hover:not(:disabled) {
  color: #059669;
  background: #f0fdf4;
}

.btn-resend:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

/* ── Divider ── */
.divider {
  display: flex;
  align-items: center;
  margin: 1.25rem 0;
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

/* ── Secondary button ── */
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
  .otp-input { width: 44px; height: 54px; font-size: 1.25rem; }
}
</style>
