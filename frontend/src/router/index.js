import { createRouter, createWebHistory } from 'vue-router'
import { authService } from '@/services/authService'

import LoginPage    from '@/components/User Registration/LoginPage.vue'
import RegisterPage from '@/components/User Registration/RegisterPage.vue'
import AuthPage     from '@/components/User Registration/AuthPage.vue'
import Dashboard    from '@/components/Menu/Dashboard.vue'
import Inventory    from '@/components/Menu/Inventory.vue'
import Notification from '@/components/Menu/Notification.vue'
import MealPlanner  from '@/components/Menu/MealPlanner.vue'
import BrowseFood   from '@/components/Menu/BrowseFood.vue'
import Analytics    from '@/components/Menu/Analytics.vue'
import Settings     from '@/components/Menu/Settings.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/register', name: 'register', component: RegisterPage },
  { path: '/verify', name: 'verify', component: AuthPage },
  { path: '/', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/inventory', name: 'inventory', component: Inventory, meta: { requiresAuth: true } },
  { path: '/notifications', name: 'notifications', component: Notification, meta: { requiresAuth: true } },
  { path: '/browse', name: 'browse', component: BrowseFood, meta: { requiresAuth: true } },
  { path: '/meal-planner', name: 'meal-planner', component: MealPlanner, meta: { requiresAuth: true } },
  { path: '/analytics', name: 'analytics', component: Analytics, meta: { requiresAuth: true } },
  { path: '/settings', name: 'settings', component: Settings, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !authService.isLoggedIn.value) {
    next({ name: 'login' })
  } else if ((to.name === 'login' || to.name === 'register') && authService.isLoggedIn.value) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
