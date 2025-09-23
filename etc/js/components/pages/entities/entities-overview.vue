<template>
  <div class="entities-overview">
    <template v-if="isLoading">
      <div class="entities-overview-placeholder">
        <template v-if="isConnected">
          <p>Connection established!</p>
          <p>Follow these steps to enable overview statistics:</p>
          <p>1. Make sure you're on the latest version of Flecs</p>
          <p>2. Make sure the stats plugin is imported:

          <pre>// C
ECS_IMPORT(world, FlecsStats);

// C with app addon
ecs_app_run(world, &(ecs_app_desc_t) {
    .enable_stats = true,
    .enable_rest = true,
});

// C++
world.import&lt;flecs::stats&gt;();

// C++ with app addon
world.app()
  .enable_stats()
  .enable_rest()
  .run();</pre></p>
        </template>
        <template v-else>
          <p>
            Connecting
            <icon
              src="loading"
              :opacity="0.5"
              :rotating="true">
            </icon>
          </p>
        </template>
      </div>
    </template>
    <div :class="css">
      <div class="entities-overview-header">
        <div class="entities-overview-header-left">
          <icon src="globe" :opacity="0.5"></icon>
          <span>Uptime: {{ uptime }}</span>
        </div>
        <div class="entities-overview-header-center">
          <span><dropdown label="Target FPS" postfix="Hz" :items="targetFpsOptions" v-model:active_item="targetFps" :transparent="true"></dropdown></span>
        </div>
        <div class="entities-overview-header-right">
          <button @click="shrinkMemory">Shrink Memory</button>
          <button @click="refreshStatistics"><icon src="refresh"></icon></button>
        </div>
      </div>

      <!-- Statistics Row -->
      <div class="stats-row">
        <div class="stat-box">
          <div class="stat-title">FPS</div>
          <div class="stat-number">{{ fps }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-title">Load</div>
          <div class="stat-number">{{ load}}</div>
        </div>
        <div class="stat-box">
          <div class="stat-title">Entities</div>
          <div class="stat-number">{{ entities }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-title">Tables</div>
          <div class="stat-number">{{ tables }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-title">Systems</div>
          <div class="stat-number">{{ systems }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-title">Observers</div>
          <div class="stat-number">{{ observers }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-title">Queries</div>
          <div class="stat-number">{{ queries }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-title">Commands</div>
          <div class="stat-number">{{ commands }}</div>
        </div>
      </div>

      <!-- Ring Chart Section -->
      <div class="chart-section">
        <div class="chart-wrapper">
          <div class="chart-container">
            <canvas ref="chartCanvas" width="200" height="200"></canvas>
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
  </div>
</template>

<script>
export default { name: "entities-overview" };
</script>

<script setup>
import { defineProps, defineEmits, ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';

// Shared color constants
const CategoryColors = {
  EntityIndex: '#5BE595',
  Component: '#46D9E6',
  ComponentIndex: '#4596E5', 
  Table: '#2D5BE6',
  Query: '#6146E6',
  Commands: '#9546E5',
  Allocators: '#E550E6'
};

const props = defineProps({
  conn: { type: Object, required: true },
  app_state: { type: Object, required: true },
});

const emit = defineEmits(['entity-selected', 'entity-updated']);

const isLoading = ref(true);
const worldMemoryQuery = ref();
const worldMemoryData = ref({});
const chartCanvas = ref(null);
const targetFps = ref(60);
let chart;

const targetFpsOptions = computed(() => {
  return [0, 1, 10, 20, 30, 40, 60, 70, 90, 120, 240, 480];
});

const isConnected = computed(() => {
  return props.app_state.status == flecs.ConnectionStatus.Connected;
});

const css = computed(() => {
  let result = ['overview-content'];
  if (isLoading.value) {
    result.push('overview-content-loading');
  }
  return result;
});

const worldSummary = computed(() => {
  if (!props.app_state.heartbeat) return {};
  return props.app_state.heartbeat.components['flecs.stats.WorldSummary'];
});

const fps = computed(() => {
  if (worldSummary.value.fps === undefined) return "n/a";
  return worldSummary.value.fps.toFixed(0) + "Hz";
});

const load = computed(() => {
  const fps = worldSummary.value.fps;
  const targetFps = worldSummary.value.target_fps;
  const frameTime = worldSummary.value.frame_time_frame;
  
  if (fps === undefined) return "n/a";
  if (frameTime === undefined) return "n/a";
  if (targetFps === undefined) return "n/a";

  let targetTime = 1.0 / targetFps;
  const result = frameTime / targetTime;

  return (result * 100).toFixed(0) + "%";
});

const uptime = computed(() => {
  if (worldSummary.value.uptime === undefined) return "n/a";
  return explorer.fmtDuration(worldSummary.value.uptime);
});

const entities = computed(() => {
  if (worldSummary.value.entity_count === undefined) return "n/a";
  return worldSummary.value.entity_count;
});

const tables = computed(() => {
  if (worldSummary.value.table_count === undefined) return "n/a";
  return worldSummary.value.table_count;
});

const systems = computed(() => {
  if (worldSummary.value.systems_ran_frame === undefined) return "n/a";
  return worldSummary.value.systems_ran_frame;
});

const observers = computed(() => {
  if (worldSummary.value.observers_ran_frame === undefined) return "n/a";
  return worldSummary.value.observers_ran_frame;
});

const queries = computed(() => {
  if (worldSummary.value.queries_ran_frame === undefined) return "n/a";
  return worldSummary.value.queries_ran_frame;
});

const commands = computed(() => {
  if (worldSummary.value.command_count_frame === undefined) return "n/a";
  return worldSummary.value.command_count_frame;
});

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
    },
    {
      label: 'Allocators',
      value: calculateAllocatorTotal(stats.allocators),
      color: CategoryColors.Allocators
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
    'commands': CategoryColors.Commands,
    'allocators': CategoryColors.Allocators
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
    },
    {
      name: 'allocators',
      title: 'Allocators',
      total: calculateAllocatorTotal(stats.allocators),
      data: stats.allocators,
      color: colorMap.allocators
    }
  ];
});

const totalMemoryUsage = computed(() => {
  return chartData.value.reduce((sum, item) => sum + item.value, 0);
});

// Helper functions
function calculateEntitiesTotal(data) {
  return data.bytes_alive + data.bytes_not_alive + data.bytes_unused + 
    data.bytes_names + data.bytes_doc_names;
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

function calculateAllocatorTotal(data) {
  return data.bytes_graph_edge + data.bytes_component_record + data.bytes_pair_record + 
         data.bytes_table_diff + data.bytes_sparse_chunk + data.bytes_hashmap + 
         data.bytes_allocator + data.bytes_cmd_entry_chunk + data.bytes_query_impl + data.bytes_query_cache;
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
  
  if (chart) {
    chart.destroy();
  }
  
  chart = new Chart(ctx, {
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
      responsive: false,
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

function updateChart() {
  if (!chartCanvas.value || chartData.value.length === 0) {
    console.log('Chart creation skipped: canvas or data not available');
    return;
  }

  chart.data.datasets[0].data = chartData.value.map(item => item.value);

  chart.update();
}

function shrinkMemory() {
  props.conn.action("shrink_memory", () => {
    refreshStatistics();
  });
}

function refreshStatistics() {
  let first = true;

  worldMemoryQuery.value = props.conn.entity("flecs.stats.WorldMemory", {
    try: true,
    values: true
  }, (reply) => {
    worldMemoryData.value = reply;
    isLoading.value = false;
    if (first) {
      nextTick(() => {
        createChart();
      });
      first = false;
    } else {
      nextTick(() => {
        updateChart();
      });
    }
  }, (error) => {
    console.warn("Failed to fetch world memory data:", error);
    worldMemoryData.value = {};
    isLoading.value = true;
  });
}

watch(() => props.app_state.status, () => {
  if (props.app_state.status == flecs.ConnectionStatus.Connected) {
    refreshStatistics();
    if (props.app_state.heartbeat) {
      const summary = props.app_state.heartbeat.components['flecs.stats.WorldSummary'];
      if (summary) {
        targetFps.value = summary.target_fps;
      }
    }

  } else {
    isLoading.value = true;
  }
});

watch(() => targetFps.value, () => {
  props.conn.set("flecs.core.World", "flecs.stats.WorldSummary", { 
    target_fps: targetFps.value 
  });
});

onMounted(() => {
  refreshStatistics();
});

onUnmounted(() => {
  if (worldMemoryQuery.value) {
    worldMemoryQuery.value.abort();
  }
  if (chart) {
    chart.destroy();
  }
});

</script>

<style scoped>

div.entities-overview {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

div.overview-content {
  flex: 1;
  padding: var(--gap);
  overflow-y: auto;
  min-height: 0;
}

div.overview-content-loading {
  display: none;
}

div.chart-section {
  display: grid;
  grid-template-columns: 232px 1fr;
  gap: calc(var(--gap) * 2);
  align-items: start;
  padding-top: 24px;
  padding-bottom: 0px;
  padding-left: 16px;
  padding-right: 16px;
  margin-top: 8px;
  margin-bottom: 8px;
  background-color: var(--bg-content);
  border-radius: var(--border-radius-medium);
}

div.chart-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

div.chart-container {
  position: relative;
  width: 200px;
  height: 200px;
}

div.total-memory {
  text-align: center;
  padding: 8px;
  min-width: 200px;
}

div.total-label {
  font-size: 0.9em;
  color: var(--secondary-text);
  margin-bottom: 4px;
  font-weight: 500;
}

div.total-value {
  font-size: 1.5em;
  font-weight: 700;
}

table.legend-table {
  width: 100%;
  border-collapse: collapse;
}

tr.legend-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

tr.legend-row:last-child {
  border-bottom: none;
}

td.legend-color-cell {
  width: 40px;
  padding: 8px;
  text-align: center;
}

span.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-block;
}

td.legend-label {
  color: var(--primary-text);
  font-size: 1em;
  padding: 8px;
  text-align: left;
}

td.legend-value {
  color: var(--secondary-text);
  font-size: 1em;
  padding: 8px;
  text-align: right;
}

div.details-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: calc(var(--gap) * 2);
  align-items: stretch;
}

div.detail-panel {
  background-color: var(--background-secondary);
  border: 1px solid var(--bg-color);
  border-radius: var(--border-radius-medium);
  overflow: hidden;
  background-color: var(--bg-content);
  padding: 16px;
}

div.panel-header {
  display: flex;
  align-items: center;
  padding-top: 4px;
  padding-bottom: 12px;
  color: var(--primary-text);
  gap: 12px;
}

div.panel-header-line {
  width: 4px;
  height: 24px;
  border-radius: 2px;
  flex-shrink: 0;
}

div.panel-header h4 {
  flex: 1;
  margin: 0;
  font-size: 1.1em;
  font-weight: 600;
  color: var(--primary-text);
}

div.panel-total {
  font-size: 1.1em;
  font-weight: 600;
  color: var(--primary-text);
}

div.panel-content {
  padding: 0;
  background-color: var(--background-primary);
}

table.stats-table {
  width: 100%;
  border-collapse: collapse;
}

tr.stat-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

tr.stat-row:last-child {
  border-bottom: none;
}

td.stat-label {
  color: var(--secondary-text);
  font-size: 0.9em;
  text-align: left;
  padding-top: 8px;
  padding-bottom: 8px;
}

td.stat-value {
  font-size: 0.9em;
  color: var(--secondary-text);
  font-weight: 600;
  text-align: right;
  padding-top: 8px;
  padding-bottom: 8px;
}

div.entities-overview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 16px;
  color: var(--secondary-text);
}

div.entities-overview-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 4px;
  padding-left: 8px;
  background-color: var(--bg-content);
  border-radius: var(--border-radius-medium);
  color: var(--secondary-text);
  font-size: 0.9em;
  font-weight: 500;
}

div.entities-overview-header-left {
  display: flex;
  flex: 1;
}

div.entities-overview-header-right {
  display: flex;
  flex: 1;
  justify-content: right;
}

div.entities-overview-header-left * {
  margin-right: 4px;
}

div.entities-overview-header-right * {
  margin-left: 4px;
}

/* Statistics Row Styles */
div.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin: 8px 0;
}

div.stat-box {
  background: var(--bg-content);
  border-radius: var(--border-radius-medium);
  padding: 8px 8px;
  text-align: center;
  min-height: 70px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

div.stat-title {
  font-size: 0.75em;
  color: var(--secondary-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  font-weight: 500;
}

div.stat-number {
  font-size: 1.8em;
  font-weight: 700;
  color: var(--primary-text);
  line-height: 1;
}

@media (max-width: 1024px) {
  div.details-section {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
  
  div.stats-row {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 10px;
  }
}

@media (max-width: 768px) {
  div.chart-section {
    grid-template-columns: 1fr;
    justify-items: center;
  }
  
  div.chart-container {
    width: 250px;
    height: 250px;
  }

  div.total-memory {
    min-width: 180px;
  }

  div.total-value {
    font-size: 1.3em;
  }

  div.details-section {
    grid-template-columns: 1fr;
  }
  
  div.detail-panel {
    transform: none !important;
  }
  
  div.detail-panel:hover {
    transform: none !important;
  }
  
  div.stats-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  div.stat-number {
    font-size: 1.5em;
  }
}

@media (max-width: 480px) {
  div.chart-container {
    width: 200px;
    height: 200px;
  }
  
  div.stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    margin: 12px 0;
  }
  
  div.stat-title {
    font-size: 0.7em;
    margin-bottom: 4px;
  }
  
  div.stat-number {
    font-size: 1.3em;
  }
}
</style>
