<template>

<div class="vsplitter" :class="{active: active}" :style="column ? `grid-column: ${column}` : ''"></div>

</template>

<script>
export default { name: "splitter" };
</script>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
    column: {type: Number, required: false},
    active: {type: Boolean, required: false, default: false}
});

</script>

<style scoped>

div.vsplitter {
  grid-row: 1;
  width: calc(var(--gap) - 2px);
  cursor: col-resize;
  background: var(--green);
  opacity: 0.0;
  user-select: none;
  z-index: 2;
  transition: opacity 0.1s ease;
  /* Keep splitter inside grid cell to avoid layout overflow */
  justify-self: stretch;
  align-self: stretch;
  box-sizing: border-box;
  flex: 0 0 auto;
}

div.vsplitter:hover,
div.vsplitter.active {
  opacity: 0.7;
}

</style>
