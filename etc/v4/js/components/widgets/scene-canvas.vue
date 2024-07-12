<template>
  <canvas id="canvas" v-on:click="onFocus" :class="css()">
  </canvas>
</template>

<script>
export default { name: "scene-canvas" };
</script>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const focus = ref(false);

function onFocus() {
  focus.value = !focus.value;
  flecs.captureKeyboardEvents(focus.value);
  if (focus.value) {
    document.activeElement.blur();
  }
}

function css() {
  if (focus.value) {
    return "canvas-focus";
  }
  return "";
}

function onOtherFocus() {
  if (focus.value) {
    onFocus();
  }
}

onMounted(() => {
  document.addEventListener("focus", onOtherFocus, true);
});

onUnmounted(() => {
  document.removeEventListener("focus", onOtherFocus, true);
});

</script>

<style scoped>
#canvas {
  width: calc(100% - 4px);
  height: calc(100vh - var(--header-height) - var(--footer-height) - 3.0 * var(--gap) - 4px);
  border-style: solid;
  border-radius: var(--border-radius-medium);
  border-width: 2px;
  border-color: var(--bg-pane);
  cursor: pointer;
}

canvas.canvas-focus {
  border-color: var(--less-dark-blue) !important;
}

</style>
