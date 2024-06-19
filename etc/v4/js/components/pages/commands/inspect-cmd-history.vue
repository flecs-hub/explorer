<template>
  <div ref="svgContainer">
    <svg class="commands-history">
      <rect 
        :x="xPos(i)" 
        :y="yPos(cmdCount)"
        rx="2"
        ry="2"
        width="14" 
        :height="barHeight(cmdCount)" 
        :fill="fillColor(cmdCount)"
        opacity="0.5"
        v-for="(cmdCount, i) in app_state.command_counts"/>
    </svg>
  </div>
</template>

<script>
export default { name: "commands-inspect-cmd-history" };
</script>

<script setup>
import { defineProps, ref, computed } from 'vue';

const props = defineProps({
  app_state: {type: Object, required: true}
});

const svgContainer = ref(null);
const height = 36;
const maxBarHeight = 32;

const fillColor = (cmdCount) => {
  if (cmdCount >= 0) {
    return "var(--secondary-color)";
  } else {
    return "var(--red)";
  }
}

const xPos = (index) => {
  let width = 0;
  if (svgContainer.value) {
    width = svgContainer.value.offsetWidth;
  }
  return width - ((index + 1) * 16);
}

const yPos = (cmdCount) => {
  return height - barHeight(cmdCount);
}

const barHeight = (cmdCount) => {
  return Math.max(4, maxBarHeight * (cmdCount / maxCount.value));
}

const maxCount = computed(() => {
  let max = 0;
  for (let i = 0; i < barCount.value; i ++) {
    const count = props.app_state.command_counts[i];
    if (count > max) {
      max = count;
    }
  }
  return Math.max(4, max);
});

const barCount = computed(() => {
  let width = 0;
  if (svgContainer.value) {
    width = svgContainer.value.offsetWidth;
  }
  return (width / 14) + 1;
});

</script>

<style scoped>
svg.commands-history {
  width: 100%;
  height: 34px;
  background-color: var(--bg-content);
  border-radius: var(--border-radius-medium);
}
</style>
