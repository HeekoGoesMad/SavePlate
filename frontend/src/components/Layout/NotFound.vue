<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const score = ref(0)

const foodItems = ref([
  { id: 1, char: '🍎', style: { top: '15%', left: '10%', animationDelay: '0s' } },
  { id: 2, char: '🥦', style: { top: '25%', right: '15%', animationDelay: '1s' } },
  { id: 3, char: '🧀', style: { bottom: '20%', left: '20%', animationDelay: '2s' } },
  { id: 4, char: '🍞', style: { bottom: '30%', right: '25%', animationDelay: '1.5s' } },
  { id: 5, char: '🍅', style: { top: '50%', left: '8%', animationDelay: '0.5s' } },
  { id: 6, char: '🥑', style: { bottom: '15%', right: '10%', animationDelay: '2.5s' } }
])

function rescueFood(item) {
  foodItems.value = foodItems.value.filter(f => f.id !== item.id)
  score.value++
}

function goBack() {
  router.back()
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="not-found-page">
    <!-- Floating interactive ingredients -->
    <div 
      v-for="food in foodItems" 
      :key="food.id" 
      class="floating-food" 
      :style="food.style"
      @click="rescueFood(food)"
      title="Click to rescue!"
    >
      {{ food.char }}
    </div>

    <!-- Main Card Content -->
    <div class="content-card">
      <div class="plate-illustration">
        <!-- Styled plate using CSS -->
        <div class="outer-plate">
          <div class="inner-plate">
            <span class="number-404">404</span>
          </div>
        </div>
        <div class="utensil fork">🍴</div>
        <div class="utensil knife">🔪</div>
      </div>

      <h1 class="title">Plate Not Found</h1>
      <p class="subtitle">
        Looks like this page has gone to waste. No food was harmed, but this URL doesn't exist anymore!
      </p>

      <div v-if="score > 0" class="score-board animate-pop">
        Ingredients Rescued: <strong>{{ score }}</strong>
      </div>

      <div class="actions">
        <button class="btn-primary" @click="goHome">
          Back to Dashboard
        </button>
        <button class="btn-secondary" @click="goBack">
         Go Back
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page Wrapper styling */
.not-found-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bg);
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}

/* Floating interactive foods */
.floating-food {
  position: absolute;
  font-size: 2.5rem;
  cursor: pointer;
  user-select: none;
  animation: floatAround 6s ease-in-out infinite alternate;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s;
  z-index: 1;
}
.floating-food:hover {
  transform: scale(1.4) rotate(15deg);
}
.floating-food:active {
  transform: scale(0.8);
}

@keyframes floatAround {
  0% {
    transform: translateY(0) rotate(0deg);
  }
  100% {
    transform: translateY(-20px) rotate(10deg);
  }
}

/* Content card styles */
.content-card {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-2xl);
  padding: var(--sp-8) var(--sp-6);
  width: 90%;
  max-width: 520px;
  text-align: center;
  box-shadow: var(--shadow-lg);
  animation: fadeUp 0.6s var(--ease-out);
  z-index: 2;
}

/* CSS Plate illustration */
.plate-illustration {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: var(--sp-4) auto var(--sp-8);
  height: 160px;
  width: 240px;
}

.outer-plate {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: 10px solid #e2e8f0;
  background: #f8fafc;
  box-shadow: inset 0 4px 6px rgba(0, 0, 0, 0.05), var(--shadow-sm);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.3s var(--ease-out);
}
.outer-plate:hover {
  transform: scale(1.05) rotate(5deg);
}

.inner-plate {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px dashed #cbd5e1;
  background: var(--surface);
  display: flex;
  justify-content: center;
  align-items: center;
}

.number-404 {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--brand);
  letter-spacing: -1px;
}

.utensil {
  position: absolute;
  font-size: 2.2rem;
  user-select: none;
}
.fork {
  left: 10px;
  animation: bounceFork 2s ease-in-out infinite alternate;
}
.knife {
  right: 10px;
  animation: bounceKnife 2s ease-in-out infinite alternate;
}

@keyframes bounceFork {
  0% { transform: translateY(0); }
  100% { transform: translateY(-8px); }
}
@keyframes bounceKnife {
  0% { transform: translateY(0); }
  100% { transform: translateY(8px); }
}

/* Titles and description styling */
.title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--sp-2);
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: var(--sp-6);
  padding: 0 var(--sp-2);
}

/* Score section */
.score-board {
  display: inline-block;
  background: var(--green-50);
  border: 1px solid var(--green-200);
  color: var(--green-700);
  padding: var(--sp-2) var(--sp-4);
  border-radius: var(--r-full);
  font-size: 0.95rem;
  margin-bottom: var(--sp-6);
  font-weight: 500;
}


.animate-pop {
  animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* Action button configurations */
.actions {
  display: flex;
  gap: var(--sp-3);
  justify-content: center;
}

button {
  cursor: pointer;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  padding: var(--sp-3) var(--sp-5);
  border-radius: var(--r-lg);
  border: none;
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  transition: all var(--t-fast) var(--ease-out);
}

.btn-primary {
  background: var(--brand);
  color: var(--surface);
  box-shadow: 0 4px 12px rgba(45, 161, 43, 0.2);
}
.btn-primary:hover {
  background: var(--brand-dark);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(45, 161, 43, 0.3);
}
.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: var(--surface);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}
.btn-secondary:hover {
  background: var(--bg);
  color: var(--text-primary);
  border-color: var(--text-muted);
  transform: translateY(-2px);
}
.btn-secondary:active {
  transform: translateY(0);
}

@media (max-width: 480px) {
  .actions {
    flex-direction: column;
    align-items: stretch;
  }
  .content-card {
    padding: var(--sp-6) var(--sp-4);
  }
  .title {
    font-size: 1.75rem;
  }
}
</style>
