<template>
  <div class="histogram-container">
    <div class="histogram-title" v-if="title">
      {{ title }}
    </div>
    <div class="histogram-chart">
      <div class="histogram-y-axis">
        <div 
          class="histogram-y-label"
          v-for="(bucket, index) in normalizedBuckets"
          :key="index">
          {{ getBucketLabel(index) }}
        </div>
      </div>
      <div class="histogram-bars">
        <div 
          class="histogram-bar-container"
          v-for="(bucket, index) in normalizedBuckets"
          :key="index">
          <div 
            class="histogram-bar"
            :style="{ 
              width: (bucket.normalizedValue * 100) + '%',
              backgroundColor: getBarColor(bucket.value, index)
            }"
            :title="`Bucket ${getBucketLabel(index)}: ${bucket.value} items`"
            @mouseenter="hoveredBar = index"
            @mouseleave="hoveredBar = null">
          </div>
        </div>
      </div>
      <div class="histogram-x-axis">
        <div 
          class="histogram-x-label"
          v-for="(label, index) in xAxisLabels"
          :key="index"
          :style="{ left: (label.position * 100) + '%' }">
          {{ label.value }}
        </div>
      </div>
    </div>
    <div class="histogram-tooltip" v-if="hoveredBar !== null && showTooltips">
      <div class="histogram-tooltip-content">
        Count: {{ buckets[hoveredBar] }}<br>
        Range: {{ getPowerOfTwoRange(hoveredBar) }}
      </div>
    </div>
  </div>
</template>

<script>
export default { name: "histogram" }
</script>

<script setup>
import { defineProps, computed, ref } from 'vue';

const props = defineProps({
  buckets: {
    type: Array,
    required: true,
    validator: (buckets) => Array.isArray(buckets) && buckets.every(val => typeof val === 'number' && val >= 0)
  },
  title: {
    type: String,
    default: 'Histogram'
  },
  showTooltips: {
    type: Boolean,
    default: true
  },
  colorMode: {
    type: String,
    default: 'gradient', // 'gradient', 'uniform', 'value-based'
    validator: (value) => ['gradient', 'uniform', 'value-based'].includes(value)
  },
  maxYAxisLabels: {
    type: Number,
    default: 5
  },
  useOverflowBucket: {
    type: Boolean,
    default: true
  }
});

const hoveredBar = ref(null);

// Compute normalized bucket values for bar heights
const normalizedBuckets = computed(() => {
  const maxValue = Math.max(...props.buckets);
  if (maxValue === 0) {
    return props.buckets.map(value => ({ value, normalizedValue: 0 }));
  }
  
  return props.buckets.map(value => ({
    value,
    normalizedValue: (value / maxValue) * 0.95
  }));
});

// Generate X-axis labels (for horizontal bars)
const xAxisLabels = computed(() => {
  const maxValue = Math.max(...props.buckets);
  if (maxValue === 0) {
    return [{ value: 0, position: 0 }];
  }

  const labels = [];
  const step = Math.ceil(maxValue / (props.maxYAxisLabels - 1));
  
  for (let i = 0; i < props.maxYAxisLabels; i++) {
    const value = i * step;
    if (value <= maxValue) {
      labels.push({
        value: value,
        position: (value / maxValue) * 0.95
      });
    }
  }
  
  // Always include the max value if it's not already included
  if (labels[labels.length - 1].value < maxValue) {
    labels.push({
      value: maxValue,
      position: 0.95
    });
  }
  
  return labels;
});

// Get bucket label (power of 2, with overflow bucket)
function getBucketLabel(index) {
  const isOverflowBucket = props.useOverflowBucket && index === props.buckets.length - 1 && props.buckets.length > 1;
  const power = Math.pow(2, index);
  
  if (isOverflowBucket) {
    if (power >= 1024) {
      return `≥${power / 1024}K`;
    } else {
      return `≥${power}`;
    }
  } else {
    if (power >= 1024) {
      return `${power / 1024}K`;
    } else {
      return power.toString();
    }
  }
}

// Get power of 2 range description
function getPowerOfTwoRange(index) {
  const isOverflowBucket = props.useOverflowBucket && index === props.buckets.length - 1 && props.buckets.length > 1;
  const current = Math.pow(2, index);
  const next = Math.pow(2, index + 1);
  
  if (index === 0) {
    return `1`;
  } else if (isOverflowBucket) {
    return `≥ ${current}`;
  } else {
    return `${current} - ${next - 1}`;
  }
}

// Get bar color based on mode
function getBarColor(value, index) {
  const isOverflowBucket = props.useOverflowBucket && index === props.buckets.length - 1 && props.buckets.length > 1;
  
  // Special styling for overflow bucket
  if (isOverflowBucket) {
    return 'var(--orange)'; // Use orange to distinguish overflow bucket
  }
  
  switch (props.colorMode) {
    case 'uniform':
      return 'var(--chart-primary)';
    
    case 'value-based':
      const maxValue = Math.max(...props.buckets);
      if (maxValue === 0) return 'var(--chart-secondary)';
      const intensity = value / maxValue;
      return `hsl(153, 47%, ${20 + intensity * 40}%)`;
    
    case 'gradient':
    default:
      const totalBuckets = props.buckets.length;
      const hue = 153 - (index / Math.max(totalBuckets - 1, 1)) * 50; // Green to blue-green
      return `hsl(${hue}, 47%, 50%)`;
  }
}

</script>

<style scoped>
.histogram-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 200px;
  background-color: var(--bg-content);
  border-radius: var(--border-radius-medium);
  padding: 16px;
  position: relative;
}

.histogram-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-text);
  margin-bottom: 12px;
  text-align: center;
}

.histogram-chart {
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
  min-height: 150px;
}

.histogram-y-axis {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 20px;
  width: 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding-right: 8px;
}

.histogram-y-label {
  font-size: 11px;
  color: var(--secondary-text);
  text-align: right;
  white-space: nowrap;
  line-height: 1;
}

.histogram-bars {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-left: 48px;
  margin-bottom: 20px;
  gap: 4px;
  justify-content: space-around;
  position: relative;
}

.histogram-bar-container {
  display: flex;
  align-items: center;
  height: auto;
  min-height: 24px;
  position: relative;
}

.histogram-bar {
  height: 20px;
  min-width: 2px;
  border-radius: 0 2px 2px 0;
  transition: all var(--animation-duration) ease-in-out;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
}

.histogram-bar:hover {
  opacity: 0.8;
  transform: scaleY(1.1);
}

.histogram-x-axis {
  position: relative;
  height: 20px;
  margin-left: 68px;
  margin-top: -20px;
}

.histogram-x-label {
  position: absolute;
  bottom: 0;
  font-size: 10px;
  color: var(--secondary-text);
  transform: translateX(-50%);
  white-space: nowrap;
}

.histogram-tooltip {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}

.histogram-tooltip-content {
  background-color: var(--bg-pane);
  border: 1px solid var(--border);
  border-radius: var(--border-radius-small);
  padding: 8px 12px;
  font-size: 12px;
  color: var(--primary-text);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

/* Empty state */
.histogram-bars:empty::after {
  content: "No data available";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--tertiary-text);
  font-size: 14px;
}

/* Responsive design */
@media (max-width: 600px) {
  .histogram-container {
    padding: 12px;
  }
  
  .histogram-y-axis {
    width: 30px;
  }
  
  .histogram-bars {
    margin-left: 38px;
  }
  
  .histogram-x-axis {
    margin-left: 38px;
  }
  
  .histogram-x-label {
    font-size: 9px;
  }
  
  .histogram-y-label {
    font-size: 10px;
  }
}
</style>
