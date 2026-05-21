import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { authService } from '../authService.js'

// Reset authentication state before each test
beforeEach(() => {
  authService.logout()
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url, options) => {
    let responseData = {}
    if (url.includes('/auth/register')) {
      responseData = { message: 'Registration successful' }
    } else if (url.includes('/auth/verify-otp')) {
      responseData = { token: 'mock-token', user: { id: 1, name: 'Ivan Maulana', email: 'ivan@example.com' } }
    } else if (url.includes('/auth/send-otp')) {
      responseData = { message: 'OTP sent' }
    } else if (url.includes('/auth/login-2fa')) {
      responseData = { token: 'mfa-token', user: { id: 1, name: 'Ivan Maulana', email: 'ivan@example.com', is2FAEnabled: true } }
    } else if (url.includes('/auth/login')) {
      responseData = { requires2FA: true, email: 'ivan@example.com' }
    } else if (url.includes('/auth/profile')) {
      if (options.method === 'PUT') {
        const body = JSON.parse(options.body || '{}')
        responseData = { user: { id: 1, name: 'Ivan Maulana', email: 'ivan@example.com', ...body } }
      } else {
        responseData = { id: 1, name: 'Ivan Maulana', email: 'ivan@example.com' }
      }
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(responseData),
    })
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  authService.logout()
})

// =============================================================================
//  USER STORY 1.1 - Register User & OTP Verification (FR-1.1, FR-1.2)
// =============================================================================
describe('US-1.1 | Register User & OTP Verification (FR-1.1, FR-1.2)', () => {

  // ---------------------------------------------------------------------------
  it('[TC-101] registerUser submits data and returns success message', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    const result = await authService.registerUser('Ivan Maulana', 'ivan@example.com', 'Password123!', 3)
    
    expect(result.message).toBe('Registration successful')
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/auth/register'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Ivan Maulana',
          email: 'ivan@example.com',
          password: 'Password123!',
          householdSize: 3
        })
      })
    )
  })

  // ---------------------------------------------------------------------------
  it('[TC-102] registerUser fails when backend returns registration error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Email already registered' }),
    }))

    await expect(authService.registerUser('Ivan Maulana', 'ivan@example.com', 'Password123!'))
      .rejects.toThrow('Email already registered')
  })

  // ---------------------------------------------------------------------------
  it('[TC-103] sendOtp sends verification email with code', async () => {
    const result = await authService.sendOtp('ivan@example.com')
    expect(result.message).toBe('OTP sent')
  })

  // ---------------------------------------------------------------------------
  it('[TC-104] verifyOtp verifies the OTP and sets active session', async () => {
    expect(authService.isLoggedIn.value).toBe(false)
    const result = await authService.verifyOtp('ivan@example.com', '123456')
    
    expect(result.token).toBe('mock-token')
    expect(authService.isLoggedIn.value).toBe(true)
    expect(authService.user.value.name).toBe('Ivan Maulana')
  })

  // ---------------------------------------------------------------------------
  it('[TC-105] verifyOtp throws an error on incorrect OTP code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Failed to verify OTP' }),
    }))

    await expect(authService.verifyOtp('ivan@example.com', '000000'))
      .rejects.toThrow('Failed to verify OTP')
    expect(authService.isLoggedIn.value).toBe(false)
  })

})

// =============================================================================
//  USER STORY 1.2 - Two-Factor Authentication (2FA) (FR-1.3)
// =============================================================================
describe('US-1.2 | Two-Factor Authentication (2FA) (FR-1.3)', () => {

  // ---------------------------------------------------------------------------
  it('[TC-106] loginUser flags 2FA requirement when enabled on profile', async () => {
    const result = await authService.loginUser('ivan@example.com', 'Password123!')
    expect(result.requires2FA).toBe(true)
    expect(authService.isLoggedIn.value).toBe(false)
  })

  // ---------------------------------------------------------------------------
  it('[TC-107] login2FA completes session establishing after verification', async () => {
    const result = await authService.login2FA('ivan@example.com', '654321')
    expect(result.token).toBe('mfa-token')
    expect(authService.isLoggedIn.value).toBe(true)
    expect(authService.user.value.is2FAEnabled).toBe(true)
  })

  // ---------------------------------------------------------------------------
  it('[TC-108] login2FA throws error when code is invalid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: '2FA verification failed' }),
    }))

    await expect(authService.login2FA('ivan@example.com', '000000'))
      .rejects.toThrow('2FA verification failed')
    expect(authService.isLoggedIn.value).toBe(false)
  })

})

// =============================================================================
//  USER STORY 1.3 - Privacy Settings Management (FR-1.4, FR-1.5)
// =============================================================================
describe('US-1.3 | Privacy Settings Management (FR-1.4, FR-1.5)', () => {

  // ---------------------------------------------------------------------------
  it('[TC-109] updateProfile persists listingVisibility, showFullName, showLocation to the database', async () => {
    const privacyPayload = {
      privacySettings: {
        listingVisibility: 'Community Only',
        showFullName: false,
        showLocation: false
      }
    }
    const result = await authService.updateProfile(privacyPayload)
    expect(result.user.privacySettings.listingVisibility).toBe('Community Only')
    expect(authService.user.value.privacySettings.showFullName).toBe(false)
  })

  // ---------------------------------------------------------------------------
  it('[TC-110] authHeaders includes the token inside requests once logged in', async () => {
    await authService.verifyOtp('ivan@example.com', '123456')
    const headers = authService.authHeaders()
    expect(headers.Authorization).toBe('Bearer mock-token')
  })

  // ---------------------------------------------------------------------------
  it('[TC-111] logout clears token and user info from reactive state', async () => {
    await authService.verifyOtp('ivan@example.com', '123456')
    expect(authService.isLoggedIn.value).toBe(true)
    
    authService.logout()
    expect(authService.isLoggedIn.value).toBe(false)
    expect(authService.token.value).toBe('')
    expect(authService.user.value).toBeNull()
  })

})
