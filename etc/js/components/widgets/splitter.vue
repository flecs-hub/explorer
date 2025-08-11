<template>

<div class="vsplitter" :style="`grid-column: ${column}`"></div>

</template>

<script>
export default { name: "splitter" };
</script>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
    parent: {type: Object, required: true},
    column: {type: Number, required: true, default: 0}
});

</script>

<style scoped>

div.vsplitter {
  grid-row: 1;
  width: var(--gap);
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
}

div.vsplitter:hover {
  opacity: 1.0;
}

</style>
