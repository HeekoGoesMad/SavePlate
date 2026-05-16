import { ref, computed } from 'vue'

const API_URL = 'http://localhost:3000/api'
const storage = typeof localStorage !== 'undefined'
  ? localStorage
  : {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }

// ── Reactive state ──
const token = ref(storage.getItem('sp_token') || '')
const user = ref(JSON.parse(storage.getItem('sp_user') || 'null'))
const isLoggedIn = computed(() => !!token.value)

// ── Helper: auth headers ──
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
  }
}

// ── Persist / clear session ──
function setSession(tkn, usr) {
  token.value = tkn
  user.value = usr
  storage.setItem('sp_token', tkn)
  storage.setItem('sp_user', JSON.stringify(usr))
}

function clearSession() {
  token.value = ''
  user.value = null
  storage.removeItem('sp_token')
  storage.removeItem('sp_user')
}

// ── API calls ──

async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Login failed')
  }
  setSession(data.token, data.user)
  return data
}

async function registerUser(name, email, password, householdSize = undefined) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, householdSize }),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed')
  }
  return data
}

async function sendOtp(email) {
  const response = await fetch(`${API_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to send OTP')
  }
  return data
}

async function verifyOtp(email, otpCode) {
  const response = await fetch(`${API_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otpCode }),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify OTP')
  }
  // Auto-login after verification
  if (data.token && data.user) {
    setSession(data.token, data.user)
  }
  return data
}

async function getProfile() {
  const response = await fetch(`${API_URL}/auth/profile`, {
    headers: authHeaders(),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Failed to fetch profile')
  user.value = data
  storage.setItem('sp_user', JSON.stringify(data))
  return data
}

async function updateProfile(nameOrPayload, email) {
  const payload = typeof nameOrPayload === 'object'
    ? nameOrPayload
    : { name: nameOrPayload, email }
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Failed to update profile')
  if (data.user) {
    user.value = data.user
    storage.setItem('sp_user', JSON.stringify(data.user))
  }
  return data
}

function logout() {
  clearSession()
}

export const authService = {
  token,
  user,
  isLoggedIn,
  authHeaders,
  loginUser,
  registerUser,
  sendOtp,
  verifyOtp,
  getProfile,
  updateProfile,
  logout,
}
