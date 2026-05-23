import { ref, computed } from 'vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const storage = typeof localStorage !== 'undefined'
  ? localStorage
  : {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
  }

const token = ref(storage.getItem('sp_token') || '')
const user = ref(JSON.parse(storage.getItem('sp_user') || 'null'))
const isLoggedIn = computed(() => !!token.value)


function authHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
  }
}

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
  // If 2FA required, don't set session yet return the flag
  if (data.requires2FA) return data
  setSession(data.token, data.user)
  return data
}

async function login2FA(email, otpCode) {
  const response = await fetch(`${API_URL}/auth/login-2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otpCode }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || '2FA verification failed')
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

async function changePassword(currentPassword, newPassword) {
  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Failed to change password')
  return data
}

function logout() {
  clearSession()
}

async function forgotPassword(email) {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Failed to send reset code')
  return data
}

async function resetPassword(email, otpCode, newPassword) {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otpCode, newPassword }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Failed to reset password')
  return data
}


export const authService = {
  token,
  user,
  isLoggedIn,
  authHeaders,
  loginUser,
  login2FA,
  registerUser,
  sendOtp,
  verifyOtp,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
}

