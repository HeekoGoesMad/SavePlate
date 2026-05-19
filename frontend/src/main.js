import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

import { authService } from './services/authService'

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  if (response.status === 401) {
    authService.logout();
    router.push('/login');
  }
  return response;
};

createApp(App).use(router).mount('#app')
