<template>

<div :id="id" :class="class" :style="gridStyle" ref="rootEl">
  <slot></slot>
</div>

</template>

<script>
export default { name: "pane-container" };
</script>

<script setup>
import { computed, defineProps, defineExpose, onMounted, onBeforeUnmount, nextTick, ref } from 'vue';

const props = defineProps({
  id: {type: String, required: false},
  class: {type: String, required: false},
  showLeftPane: {type: Boolean, required: false, default: true},
  showRightPane: {type: Boolean, required: false, default: true}
});

const rootEl = ref(null)

// --- Resizable layout state ---
const defaultLeftPaneWidth = 300;
const defaultRightPaneWidth = 500;
const minLeftPaneWidth = 180;
const minRightPaneWidth = 320;
const minCenterWidth = 200;

const leftPaneWidth = ref(Number(localStorage.getItem(`${props.id}.leftPaneWidth`)) || defaultLeftPaneWidth);
const rightPaneWidth = ref(Number(localStorage.getItem(`${props.id}.rightPaneWidth`)) || defaultRightPaneWidth);

let dragging = null; // 'sidebar' | 'inspector' | null
let containerRect = null;

function clampLeftPane(width, totalInnerWidth) {
  const max = totalInnerWidth - (props.showRightPane ? (rightPaneWidth.value + minCenterWidth) : minCenterWidth);
  return Math.max(minLeftPaneWidth, Math.min(width, max));
}

function clampRightPane(width, totalInnerWidth) {
  const max = totalInnerWidth - (props.showLeftPane ? (leftPaneWidth.value + minCenterWidth) : minCenterWidth);
  return Math.max(minRightPaneWidth, Math.min(width, max));
}

function onWindowMouseMove(e) {
  if (!dragging || !containerRect) return;
  const totalInnerWidth = containerRect.width; // grid area width
  if (dragging === 'leftPane') {
    const newWidth = clampLeftPane(e.clientX - containerRect.left, totalInnerWidth);
    leftPaneWidth.value = Math.round(newWidth);
    localStorage.setItem(`${props.id}.leftPaneWidth`, String(leftPaneWidth.value));
  } else if (dragging === 'rightPane') {
    const newWidth = clampRightPane(containerRect.right - e.clientX - 4, totalInnerWidth);
    rightPaneWidth.value = Math.round(newWidth);
    localStorage.setItem(`${props.id}.rightPaneWidth`, String(rightPaneWidth.value));
  }
  // Notify canvas to resize while dragging
  window.dispatchEvent(new Event('resize'));
}

function onWindowMouseUp() {
  if (dragging) {
    dragging = null;
    containerRect = null;
  }
}

function startDragging(which) {
  dragging = which;
  containerRect = rootEl.value.getBoundingClientRect();
}

// Attach listeners on mount, remove on unmount
onMounted(() => {
  window.addEventListener('mousemove', onWindowMouseMove);
  window.addEventListener('mouseup', onWindowMouseUp);
  window.addEventListener('resize', onWindowResize);
  // Initial clamp in case stored sizes don't fit current viewport
  nextTick(() => ensureWidthsFit());
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onWindowMouseMove);
  window.removeEventListener('mouseup', onWindowMouseUp);
  window.removeEventListener('resize', onWindowResize);
});

function onWindowResize() {
  ensureWidthsFit();
}

function ensureWidthsFit() {
  if (!rootEl.value) return;
  const el = rootEl.value;
  const rect = el.getBoundingClientRect();

  const hasLeftPane = props.showLeftPane;
  const hasRightPane = props.showRightPane;

  let left = hasLeftPane ? leftPaneWidth.value : 0;
  let right = hasRightPane ? rightPaneWidth.value : 0;

  // Clamp to minimums first
  if (hasLeftPane) left = Math.max(minLeftPaneWidth, left);
  if (hasRightPane) right = Math.max(minRightPaneWidth, right);

  if (hasLeftPane) {
    leftPaneWidth.value = Math.round(left);
    localStorage.setItem(`${props.id}.leftPaneWidth`, String(leftPaneWidth.value));
  }
  if (hasRightPane) {
    rightPaneWidth.value = Math.round(right);
    localStorage.setItem(`${props.id}.rightPaneWidth`, String(rightPaneWidth.value));
  }
}

const gridStyle = computed(() => {
  // Use split columns as the visual gaps/handles; container gap is 0
  const split = `var(--gap)`;
  if (props.showLeftPane && props.showRightPane) {
    const left = `${leftPaneWidth.value}px`;
    const right = `${rightPaneWidth.value}px`;
    return `grid-template-columns: ${left} ${split} 1fr ${split} ${right};`;
  } else if (props.showLeftPane && !props.showRightPane) {
    const left = `${leftPaneWidth.value}px`;
    return `grid-template-columns: ${left} ${split} 1fr;`;
  } else if (!props.showLeftPane && props.showRightPane) {
    const right = `${rightPaneWidth.value}px`;
    return `grid-template-columns: 1fr ${split} ${right};`;
  } else {
    return `grid-template-columns: 1fr;`;
  }
});

defineExpose({startDragging});

</script>

<style scoped>

</style>
