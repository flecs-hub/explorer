<template>
  <div class="system">
    <div class="system-impact" :style="systemImpactStyle()"></div>
    <div class="name" v-if="system.name">
      <div><entity-parent :path="system.name"></entity-parent></div>
      <div><entity-name :path="system.name"></entity-name></div>
    </div>
    <div class="sync-icon" v-if="!system.name">
      <icon src="merge" 
        :size="50" 
        :rotate="180"
        :opacity="0.5">
      </icon>
    </div>
    <div class="chart-time-spent">
      <stat-chart 
        :zoom="1" 
        :width="280"
        :values="system.time_spent"
        :isTime="true">
      </stat-chart>
      <div class="chart-label">Time spent ({{ avgTime }})</div>
    </div>
    <div class="chart-entities" v-if="system.commands_enqueued">
      <stat-chart 
        :zoom="1" 
        :width="280"
        :values="system.commands_enqueued">
      </stat-chart>
      <div class="chart-label">Commands enqueued</div>
    </div>
    <div class="chart-entities" v-if="system.matched_entity_count">
      <stat-chart 
        :zoom="1" 
        :width="280"
        :values="system.matched_entity_count">
      </stat-chart>
      <div class="chart-label">Entities matched</div>
    </div>
    <div class="chart-tables" v-if="system.matched_table_count">
      <stat-chart 
        :zoom="1" 
        :width="280"
        :values="system.matched_table_count">
      </stat-chart>
      <div class="chart-label">Tables matched</div>
    </div>
  </div>
</template>

<script>
export default { name: "pipeline-system" };
</script>

<script setup>
import { ref, defineProps, computed } from 'vue';

const props = defineProps({
  system: {type: Object, required: true}
});

const avgTime = computed(() => {
  let t = props.system.time_spent_avg;
  let count = 0;
  if (t) {
    while (t < 1) {
      t *= 1000;
      count ++;
    }
  }

  const units = ['s', 'ms', 'us', 'ns'];
  return t.toFixed(0) + units[count];
});

function percentageToRGBA(percentage) {
  const red = 200 * percentage;
  const green = 100 - 100 * (percentage);
  const blue = 150 - 50 * (percentage);
  const alpha = 0.5 * percentage + 0.2;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function systemImpactStyle() {
  let pct = props.system.time_spent_pct;
  return `background-color: ${percentageToRGBA(pct * 3)}`;
}

</script>

<style scoped>

div.system {
  display: grid;
  grid-template-columns: 18px 300px 300px 300px;
  grid-template-rows: auto auto;
  padding: 8px;
  padding-top: 4px;
  padding-bottom: 4px;
  color: var(--primary-text);
}

div.system-impact {
  grid-column: 1;
  grid-row: 1 / 3;
  border-radius: var(--border-radius-medium);
  width: 8px;
  height: 100%;
}

div.name {
  grid-column: 2 / 4;
  grid-row: 1;
}

div.chart-time-spent {
  grid-column: 2;
  grid-row: 2;
}

div.chart-entities {
  grid-column: 3;
  grid-row: 2;
}

div.chart-tables {
  grid-column: 4;
  grid-row: 2;
}

div.sync-icon {
  grid-column: 4;
  grid-row: 2;
  text-align: center;
  padding-top: 16px;
}

div.chart-label {
  font-size: 0.8rem;
  color: var(--secondary-text);
  text-align: center;
}

</style>
