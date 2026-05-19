<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useNotifications } from '@/composables/useNotifications'
import {
  infoBoxes,
  impactStats,
  chartData,
  donutData,
  donutGradient,
  badges,
  hasData,
  isLoading,
  timePeriod,
  selectedCategory,
  fetchAnalytics,
  clearData,
  restoreData,
} from '@/services/analyticsService'

const { unreadCount } = useNotifications()
const userName = ref('Adrienne Kayana')

// Tooltip state for bar chart
const tooltip = ref({ visible: false, x: 0, y: 0, label: '', saved: 0, donated: 0 })

function showTooltip(event, item) {
  const rect = event.currentTarget.getBoundingClientRect()
  const parentRect = event.currentTarget.closest('.bar-chart-wrap').getBoundingClientRect()
  tooltip.value = {
    visible: true,
    x: rect.left - parentRect.left + rect.width / 2,
    y: rect.top - parentRect.top,
    label: item.label,
    saved: item.savedValue,
    donated: item.donatedValue,
  }
}
function hideTooltip() {
  tooltip.value.visible = false
}

onMounted(fetchAnalytics)
</script>

<template>
  <AppLayout :unread-count="unreadCount" :user-name="userName">
    <div class="analytics-page">

      <!-- ── Header & Filters ── -->
      <div class="page-header">
        <div class="header-text">
          <h1>Food Analytics</h1>
          <p class="subtitle">Track your impact and inventory insights over time.</p>
        </div>

        <div class="header-actions">
          <!-- Filter: Category -->
          <select v-model="selectedCategory" class="filter-select" id="filter-category">
            <option value="All">All Categories</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Dairy">Dairy</option>
            <option value="Bakery">Bakery</option>
            <option value="Canned">Canned</option>
            <option value="Frozen">Frozen</option>
            <option value="Other">Other</option>
          </select>

          <!-- Filter: Time Period -->
          <select v-model="timePeriod" class="filter-select" id="filter-period">
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>

          <!-- Refresh -->
          <button class="refresh-btn" @click="fetchAnalytics" :disabled="isLoading" title="Refresh">
            <span :class="{ spinning: isLoading }">↻</span>
          </button>
        </div>
      </div>

      <!-- ── Loading State ── -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading analytics…</p>
      </div>

      <!-- ── Empty State ── -->
      <div v-else-if="!hasData" class="empty-state">
        <div class="empty-icon">📊</div>
        <h2>No Data to Display</h2>
        <p>You haven't tracked any food or donations for this period. Start adding items to your inventory to see your
          impact!</p>
        <div class="empty-actions">
          <router-link to="/inventory" class="btn-primary">Go to Inventory</router-link>
          <router-link to="/browse" class="btn-secondary">Browse Food</router-link>
        </div>
      </div>

      <!-- ── Dashboard Content ── -->
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
            <div v-if="box.trend" class="trend-badge" :class="{ positive: box.trend.isPositive }">
              <span class="trend-icon">{{ box.trend.isPositive ? '↑' : '↓' }}</span>
              {{ box.trend.value }}
            </div>
          </div>
        </div>

        <!-- ── Charts Row ── -->
        <div class="charts-grid">

          <!-- Chart 1: Donut — Category Distribution -->
          <div class="panel">
            <div class="panel-head">
              <h2>Food Items by Category</h2>
              <span class="panel-badge">{{ selectedCategory === 'All' ? 'All' : selectedCategory }}</span>
            </div>
            <div class="chart-content">
              <div v-if="donutData.length" class="donut-wrap">
                <!-- Reactive SVG donut -->
                <div class="donut-container">
                  <div class="donut-chart" :style="{ background: donutGradient }"></div>
                  <div class="donut-center-label">
                    <span class="donut-total">{{donutData.reduce((s, d) => s + d.count, 0)}}</span>
                    <span class="donut-total-lbl">items</span>
                  </div>
                </div>
                <div class="donut-legend">
                  <div v-for="item in donutData" :key="item.label" class="leg-item">
                    <span class="dot" :style="{ background: item.color }"></span>
                    <span class="leg-name">{{ item.label }}</span>
                    <span class="leg-pct">{{ item.percent }}%</span>
                    <span class="leg-count">({{ item.count }})</span>
                  </div>
                </div>
              </div>
              <div v-else class="chart-empty">
                <span>📦</span>
                <p>No category data</p>
              </div>
            </div>
          </div>

          <!-- Chart 2: Bar Chart — Activity Over Time -->
          <div class="panel">
            <div class="panel-head">
              <h2>Activity Over Time</h2>
              <div class="bar-legend-inline">
                <span class="bl-dot" style="background:#2da12b"></span><span>Saved</span>
                <span class="bl-dot" style="background:#3b82f6; margin-left:10px"></span><span>Donated</span>
              </div>
            </div>
            <div class="chart-content">
              <div v-if="chartData.length" class="bar-chart-wrap" style="position:relative">

                <!-- Tooltip -->
                <div v-if="tooltip.visible" class="bar-tooltip"
                  :style="{ left: tooltip.x + 'px', top: (tooltip.y - 10) + 'px' }">
                  <strong>{{ tooltip.label }}</strong>
                  <div>🥑 Saved: {{ tooltip.saved }}</div>
                  <div>🤝 Donated: {{ tooltip.donated }}</div>
                </div>

                <div class="bar-chart">
                  <div class="bar-group" v-for="(item, idx) in chartData" :key="idx"
                    @mouseenter="showTooltip($event, item)" @mouseleave="hideTooltip">
                    <div class="bars-stack">
                      <!-- Saved bar (green) -->
                      <div class="bar-track">
                        <div class="bar-fill green" :style="{ height: (item.savedValue / item.maxValue * 100) + '%' }">
                          <span v-if="item.savedValue > 0" class="bar-val">{{ item.savedValue }}</span>
                        </div>
                      </div>
                      <!-- Donated bar (blue) -->
                      <div class="bar-track">
                        <div class="bar-fill blue" :style="{ height: (item.donatedValue / item.maxValue * 100) + '%' }">
                          <span v-if="item.donatedValue > 0" class="bar-val">{{ item.donatedValue }}</span>
                        </div>
                      </div>
                    </div>
                    <span class="bar-label">{{ item.label }}</span>
                  </div>
                </div>

                <!-- Y-axis reference lines -->
                <div class="y-gridlines">
                  <div class="y-line" v-for="n in 4" :key="n" :style="{ bottom: (n * 25) + '%' }">
                    <span class="y-tick">{{ Math.round(chartData[0]?.maxValue * n / 4) }}</span>
                  </div>
                </div>

              </div>
              <div v-else class="chart-empty">
                <span>📅</span>
                <p>No activity yet</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Bottom Grid: Impact + Badges ── -->
        <div class="bottom-grid">

          <!-- Environment Impact -->
          <div class="panel impact-panel">
            <div class="panel-head">
              <h2>Environment Impact</h2>
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

          <!-- Badges -->
          <div class="panel badges-panel">
            <div class="panel-head">
              <h2>Milestones & Badges</h2>
            </div>
            <div class="badges-content">
              <div v-for="badge in badges" :key="badge.id" class="badge-item" :class="{ achieved: badge.achieved }">
                <div class="badge-icon-wrap" :class="{ locked: !badge.achieved }">
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
  flex-wrap: wrap;
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

