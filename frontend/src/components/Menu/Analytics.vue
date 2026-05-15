<script setup>
import { ref } from 'vue'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useNotifications } from '@/composables/useNotifications'
import {
  infoBoxes,
  impactStats,
  chartData,
  badges,
  hasData,
  timePeriod,
  selectedCategory,
  clearData,
  restoreData
} from '@/services/analyticsService'

const { unreadCount } = useNotifications()
const userName = ref('Adrienne Kayana')
</script>

<template>
  <AppLayout :unread-count="unreadCount" :user-name="userName">
    <div class="analytics-page">
      <!-- ── Header & Filters (FR-4.2) ── -->
      <div class="page-header">
        <div class="header-text">
          <h1>Food Analytics</h1>
          <p class="subtitle">Track your impact and inventory insights over time.</p>
        </div>

        <div class="header-actions">
          <!-- Filter: Category -->
          <select v-model="selectedCategory" class="filter-select">
            <option value="All">All Categories</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Fruits">Fruits</option>
            <option value="Dairy">Dairy</option>
            <option value="Bakery">Bakery</option>
          </select>

          <!-- Filter: Time Period -->
          <select v-model="timePeriod" class="filter-select">
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>

          <!-- Dev toggle for Empty State -->
          <button v-if="hasData" @click="clearData" class="dev-btn" title="Simulate Empty Data">👁️</button>
          <button v-else @click="restoreData" class="dev-btn" title="Restore Data">🔄</button>
        </div>
      </div>

      <!-- ── Empty State (FR-4.5) ── -->
      <div v-if="!hasData" class="empty-state">
        <div class="empty-icon">📊</div>
        <h2>No Data to Display</h2>
        <p>You haven't tracked any food or donations for this period. Start adding items to your inventory to see your
          impact!</p>
        <div class="empty-actions">
          <router-link to="/inventory" class="btn-primary">Go to Inventory</router-link>
          <router-link to="/browse" class="btn-secondary">Browse Food</router-link>
        </div>
      </div>

      <!-- ── Dashboard Content (FR-4.1) ── -->
      <template v-else>
        <!-- ── Top Info Boxes ── -->
        <div class="info-row">
          <div v-for="(box, i) in infoBoxes" :key="i" class="summary-card"
            :style="{ '--card-bg': box.bgColor, '--card-color': box.color }">
            <div class="card-icon">{{ box.icon }}</div>
            <div class="card-body">
              <div class="card-value">{{ box.value }}</div>
              <div class="card-label">{{ box.title }}</div>
              <div class="card-unit">{{ box.desc }}</div>
            </div>
            <!-- Trend Indicator (FR-4.3) -->
            <div v-if="box.trend" class="trend-badge" :class="{ 'positive': box.trend.isPositive }">
              <span class="trend-icon">{{ box.trend.isPositive ? '↑' : '↓' }}</span>
              {{ box.trend.value }}%
            </div>
          </div>
        </div>

        <!-- ── Charts Row (Two Columns) ── -->
        <div class="charts-grid">
          <!-- Chart 1: Donut -->
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

          <!-- Chart 2: Activity (FR-4.1) -->
          <div class="panel">
            <div class="panel-head">
              <h2>📈 Activity Over Time</h2>
            </div>
            <div class="chart-content">
              <div class="bar-chart">
                <div class="bar-group" v-for="(item, idx) in chartData" :key="idx">
                  <div class="bar-track">
                    <div class="bar-fill" :style="{ height: (item.value / item.maxValue * 100) + '%' }"></div>
                  </div>
                  <span class="bar-label">{{ item.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Badges & Impact Row ── -->
        <div class="bottom-grid">
          <!-- Environment Impact -->
          <div class="panel impact-panel">
            <div class="panel-head">
              <h2>🌍 Environment Impact</h2>
            </div>
            <div class="impact-content">
              <div class="impact-stat-item" v-for="(stat, idx) in impactStats" :key="idx">
                <div class="stat-icon" :style="{ background: stat.bgColor, color: stat.color }">{{ stat.icon }}</div>
                <div class="stat-data">
                  <div class="stat-val">{{ stat.value }}</div>
                  <div class="stat-lbl">{{ stat.label }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Badges (FR-4.4) -->
          <div class="panel badges-panel">
            <div class="panel-head">
              <h2>🏆 Milestones & Badges</h2>
            </div>
            <div class="badges-content">
              <div v-for="badge in badges" :key="badge.id" class="badge-item" :class="{ 'achieved': badge.achieved }">
                <div class="badge-icon-wrap" :class="{ 'locked': !badge.achieved }">
                  <span class="b-icon">{{ badge.icon }}</span>
                </div>
                <div class="badge-info">
                  <div class="badge-title">{{ badge.title }}</div>
                  <div class="badge-progress-wrap">
                    <div class="badge-progress-bar">
                      <div class="badge-progress-fill" :style="{ width: (badge.current / badge.target * 100) + '%' }">
                      </div>
                    </div>
                    <div class="badge-progress-text">{{ badge.current }}/{{ badge.target }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

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
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.header-text {
  flex: 1;
  min-width: 0;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a1a;
  background: none;
  -webkit-text-fill-color: unset;
  margin-bottom: 3px;
  line-height: 1.2;
}

.subtitle {
  font-size: 0.85rem;
  color: #7a8a7a;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #e8ede8;
  border-radius: 8px;
  background: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  color: #2a2a2a;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:hover,
.filter-select:focus {
  border-color: #2da12b;
}

.dev-btn {
  background: #f0f4f0;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background 0.2s;
}

.dev-btn:hover {
  background: #e0e8e0;
}

/* ── Empty State ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  background: #fff;
  border-radius: 16px;
  border: 1px dashed #c0d0c0;
  margin-top: 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.5;
}

.empty-state h2 {
  font-size: 1.4rem;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.empty-state p {
  font-size: 0.95rem;
  color: #5a6a5a;
  max-width: 400px;
  line-height: 1.5;
  margin-bottom: 2rem;
}

.empty-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary {
  padding: 0.6rem 1.5rem;
  background: #2da12b;
  color: #fff;
  border-radius: 8px;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #248822;
}

.btn-secondary {
  padding: 0.6rem 1.5rem;
  background: #f0f4f0;
  color: #2da12b;
  border-radius: 8px;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #e0e8e0;
}

/* ── Info Boxes ── */
.info-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.summary-card {
  background: var(--card-bg);
  border-radius: 14px;
  padding: 1.2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
  position: relative;
  overflow: hidden;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
}

.card-icon {
  font-size: 1.8rem;
  line-height: 1;
}

.card-body {
  display: flex;
  flex-direction: column;
}

.card-value {
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--card-color);
  line-height: 1;
  margin-bottom: 2px;
}

.card-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #2a2a2a;
}

.card-unit {
  font-size: 0.68rem;
  color: #7a8a7a;
}

/* Trend Badge */
.trend-badge {
  position: absolute;
  top: 1.2rem;
  right: 1.2rem;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.05);
  color: #5a6a5a;
}

.trend-badge.positive {
  background: rgba(45, 161, 43, 0.15);
  color: #2da12b;
}

/* ── Panels ── */
.panel {
  background: #fff;
  border: 1px solid #e8ede8;
  border-radius: 16px;
  padding: 1.25rem;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;
}

.panel-head h2 {
  font-size: 0.95rem;
  font-weight: 800;
  color: #1a1a1a;
}

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
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.donut-chart::after {
  content: '';
  position: absolute;
  top: 25%;
  left: 25%;
  width: 50%;
  height: 50%;
  background: #fdfdfd;
  border-radius: 50%;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.04);
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
  box-shadow: 0 4px 10px rgba(45, 161, 43, 0.25);
}

.bar-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #7a8a7a;
}

