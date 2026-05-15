<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '../../services/authService'

const router = useRouter()
const route = useRoute()

const email = computed(() => route.query.email || '')

// ── OTP state ────────────────────────────────────────────────
const otp        = ref(['', '', '', '', '', ''])
const isLoading  = ref(false)
const errorMsg   = ref('')
const successMsg = ref('')
const submitted  = ref(false)


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
  
  try {
    await authService.verifyOtp(email.value, otpCode.value)
    successMsg.value = 'Email verified! Activating your account…'
    await new Promise(r => setTimeout(r, 1200))
    router.push({ name: 'login' })
  } catch (err) {
    errorMsg.value = err.message || 'Invalid or expired verification code. Please try again.'
    otp.value = ['', '', '', '', '', '']
    inputRefs.value[0]?.focus()
  } finally {
    isLoading.value = false
  }
}

async function handleResend() {
  if (resendDisabled.value) return
  errorMsg.value = ''
  otp.value = ['', '', '', '', '', '']
  inputRefs.value[0]?.focus()
  startCooldown()
  
  try {
    await authService.sendOtp(email.value)
    // Optional: could show a temporary toast or success indicator
  } catch (err) {
    errorMsg.value = err.message || 'Failed to resend OTP. Please try again.'
  }
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
  background-color: #f4f7f4;
}

/* ── Left panel ── */
.panel-left {
  flex: 1.2; display: flex;
  align-items: center; justify-content: center;
  padding: 3rem;
  background: linear-gradient(150deg, #064e3b 0%, #047857 40%, #15803d 100%);
  color: white; position: relative; overflow: hidden;
}

.panel-left::before {
  content: ''; position: absolute;
  width: 600px; height: 600px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%);
  top: -200px; left: -200px;
}
.panel-left::after {
  content: ''; position: absolute;
  width: 450px; height: 450px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
  bottom: -150px; right: -100px;
}

