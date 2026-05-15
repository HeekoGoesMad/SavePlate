<script setup>
import { ref } from 'vue'
import LoginPage     from '@/components/User Registration/LoginPage.vue'
import RegisterPage  from '@/components/User Registration/RegisterPage.vue'
import AuthPage      from '@/components/User Registration/AuthPage.vue'
import Dashboard     from '@/components/Menu/Dashboard.vue'
import Inventory     from '@/components/Menu/Inventory.vue'
import Notification  from '@/components/Menu/Notification.vue'
import MealPlanner   from '@/components/Menu/MealPlanner.vue'
import BrowseFood    from '@/components/Menu/BrowseFood.vue'
import Analytics     from '@/components/Menu/Analytics.vue'
import Settings      from '@/components/Menu/Settings.vue'

// ── Auth state ────────────────────────────────────────────────
const isLoggedIn   = ref(false)
const currentPage  = ref('dashboard')

// Public routes: 'login' | 'register' | 'verify'
const authView     = ref('login')
const pendingEmail = ref('')  // email passed from register to OTP page

// ── Event handlers ────────────────────────────────────────────
function onLogin() {
  isLoggedIn.value  = true
  currentPage.value = 'dashboard'
}

// FR-1.2: Registration triggers OTP step, not immediate login
function onRegisterPending(email) {
  pendingEmail.value = email
  authView.value     = 'verify'
}

// After successful OTP verification, activate account → go to login
function onVerifySuccess() {
  authView.value = 'login'
}

// Navigate handler (also handles logout from Settings)
function onNavigate(page) {
  if (page === 'logout') {
    isLoggedIn.value   = false
    authView.value     = 'login'
    pendingEmail.value = ''
    currentPage.value  = 'dashboard'
  } else {
    currentPage.value = page
  }
}
</script>

<template>
  <div id="app-root">
    <!-- ── Authenticated app ── -->
    <template v-if="isLoggedIn">
      <Dashboard    v-if="currentPage === 'dashboard'"          @navigate="onNavigate" />
      <Inventory    v-else-if="currentPage === 'inventory'"     @navigate="onNavigate" />
      <Notification v-else-if="currentPage === 'notifications'" @navigate="onNavigate" />
      <MealPlanner  v-else-if="currentPage === 'meal-planner'"  @navigate="onNavigate" />
      <BrowseFood   v-else-if="currentPage === 'browse'"        @navigate="onNavigate" />
      <Analytics    v-else-if="currentPage === 'analytics'"     @navigate="onNavigate" />
      <Settings     v-else-if="currentPage === 'settings'"      @navigate="onNavigate" />

      <!-- Placeholder for pages not in Iteration 1 scope -->
      <div v-else class="placeholder-page">
        <div class="placeholder-card">
          <div class="ph-icon">🚧</div>
          <h2>{{ currentPage.replace(/-/g, ' ') }}</h2>
          <p>This section is not in scope for Iteration 1.</p>
          <button @click="currentPage = 'dashboard'">← Back to Dashboard</button>
        </div>
      </div>
    </template>

    <!-- ── Public auth pages ── -->
    <template v-else>
      <LoginPage
        v-if="authView === 'login'"
        @go-register="authView = 'register'"
        @login-success="onLogin"
      />
      <RegisterPage
        v-else-if="authView === 'register'"
        @go-login="authView = 'login'"
        @register-pending="onRegisterPending"
      />
      <AuthPage
        v-else-if="authView === 'verify'"
        :email="pendingEmail"
        @verify-success="onVerifySuccess"
        @go-login="authView = 'login'"
      />
    </template>
  </div>
</template>

<style scoped>
.placeholder-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f0f4f0;
  font-family: 'Inter', sans-serif;
}
.placeholder-card {
  background: #fff;
  border: 1px solid #e8ede8;
  border-radius: 20px;
  padding: 3rem 2.5rem;
  text-align: center;
  max-width: 380px;
  width: 90%;
}
.ph-icon { font-size: 3rem; margin-bottom: 1rem; }
.placeholder-card h2 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1a1a1a;
  text-transform: capitalize;
  background: none;
  -webkit-text-fill-color: unset;
  margin-bottom: 0.5rem;
}
.placeholder-card p { font-size: 0.88rem; color: #7a8a7a; margin-bottom: 1.5rem; }
.placeholder-card button {
  padding: 11px 22px;
  background: linear-gradient(135deg, #2da12b, #3dc43b);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 4px 14px rgba(45,161,43,0.25);
}
</style>
