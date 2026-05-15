import { ref } from 'vue'

const API_URL = 'http://localhost:3000/api/auth'

// In a real application, this would interact with an API and check local storage/cookies
const isLoggedIn = ref(false)

function login() {
  isLoggedIn.value = true
}

function logout() {
  isLoggedIn.value = false
}

// ── API calls ────────────────────────────────────────────────

async function registerUser(name, email, password) {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed')
  }
  return data
}

async function sendOtp(email) {
  const response = await fetch(`${API_URL}/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to send OTP')
  }
  return data
}

async function verifyOtp(email, otpCode) {
  const response = await fetch(`${API_URL}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otpCode })
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify OTP')
  }
  return data
}

export const authService = {
  isLoggedIn,
  login,
  logout,
  registerUser,
  sendOtp,
  verifyOtp
}