.panel-content {
  max-width: 420px;
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  animation: panelFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes panelFadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Eyebrow row — ensures badge stays above h1 */
.panel-eyebrow {
  display: block;
  margin-bottom: 1.25rem;
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

.panel-content > p {
  font-size: 1rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.78);
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

.step:last-child {
  grid-template-columns: 28px 1fr;
  grid-template-rows: auto;
}
.step:last-child .step-line { display: none; }

.step-dot {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.06);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.72rem; font-weight: 800;
  flex-shrink: 0;
  grid-row: 1; grid-column: 1; z-index: 1;
}

.step-line {
  width: 2px;
  background: rgba(255,255,255,0.15);
  min-height: 28px;
  grid-row: 2; grid-column: 2;
  margin: 4px auto;
}

.step-body {
  grid-row: 1 / 3; grid-column: 3;
  display: flex; flex-direction: column; gap: 2px;
  padding: 4px 0 18px;
}

.step:last-child .step-body {
  grid-row: 1; grid-column: 2; padding-bottom: 0;
}

.step-label {
  font-size: 0.88rem; font-weight: 700;
  color: rgba(255,255,255,0.5); line-height: 1.3;
}
.step-sub {
  font-size: 0.76rem; color: rgba(255,255,255,0.35); line-height: 1.4;
}

/* Done step */
.step.done .step-dot { background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.45); color: #fff; }
.step.done .step-label { color: rgba(255,255,255,0.68); }
.step.done .step-sub   { color: rgba(255,255,255,0.42); }
.step.done .step-line  { background: rgba(255,255,255,0.25); }

/* Active step */
.step.active .step-dot { background: #fff; border-color: #fff; color: #047857; }
.step.active .step-label { color: #fff; font-weight: 800; font-size: 0.93rem; }
.step.active .step-sub   { color: rgba(255,255,255,0.72); }

/* Pending step */
.step.pending .step-label { color: rgba(255,255,255,0.32); }
.step.pending .step-sub   { color: rgba(255,255,255,0.2); }

/* Tip box */
.tip-box {
  display: flex; align-items: flex-start; gap: 0.75rem;
  background: rgba(255, 255, 255, 0.09);
  border-radius: 12px; padding: 13px 16px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.14);
}
.tip-icon { font-size: 1.05rem; flex-shrink: 0; margin-top: 2px; }
.tip-box p { font-size: 0.82rem; color: rgba(255,255,255,0.82); line-height: 1.5; margin: 0; }

/* ── Right panel ── */
.panel-right {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 2rem; background: #f4f7f4;
}

.form-card {
  width: 100%; max-width: 420px;
  padding: 2.75rem 2.5rem;
  background: #fff; border-radius: 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
  border: 1px solid #e6ece6;
  animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.logo { display: flex; justify-content: center; margin-bottom: 1.75rem; }

.form-card h2 {
  font-size: 1.625rem; font-weight: 800; color: #111827;
  text-align: center; margin-bottom: 0.375rem;
  letter-spacing: -0.02em; line-height: 1.2;
}

.subtitle {
  text-align: center; color: #6b7280; font-size: 0.9rem;
  line-height: 1.55; margin-bottom: 1.875rem;
}

.email-display { color: #2da12b; font-weight: 700; word-break: break-all; }

/* ── OTP Input Group ── */
.otp-group {
  display: flex; gap: 10px; justify-content: center; margin-bottom: 1.25rem;
}

.otp-input {
  width: 52px; height: 62px;
  text-align: center;
  font-size: 1.5rem; font-weight: 800;
  font-family: 'Inter', sans-serif;
  color: #111827;
  border: 2px solid #e5e7eb; border-radius: 14px;
  background: #f9fafb;
  outline: none;
  transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease, transform 200ms cubic-bezier(0.16,1,0.3,1);
  caret-color: transparent;
}

.otp-input:focus {
  border-color: #2da12b; background: #fff;
  box-shadow: 0 0 0 3px rgba(45,161,43,0.15);
  transform: translateY(-2px);
}

.otp-input.otp-filled {
  border-color: #2da12b; background: #f0fdf4; color: #1e8a1c;
}

.otp-input.otp-error {
  border-color: #ef4444; background: #fff5f5; color: #dc2626;
}

/* ── Error text ── */
.error-text {
  text-align: center; margin-bottom: 1rem;
  font-size: 0.82rem; color: #dc2626; font-weight: 500; line-height: 1.45;
}

/* ── Success banner ── */
.success-banner {
  display: flex; align-items: center; gap: 0.75rem;
  background: #f0fdf4; border: 1.5px solid #bbf7d0;
  border-radius: 14px; padding: 14px 18px;
  font-size: 0.9rem; font-weight: 600; color: #166534;
  margin-bottom: 1.5rem; text-align: left;
}
.success-icon { font-size: 1.2rem; flex-shrink: 0; }

/* ── Primary button ── */
.btn-primary {
  width: 100%; padding: 13px;
  background: linear-gradient(135deg, #2da12b, #22c55e);
  color: white; border: none; border-radius: 11px;
  font-size: 0.95rem; font-weight: 700;
  font-family: 'Inter', sans-serif; cursor: pointer;
  box-shadow: 0 4px 14px rgba(45,161,43,0.28);
  transition: opacity 150ms, transform 150ms cubic-bezier(0.16,1,0.3,1), box-shadow 150ms;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin-bottom: 1.5rem; letter-spacing: -0.01em;
}
.btn-primary:hover:not(:disabled) {
  opacity: 0.92; transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(45,161,43,0.35);
}
.btn-primary:active:not(:disabled) { transform: translateY(0) scale(0.99); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; transform: none; }
.btn-primary:focus-visible { outline: 2px solid #2da12b; outline-offset: 3px; }

/* Spinner */
.spinner {
  width: 17px; height: 17px;
  border: 2.5px solid rgba(255,255,255,0.4);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Resend section ── */
.resend-section {
  display: flex; align-items: center; justify-content: center;
  gap: 0.5rem; margin-bottom: 0.25rem;
}
.resend-text { font-size: 0.84rem; color: #6b7280; }
.btn-resend {
  background: none; border: none;
  font-family: 'Inter', sans-serif; font-size: 0.84rem; font-weight: 700;
  color: #2da12b; cursor: pointer;
  padding: 4px 6px; border-radius: 6px;
  transition: color 150ms, background 150ms;
  letter-spacing: -0.01em;
}
.btn-resend:hover:not(:disabled) { color: #1e8a1c; background: #f0fdf4; }
.btn-resend:disabled { color: #9ca3af; cursor: not-allowed; }
.btn-resend:focus-visible { outline: 2px solid #2da12b; border-radius: 4px; outline-offset: 2px; }

/* ── Divider ── */
.divider {
  display: flex; align-items: center; margin: 1.375rem 0;
  color: #9ca3af; font-size: 0.8rem; font-weight: 500;
}
.divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid #e5e7eb; }
.divider span { padding: 0 14px; }

/* ── Secondary button ── */
.btn-secondary {
  width: 100%; padding: 13px;
  background: #fff; color: #4b5563;
  border: 1.5px solid #e5e7eb; border-radius: 11px;
  font-size: 0.9rem; font-family: 'Inter', sans-serif;
  cursor: pointer; transition: border-color 150ms, background 150ms;
  letter-spacing: -0.01em;
}
.btn-secondary:hover { border-color: #2da12b; background: #f0fdf4; }
.btn-secondary:focus-visible { outline: 2px solid #2da12b; outline-offset: 3px; }

/* ── Responsive ── */
@media (max-width: 900px) {
  .panel-left { display: none; }
  .page { background: #fff; }
  .panel-right { padding: 1.25rem 1rem; background: #fff; }
  .form-card { box-shadow: none; border: none; padding: 2rem 0.5rem; border-radius: 0; animation: none; }
  .otp-input { width: 44px; height: 54px; font-size: 1.25rem; border-radius: 12px; }
}
</style>
