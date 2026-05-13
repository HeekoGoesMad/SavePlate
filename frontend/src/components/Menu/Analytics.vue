<script setup>
import { ref } from 'vue'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useNotifications } from '@/composables/useNotifications'

const emit = defineEmits(['navigate'])

const { unreadCount } = useNotifications()
const userName = ref('Adrienne Kayana')

const infoBoxes = [
  { title: 'Total Saved', value: '1,240', icon: '🥑', bgColor: '#f0faf0', color: '#2da12b', desc: 'Items rescued this year' },
  { title: 'Donations', value: '85', icon: '🤝', bgColor: '#eff6ff', color: '#3b82f6', desc: 'Meals safely donated' },
  { title: 'Waste Reduced', value: '45kg', icon: '♻️', bgColor: '#fdf4ff', color: '#c026d3', desc: 'Less into landfills' },
]
</script>

<template>
  <AppLayout current-page="analytics" :unread-count="unreadCount" :user-name="userName" @navigate="emit('navigate', $event)">
    <div class="analytics-page">
      <!-- ── Header ── -->
      <div class="page-header">
        <div class="header-text">
          <h1>Food Analytics</h1>
          <p class="subtitle">Track your impact and inventory insights over time.</p>
        </div>
      </div>

      <!-- ── Top Info Boxes ── -->
      <div class="info-row">
        <div v-for="(box, i) in infoBoxes" :key="i" class="summary-card" :style="{ '--card-bg': box.bgColor, '--card-color': box.color }">
          <div class="card-icon">{{ box.icon }}</div>
          <div class="card-body">
            <div class="card-value">{{ box.value }}</div>
            <div class="card-label">{{ box.title }}</div>
            <div class="card-unit">{{ box.desc }}</div>
          </div>
        </div>
      </div>

      <!-- ── Charts Row (Two Columns) ── -->
      <div class="charts-grid">
        <!-- Chart 1 -->
        <div class="panel">
          <div class="panel-head">
            <h2>📊 Food Items Distribution</h2>
          </div>
          <div class="chart-content">
            <div class="donut-wrap">
              <div class="donut-chart"></div>
              <div class="donut-legend">
                <div class="leg-item"><span class="dot" style="background: #2da12b;"></span> Veggies (40%)</div>
                <div class="leg-item"><span class="dot" style="background: #f59e0b;"></span> Fruits (30%)</div>
                <div class="leg-item"><span class="dot" style="background: #3b82f6;"></span> Dairy (20%)</div>
                <div class="leg-item"><span class="dot" style="background: #ef4444;"></span> Meats (10%)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chart 2 -->
        <div class="panel">
          <div class="panel-head">
            <h2>📈 Monthly Activity</h2>
          </div>
          <div class="chart-content">
             <div class="bar-chart">
               <div class="bar-group" v-for="(month, idx) in ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']" :key="idx">
                 <div class="bar-track">
                   <div class="bar-fill" :style="{ height: Math.floor(Math.random() * 50 + 40) + '%' }"></div>
                 </div>
                 <span class="bar-label">{{ month }}</span>
               </div>
             </div>
          </div>
        </div>
      </div>

      <!-- ── Environment Impact Row (Full Width) ── -->
      <div class="panel impact-panel">
        <div class="panel-head">
          <h2>🌍 Environment Impact</h2>
        </div>
        <div class="impact-content">
          <div class="impact-stat-item">
            <div class="stat-icon" style="background: #e0f2fe; color: #0284c7;">💨</div>
            <div class="stat-data">
              <div class="stat-val">320 kg</div>
              <div class="stat-lbl">CO₂ Reduced</div>
            </div>
          </div>
          <div class="impact-stat-item">
            <div class="stat-icon" style="background: #dcfce7; color: #16a34a;">💧</div>
            <div class="stat-data">
              <div class="stat-val">1,500 L</div>
              <div class="stat-lbl">Water Saved</div>
            </div>
          </div>
          <div class="impact-stat-item">
            <div class="stat-icon" style="background: #fef3c7; color: #d97706;">💰</div>
            <div class="stat-data">
              <div class="stat-val">$450</div>
              <div class="stat-lbl">Money Saved</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<style scoped>
