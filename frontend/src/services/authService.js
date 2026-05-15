import { ref } from 'vue'

// In a real application, this would interact with an API and check local storage/cookies
const isLoggedIn = ref(false)

function login() {
  isLoggedIn.value = true
}

function register() {
  isLoggedIn.value = true
}

function logout() {
  isLoggedIn.value = false
}

export const authService = {
  isLoggedIn,
  login,
  register,
  logout
}
