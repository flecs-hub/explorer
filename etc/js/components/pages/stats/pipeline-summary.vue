<template>
  <div class="summary">
    <div class="summary-impact" :style="impactStyle"></div>
    <div class="summary-name">
      <div class="noselect summary-count">{{ systemCount }} {{ systemCount == 1 ? "system" : "systems" }}</div>
    </div>
    <div class="chart-time-spent" v-if="timeSpent">
      <stat-chart
        :zoom="1"
        :width="280"
        :values="timeSpent"
        :isTime="true">
      </stat-chart>
      <div class="chart-label">Time spent ({{ avgTime }}, {{ pctLabel }})</div>
    </div>
  </div>
</template>

<script>
export default { name: "pipeline-summary" };
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  systems: {type: Array, required: true}
});

const systemCount = computed(() => {
  return props.systems.length;
});

const timeSpent = computed(() => {
  let result;

  for (const system of props.systems) {
    const stat = system.time_spent;
    if (!stat) {
      continue;
    }

    if (!result) {
      result = {avg: [], min: [], max: []};
    }

    for (const series of ["avg", "min", "max"]) {
      const values = stat[series];
      if (!values) {
        continue;
      }
      for (let i = 0; i < values.length; i ++) {
        result[series][i] = (result[series][i] || 0) + values[i];
      }
    }
  }

  return result;
});

const timeSpentAvg = computed(() => {
  let result = 0;
  for (const system of props.systems) {
    if (system.time_spent_avg) {
      result += system.time_spent_avg;
    }
  }
  return result;
});

const timeSpentPct = computed(() => {
  let result = 0;
  for (const system of props.systems) {
    if (system.time_spent_pct) {
      result += system.time_spent_pct;
    }
  }
  return result;
});

const avgTime = computed(() => {
  const units = ['s', 'ms', 'us', 'ns'];
  let t = timeSpentAvg.value;
  let count = 0;

  if (t) {
    while (t < 1 && count < units.length - 1) {
      t *= 1000;
      count ++;
    }
  }

  return t.toFixed(0) + units[count];
});

const pctLabel = computed(() => {
  return (timeSpentPct.value * 100).toFixed(1) + "% of total";
});

const impactStyle = computed(() => {
  const pct = Math.min(Math.max(timeSpentPct.value * 3, 0), 1);
  const red = 200 * pct;
  const green = 100 - 100 * pct;
  const blue = 150 - 50 * pct;
  const alpha = 0.5 * pct + 0.2;
  return `background-color: rgba(${red}, ${green}, ${blue}, ${alpha})`;
});

</script>

<style scoped>

div.summary {
  display: grid;
  grid-template-columns: 18px 284px 284px 284px;
  grid-template-rows: auto auto;
  padding: 4px;
  color: var(--primary-text);
}

div.summary-impact {
  grid-column: 1;
  grid-row: 1 / 3;
  border-radius: var(--border-radius-medium);
  width: 8px;
  height: 100%;
}

div.summary-name {
  grid-column: 2 / 4;
  grid-row: 1;
}

div.summary-count {
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--secondary-text);
}

div.chart-time-spent {
  grid-column: 2;
  grid-row: 2;
}

div.chart-label {
  font-size: 0.8rem;
  color: var(--secondary-text);
  text-align: center;
}

</style>