.analytics-page {
  padding: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.header-text { flex: 1; min-width: 0; }
.page-header h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a1a;
  background: none;
  -webkit-text-fill-color: unset;
  margin-bottom: 3px;
  line-height: 1.2;
}
.subtitle { font-size: 0.85rem; color: #7a8a7a; }

/* ── Info Boxes ── */
.info-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}
.summary-card {
  background: var(--card-bg);
  border-radius: 14px; padding: 1.2rem;
  display: flex; align-items: center; gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
}
.summary-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.05); }
.card-icon  { font-size: 1.8rem; line-height: 1; }
.card-body  { display: flex; flex-direction: column; }
.card-value { font-size: 1.6rem; font-weight: 900; color: var(--card-color); line-height: 1; margin-bottom: 2px; }
.card-label { font-size: 0.8rem; font-weight: 700; color: #2a2a2a; }
.card-unit  { font-size: 0.68rem; color: #7a8a7a; }

/* ── Panels ── */
.panel { background: #fff; border: 1px solid #e8ede8; border-radius: 16px; padding: 1.25rem; }
.panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.2rem; }
.panel-head h2 { font-size: 0.95rem; font-weight: 800; color: #1a1a1a; }

/* ── Charts Grid ── */
.charts-grid {
  display: grid; 
  grid-template-columns: 1fr 1fr; 
  gap: 1rem; 
}
.chart-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: #fdfdfd;
  border-radius: 12px;
}

/* Donut Chart Simulation */
.donut-wrap {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
  padding: 0 1rem;
}
.donut-chart {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(#2da12b 0% 40%, #f59e0b 40% 70%, #3b82f6 70% 90%, #ef4444 90% 100%);
  position: relative;
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
  flex-shrink: 0;
}
.donut-chart::after {
  content: '';
  position: absolute;
  top: 25%; left: 25%;
  width: 50%; height: 50%;
  background: #fdfdfd;
  border-radius: 50%;
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.04);
}
.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.leg-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #5a6a5a;
}
.leg-item .dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

/* Bar Chart Simulation */
.bar-chart {
  width: 100%;
  height: 160px;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: 0 0.5rem;
}
.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  height: 100%;
}
.bar-track {
  width: 28px;
  flex: 1;
  background: #f0f4f0;
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  position: relative;
}
.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #3dc43b 0%, #2da12b 100%);
  border-radius: 8px;
  transition: height 0.8s ease;
  box-shadow: 0 4px 10px rgba(45,161,43,0.25);
}
.bar-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #7a8a7a;
}

/* ── Impact Row ── */
.impact-panel {
  background: #fff;
}
.impact-content {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0.5rem 0;
}
.impact-stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
}
.stat-data {
  display: flex;
  flex-direction: column;
}
.stat-val {
  font-size: 1.4rem;
  font-weight: 800;
  color: #1a1a1a;
  line-height: 1.1;
  margin-bottom: 2px;
}
.stat-lbl {
  font-size: 0.75rem;
  font-weight: 700;
  color: #7a8a7a;
}

/* ── Mobile Responsive ── */
@media (max-width: 860px) {
  .analytics-page { padding: 1rem; gap: 1rem; }
  .page-header h1 { font-size: 1.2rem; }
  
  .info-row { grid-template-columns: 1fr; }
  .charts-grid { grid-template-columns: 1fr; }
  
  .impact-content {
    flex-direction: column;
    gap: 1.5rem;
    align-items: flex-start;
  }
}
@media (max-width: 400px) {
  .donut-wrap { flex-direction: column; gap: 1rem; align-items: flex-start; }
}
</style>