.refresh-btn {
  background: #f0f4f0;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.3rem;
  font-weight: bold;
  color: #2da12b;
  transition: background 0.2s;
}

.refresh-btn:hover {
  background: #e0e8e0;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.spinning {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* ── Loading ── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem;
  color: #7a8a7a;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e8ede8;
  border-top-color: #2da12b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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

.panel-badge {
  font-size: 0.72rem;
  font-weight: 700;
  background: #f0f4f0;
  color: #5a6a5a;
  padding: 2px 8px;
  border-radius: 20px;
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
  padding: 0.75rem;
}

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #aaa;
  font-size: 0.85rem;
}

.chart-empty span {
  font-size: 2.5rem;
}

/* ── Donut Chart ── */
.donut-wrap {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
  padding: 0 0.5rem;
}

.donut-container {
  position: relative;
  flex-shrink: 0;
}

.donut-chart {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  transition: background 0.6s ease;
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

.donut-center-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  text-align: center;
  line-height: 1.1;
}

.donut-total {
  display: block;
  font-size: 1.3rem;
  font-weight: 900;
  color: #1a1a1a;
}

.donut-total-lbl {
  display: block;
  font-size: 0.6rem;
  font-weight: 700;
  color: #7a8a7a;
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.leg-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #5a6a5a;
}

.leg-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.leg-pct {
  font-weight: 800;
  color: #2a2a2a;
}

.leg-count {
  color: #aaa;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

/* ── Bar Chart ── */
.bar-chart-wrap {
  width: 100%;
  position: relative;
}

.bar-chart {
  width: 100%;
  height: 170px;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: 0 2rem 0 2.5rem;
  position: relative;
  gap: 4px;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  height: 100%;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.bar-group:hover .bar-fill {
  filter: brightness(1.1);
}

.bars-stack {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 100%;
  flex: 1;
}

.bar-track {
  width: 14px;
  height: 100%;
  background: #f0f4f0;
  border-radius: 6px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  position: relative;
}

.bar-fill {
  width: 100%;
  border-radius: 6px;
  transition: height 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  min-height: 0;
}

.bar-fill.green {
  background: linear-gradient(180deg, #4ade80 0%, #2da12b 100%);
  box-shadow: 0 3px 8px rgba(45, 161, 43, 0.3);
}

.bar-fill.blue {
  background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
  box-shadow: 0 3px 8px rgba(59, 130, 246, 0.3);
}

.bar-val {
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.55rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
}

.bar-label {
  font-size: 0.62rem;
  font-weight: 700;
  color: #7a8a7a;
  white-space: nowrap;
}

/* Y-axis gridlines */
.y-gridlines {
  position: absolute;
  top: 0;
  left: 2.5rem;
  right: 0;
  height: 170px;
  pointer-events: none;
}

.y-line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px dashed #eee;
  display: flex;
  align-items: flex-end;
}

.y-tick {
  position: absolute;
  left: -2rem;
  font-size: 0.6rem;
  font-weight: 600;
  color: #c0c0c0;
  transform: translateY(50%);
}

/* Bar legend */
.bar-legend-inline {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #5a6a5a;
}

.bl-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  display: inline-block;
}

/* Tooltip */
.bar-tooltip {
  position: absolute;
  background: rgba(20, 20, 20, 0.88);
  color: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  pointer-events: none;
  transform: translate(-50%, -100%);
  white-space: nowrap;
  z-index: 10;
  line-height: 1.6;
  backdrop-filter: blur(4px);
}

.bar-tooltip strong {
  display: block;
  margin-bottom: 2px;
}

/* ── Bottom Grid ── */
.bottom-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

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

/* Badges */
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
  transition: width 0.6s ease;
}

.badge-progress-text {
  font-size: 0.7rem;
  font-weight: 600;
  color: #7a8a7a;
}

/* ── Responsive ── */
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