/* ── Bottom Grid ── */
.bottom-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

/* Impact Panel */
.impact-panel {
  display: flex;
  flex-direction: column;
}

.impact-content {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0.5rem 0;
  flex: 1;
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

/* Badges Panel */
.badges-content {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.badge-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.5rem 0;
}

.badge-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #fff8e1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.badge-icon-wrap.locked {
  background: #f0f4f0;
  filter: grayscale(100%);
  opacity: 0.5;
}

.badge-info {
  flex: 1;
  min-width: 0;
}

.badge-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.badge-progress-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-progress-bar {
  flex: 1;
  height: 6px;
  background: #f0f4f0;
  border-radius: 3px;
  overflow: hidden;
}

.badge-progress-fill {
  height: 100%;
  background: #f59e0b;
  border-radius: 3px;
}

.badge-progress-text {
  font-size: 0.7rem;
  font-weight: 600;
  color: #7a8a7a;
}

/* ── Mobile Responsive ── */
@media (max-width: 960px) {
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .analytics-page {
    padding: 1rem;
    gap: 1rem;
  }

  .page-header h1 {
    font-size: 1.2rem;
  }

  .info-row {
    grid-template-columns: 1fr;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .impact-content {
    flex-direction: column;
    gap: 1.5rem;
    align-items: flex-start;
  }
}

@media (max-width: 400px) {
  .donut-wrap {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>
