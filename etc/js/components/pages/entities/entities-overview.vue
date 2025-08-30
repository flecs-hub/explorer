<template>
  <div class="entities-overview">
    <div class="overview-content">
      <div v-if="hasMemoryData" class="memory-visualization">
        <!-- Ring Chart Section -->
        <div class="chart-section">
          <div class="chart-wrapper">
            <div class="chart-container">
              <canvas ref="chartCanvas" width="300" height="300"></canvas>
            </div>
            <div class="total-memory">
              <div class="total-label">Total Memory</div>
              <div class="total-value">{{ formatBytes(totalMemoryUsage) }}</div>
            </div>
          </div>
          <div class="chart-legend">
            <table class="legend-table">
              <tbody>
                <tr v-for="(item, index) in chartData" :key="item.label" class="legend-row">
                  <td class="legend-color-cell">
                    <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
                  </td>
                  <td class="legend-label">{{ item.label }}</td>
                  <td class="legend-value">{{ formatBytes(item.value) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Detailed Panels Section -->
        <div class="details-section">
          <div v-for="category in memoryCategories" :key="category.name" class="detail-panel">
            <div class="panel-header" v-if="!category.hideTitle">
              <div class="panel-header-line" :style="{ backgroundColor: category.color }"></div>
              <h4>{{ category.title }}</h4>
              <span class="panel-total">{{ formatBytes(category.total) }}</span>
            </div>
            <div class="panel-content">
              <table class="stats-table">
                <tbody>
                  <tr v-for="(value, key) in category.data" :key="key" class="stat-row">
                    <template v-if="Array.isArray(value)">
                      <td class="stat-value" colspan="2">
                        <histogram 
                          :buckets="value.slice(1)"
                          :title="category.title">
                        </histogram>
                      </td>
                    </template>
                    <template v-else>
                      <td class="stat-label">{{ formatStatLabel(key) }}</td>
                      <td class="stat-value">
                        {{ formatStatValue(key, value) }}
                      </td>
                    </template>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>Loading world memory data...</p>
      </div>
      <div v-else class="no-data">
        <icon src="alert-circle" class="no-data-icon"></icon>
        <p>No memory data available</p>
      </div>
    </div>
  </div>
</template>

<script>
export default { name: "entities-overview" };
</script>

<script setup>
import { defineProps, defineEmits, ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

// Shared color constants
const CategoryColors = {
  EntityIndex: '#3b82f6',
  Component: '#06b6d4',
  ComponentIndex: '#42b983', 
  Table: '#f59e0b',
  Query: '#ef4444',
  Commands: '#8b5cf6'
};

const props = defineProps({
  conn: { type: Object, required: true },
});

const emit = defineEmits(['entity-selected', 'entity-updated']);

// Reactive data
const loading = ref(true);
const worldMemoryQuery = ref();
const worldMemoryData = ref({});
const chartCanvas = ref();
const chart = ref();

// Computed properties
const hasMemoryData = computed(() => {
  return Object.keys(worldMemoryData.value).length > 0 && worldMemoryData.value.components && worldMemoryData.value.components['flecs.stats.WorldMemory'];
});

const memoryStats = computed(() => {
  if (!hasMemoryData.value) return {};
  return worldMemoryData.value.components['flecs.stats.WorldMemory'];
});

const chartData = computed(() => {
  if (!hasMemoryData.value) return [];
  const stats = memoryStats.value;
  
  return [
    {
      label: 'Entities',
      value: calculateEntitiesTotal(stats.entities),
      color: CategoryColors.EntityIndex
    },
    {
      label: 'Components',
      value: calculateComponentsTotal(stats.components),
      color: CategoryColors.Component
    },
    {
      label: 'Component Index',
      value: calculateComponentIndexTotal(stats.component_index),
      color: CategoryColors.ComponentIndex
    },
    {
      label: 'Tables',
      value: calculateTableTotal(stats.table),
      color: CategoryColors.Table
    },
    {
      label: 'Queries',
      value: calculateQueryTotal(stats.query),
      color: CategoryColors.Query
    },
    {
      label: 'Commands',
      value: calculateCommandTotal(stats.commands),
      color: CategoryColors.Commands
    }
  ].filter(item => item.value > 0);
});

const memoryCategories = computed(() => {
  if (!hasMemoryData.value) return [];
  const stats = memoryStats.value;
  
  // Color mapping to match chart colors
  const colorMap = {
    'entities': CategoryColors.EntityIndex,
    'component_index': CategoryColors.ComponentIndex,
    'component': CategoryColors.Component,
    'table': CategoryColors.Table,
    'query': CategoryColors.Query,
    'commands': CategoryColors.Commands
  };
  
  return [
    {
      name: 'entities',
      title: 'Entities',
      total: calculateEntitiesTotal(stats.entities),
      data: stats.entities,
      color: colorMap.entities
    },
    {
      name: 'component',
      title: 'Components',
      total: calculateComponentsTotal(stats.components),
      data: stats.components,
      color: colorMap.component
    },
    {
      name: 'component_index',
      title: 'Component Index',
      total: calculateComponentIndexTotal(stats.component_index),
      data: stats.component_index,
      color: colorMap.component_index
    },
    {
      name: 'table',
      title: 'Tables',
      total: calculateTableTotal(stats.table),
      data: stats.table,
      color: colorMap.table
    },
    {
      name: 'table_histogram',
      title: 'Tables by entity count',
      total: 0,
      data: stats.table_histogram,
      color: colorMap.table,
      hideTitle: true
    },
    {
      name: 'query',
      title: 'Queries',
      total: calculateQueryTotal(stats.query),
      data: stats.query,
      color: colorMap.query
    },
    {
      name: 'commands',
      title: 'Commands',
      total: calculateCommandTotal(stats.commands),
      data: stats.commands,
      color: colorMap.commands
    }
  ];
});

const totalMemoryUsage = computed(() => {
  return chartData.value.reduce((sum, item) => sum + item.value, 0);
});

// Helper functions
function calculateEntitiesTotal(data) {
  return data.bytes_alive + data.bytes_not_alive + data.bytes_unused;
}

function calculateComponentIndexTotal(data) {
  return data.bytes_component_record + data.bytes_table_cache + data.bytes_name_index + 
         data.bytes_ordered_children + data.bytes_reachable_cache;
}

function calculateComponentsTotal(data) {
  return data.bytes_table_components + data.bytes_table_components_unused + 
         data.bytes_sparse_components + data.bytes_sparse_components_unused + 
         data.bytes_sparse_overhead;
}

function calculateTableTotal(data) {
  return data.bytes_table + data.bytes_type + data.bytes_entities +
         data.bytes_overrides + data.bytes_columns + data.bytes_table_records + 
         data.bytes_column_map + data.bytes_component_map + 
         data.bytes_dirty_state + data.bytes_edges;
}

function calculateQueryTotal(data) {
  return data.bytes_query + data.bytes_cache + data.bytes_group_by + data.bytes_order_by +
         data.bytes_plan + data.bytes_terms + data.bytes_misc;
}

function calculateCommandTotal(data) {
  return data.bytes_queue + data.bytes_entries + data.bytes_stack;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatStatLabel(key) {
  // Remove "bytes_" prefix if it exists
  let label = key.startsWith('bytes_') ? key.substring(6) : key;
  return label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatStatValue(key, value) {
  if (key.includes('bytes') || key.includes('size')) {
    return formatBytes(value);
  }
  return value.toLocaleString();
}

function createChart() {
  if (!chartCanvas.value || chartData.value.length === 0) {
    console.log('Chart creation skipped: canvas or data not available');
    return;
  }
  
  const ctx = chartCanvas.value.getContext('2d');
  if (!ctx) {
    console.error('Failed to get 2D context from canvas');
    return;
  }
  
  if (chart.value) {
    chart.value.destroy();
  }
  
  chart.value = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: chartData.value.map(item => item.label),
      datasets: [{
        data: chartData.value.map(item => item.value),
        backgroundColor: chartData.value.map(item => item.color),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '60%',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = formatBytes(context.raw);
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.raw / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// Lifecycle hooks
onMounted(() => {
  // Make managed request for world memory statistics
  worldMemoryQuery.value = props.conn.entity("flecs.stats.WorldMemory", {
    try: true,
    managed: false,
    persist: false,
    values: true
  }, (reply) => {
    worldMemoryData.value = reply;
    loading.value = false;
    nextTick(() => {
      createChart();
    });
  }, (error) => {
    console.warn("Failed to fetch world memory data:", error);
    worldMemoryData.value = {};
    loading.value = false;
  });
});

onUnmounted(() => {
  // Clean up managed request and chart when component is unmounted
  if (worldMemoryQuery.value) {
    worldMemoryQuery.value.abort();
  }
  if (chart.value) {
    chart.value.destroy();
  }
});

</script>

<style scoped>
.entities-overview {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.overview-header h3 {
  margin: 0;
  font-size: 1.1em;
  font-weight: 600;
  color: var(--primary-text);
}

.overview-content {
  flex: 1;
  padding: var(--gap);
  overflow-y: auto;
  min-height: 0;
}

.memory-visualization {
  display: flex;
  flex-direction: column;
  gap: calc(var(--gap) * 2);
}

.chart-section {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: calc(var(--gap) * 2);
  align-items: start;
  padding-top: 16px;
  padding-bottom: 16px;
  padding-left: 16px;
}

.chart-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.chart-container {
  position: relative;
  width: 240px;
  height: 240px;
}

.total-memory {
  text-align: center;
  padding: 1rem 1.5rem;
  min-width: 200px;
}

.total-label {
  font-size: 0.9em;
  color: var(--secondary-text);
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.total-value {
  font-size: 1.5em;
  font-weight: 700;
}

.chart-legend {
  background-color: var(--bg-cell-alt);
  border-radius: var(--border-radius-medium);
  padding: 16px;
}

.legend-table {
  width: 100%;
  border-collapse: collapse;
}

.legend-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.legend-row:last-child {
  border-bottom: none;
}

.legend-color-cell {
  width: 40px;
  padding: 8px;
  text-align: center;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-block;
}

.legend-label {
  color: var(--primary-text);
  font-weight: 500;
  font-size: 1em;
  padding: 12px;
  text-align: left;
}

.legend-value {
  color: var(--primary-text);
  font-weight: 600;
  font-size: 1em;
  padding: 12px;
  text-align: right;
}

.details-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: calc(var(--gap) * 2);
  align-items: stretch;
}

.detail-panel {
  background-color: var(--background-secondary);
  border: 1px solid var(--border);
  border-radius: var(--border-radius-medium);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  padding: 16px;
}

.panel-header {
  display: flex;
  align-items: center;
  padding-top: 4px;
  padding-bottom: 12px;
  color: var(--primary-text);
  gap: 12px;
}

.panel-header-line {
  width: 4px;
  height: 24px;
  border-radius: 2px;
  flex-shrink: 0;
}

.panel-header h4 {
  flex: 1;
  margin: 0;
  font-size: 1.1em;
  font-weight: 600;
  color: var(--primary-text);
}

.panel-total {
  font-size: 1.1em;
  font-weight: 600;
  color: var(--primary-text);
}

.panel-content {
  padding: 0;
  background-color: var(--background-primary);
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
}

.stat-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  color: var(--secondary-text);
  font-size: 0.9em;
  text-align: left;
  padding-top: 8px;
  padding-bottom: 8px;
}

.stat-value {
  font-size: 0.9em;
  color: var(--secondary-text);
  font-weight: 600;
  text-align: right;
  padding-top: 8px;
  padding-bottom: 8px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(var(--gap) * 4);
  color: var(--secondary-text);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--text-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--gap);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(var(--gap) * 4);
  color: var(--secondary-text);
}

.no-data-icon {
  margin-bottom: var(--gap);
  opacity: 0.5;
}

.no-data p, .loading p {
  margin: 0;
  font-style: italic;
}

@media (max-width: 1024px) {
  .details-section {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .chart-section {
    grid-template-columns: 1fr;
    justify-items: center;
  }
  
  .chart-container {
    width: 250px;
    height: 250px;
  }

  .total-memory {
    min-width: 180px;
  }

  .total-value {
    font-size: 1.3em;
  }

  .details-section {
    grid-template-columns: 1fr;
  }
  
  .detail-panel {
    transform: none !important;
  }
  
  .detail-panel:hover {
    transform: none !important;
  }
}

@media (max-width: 480px) {
  .memory-visualization {
    gap: var(--gap);
  }
  
  .chart-container {
    width: 200px;
    height: 200px;
  }
}
</style>
