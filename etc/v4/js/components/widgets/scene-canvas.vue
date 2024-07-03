<template>
  <canvas id="canvas" v-on:click="onFocus" :class="css()">
  </canvas>
</template>

<script>
export default { name: "scene-canvas" };
</script>

<script setup>
import { ref } from 'vue';

const focus = ref(false);

function onFocus() {
  focus.value = !focus.value;
  flecs.captureKeyboardEvents(focus.value);
  document.activeElement.blur();
}

function css() {
  if (focus.value) {
    return "canvas-focus";
  }
  return "";
}
</script>

<style scoped>
#canvas {
  width: calc(100% - 4px);
  height: calc(100vh - var(--header-height) - var(--footer-height) - 3.0 * var(--gap) - 4px);
  border-style: solid;
  border-radius: var(--border-radius-medium);
  border-width: 2px;
  border-color: rgba(0,0,0,0);
  cursor: pointer;
}

canvas.canvas-focus {
  border-color: var(--green) !important;
}

</style>
