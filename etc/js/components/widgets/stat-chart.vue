<template>
  <div :class="css">
    <svg 
      class="noselect clickable stat-chart" 
      :width="chartWidth" 
      :height="chartHeight" 
      @click="toggleZoomIn"
      @click.right="toggleZoomOut"
      @contextmenu.prevent>

      <template v-if="zoomValue >= 2">
        <line :x1="toX(0)" :y1="chartHeight - 16" :x2="toX(59)" :y2="chartHeight - 16" :stroke="strokeColorRuler"/>
        <line :x1="toX(0)" :y1="16" :x2="toX(59)" :y2="16" :stroke="strokeColorRuler"/>
      </template>
      <line :x1="toX(0)" :y1="chartHeight / 2" :x2="toX(59)" :y2="chartHeight / 2" :stroke="strokeColorRuler"/>

      <text :font-size="textSize" :x="5" :y="chartHeight - 10" :fill="textColor">{{ fmtFloat(minMax.min) }}</text>
      <text :font-size="textSize" :x="5" :y="19" :fill="textColor">{{ fmtFloat(minMax.max) }}</text>
      <template v-if="zoomValue >= 2">
        <text :font-size="textSize" :x="5" :y="chartHeight / 2 + 5" :fill="textColor">{{ fmtFloat(minMax.avg) }}</text>
      </template>

      <template v-if="zoomValue >= 3">
        <line :x1="toX(0)" :y1="chartHeight * 0.75 - 8" :x2="toX(59)" :y2="chartHeight * 0.75 - 8" :stroke="strokeColorRuler"/>
        <line :x1="toX(0)" :y1="chartHeight * 0.25 + 8" :x2="toX(59)" :y2="chartHeight * 0.25 + 8" :stroke="strokeColorRuler"/>

        <text :font-size="textSize" :x="5" :y="chartHeight * 0.75 - 3" :fill="textColor">{{ fmtFloat(minAvg) }}</text>
        <text :font-size="textSize" :x="5" :y="chartHeight * 0.25 + 12" :fill="textColor">{{ fmtFloat(avgMax) }}</text>
      </template>

      <template v-for="i in 59" :key="'min-' + i">
        <line :x1="toX(i - 1)" :y1="toYMin(i - 1)" :x2="toX(i)" :y2="toYMin(i)" :stroke="strokeColorMin"/>
      </template>

      <template v-for="i in 59" :key="'max-' + i">
        <line :x1="toX(i - 1)" :y1="toYMax(i - 1)" :x2="toX(i)" :y2="toYMax(i)" :stroke="strokeColorMax"/>
      </template>

      <template v-for="i in 59" :key="'avg-' + i">
        <line :x1="toX(i - 1)" :y1="toY(i - 1)" :x2="toX(i)" :y2="toY(i)" :stroke="strokeColor" stroke-width="1.5"/>
      </template>
    </svg>
  </div>
</template>

<script>
export default { name: "stat-chart" };
</script>

<script setup>
import { computed, onMounted, ref } from 'vue';

const props = defineProps({
  values: { type: Object, required: true },
  zoom: { type: Number, required: false, default: 2 },
  width: { type: Number, required: false, default: 500 },
  widthScale: { type: Boolean, required: false, default: false },
  widthMargin: { type: Number, required: false, default: 0 },
  backgroundFill: { type: Boolean, required: false, default: false },
  isTime: { type: Boolean, required: false, default: false }
});

const zoomValue = ref(2);

onMounted(() => {
  if (props.zoom) {
    zoomValue.value = props.zoom;
  }
});

const min = computed(() => {
  if (!props.values) return 0;
  return Math.min(...props.values.min);
});

const max = computed(() => {
  if (!props.values) return 1;
  return Math.max(...props.values.max);
});

const minMax = computed(() => {
  const units = ['s', 'ms', 'us', 'ns'];
  let minVal = min.value;
  let maxVal = max.value;

  let exp = 0;
  if (maxVal) {
    while (maxVal < 1 || exp == 3) {
      maxVal *= 1000;
      exp ++;
    }
  }

  let mul = Math.pow(1000, exp);
  minVal = minVal * mul
  if (minVal == maxVal) {
    minVal --;
    maxVal ++;
  }

  let avg = (minVal + maxVal) / 2;
  let unit = undefined;
  if (props.isTime) {
    unit = units[exp];
  }
  return { min: minVal, max: maxVal, avg: avg, unit: unit, mul: mul };
});

const minAvg = computed(() => (minMax.value.min + minMax.value.avg) / 2);
const avgMax = computed(() => (minMax.value.avg + minMax.value.max) / 2);

const chartHeight = computed(() => {
  if (zoomValue.value >= 3) return 200;
  if (zoomValue.value >= 2) return 100;
  return 50;
});

const chartWidth = computed(() => {
  if (zoomValue.value >= 4) return (props.width + props.widthMargin) * 2;
  return props.width;
});

const chartPadding = computed(() => 15);
const chartYRulerWidth = computed(() => 44);

const strokeColor = computed(() => 'var(--chart-primary)');
const strokeColorMin = computed(() => 'var(--chart-secondary)');
const strokeColorMax = computed(() => 'var(--chart-secondary)');
const strokeColorRuler = computed(() => '#2e323c');
const textColor = computed(() => 'var(--secondary-text)');
const textSize = computed(() => 12);
const maxZoom = computed(() => (props.widthScale ? 5 : 4));

const css = computed(() => {
  let result = 'stat-chart';
  if (props.backgroundFill) {
    result += ' stat-chart-bg-fill';
  }
  return result;
});

const toX = (index) => {
  const offset = chartYRulerWidth.value;
  const width = chartWidth.value - offset;
  return index * (width / 60) + offset;
};

const scaleY = (value) => {
  const min = minMax.value.min;
  const max = minMax.value.max;
  value *= minMax.value.mul;
  const height = chartHeight.value - chartPadding.value * 2;
  let scaled = height * ((value - min) / (max - min));
  scaled = chartHeight.value - scaled - chartPadding.value;
  return scaled;
};

const toY = (index) => props.values ? scaleY(props.values.avg[index]) : 0;
const toYMin = (index) => props.values ? scaleY(props.values.min[index]) : 0;
const toYMax = (index) => props.values ? scaleY(props.values.max[index]) : 0;

const toggleZoomIn = () => {
  zoomValue.value = (zoomValue.value + 1) % maxZoom.value || 1;
};

const toggleZoomOut = () => {
  zoomValue.value = (zoomValue.value - 1) || 1;
};

const fmtFloat = (v) => {
  if (minMax.value.unit) {
    return v.toFixed(0) + minMax.value.unit;
  } else {
    return v.toFixed(0);
  }
}

</script>

<style>
div.stat-chart {
  cursor: pointer;
  border-radius: var(--border-radius-medium);
  background-color: rgba(255, 255, 255, 0);
  transition: background-color 0.1s ease-in;
}

div.stat-chart:hover {
  cursor: pointer;
  background-color: var(--bg-cell-hover);
}

div.stat-chart svg {
  border-width: 1px;
  border-color: var(--steel-700);
  border-radius: 2px;
}

div.stat-chart-bg-fill svg {
  background-color: #101115;
  border-style: solid;
}
</style>
