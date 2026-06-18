<template>

<div :class="[horizontal ? 'hsplitter' : 'vsplitter', {active: active}]" :style="splitterStyle"></div>

</template>

<script>
export default { name: "splitter" };
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
    column: {type: Number, required: false},
    row: {type: Number, required: false},
    horizontal: {type: Boolean, required: false, default: false},
    active: {type: Boolean, required: false, default: false}
});

const splitterStyle = computed(() => {
    if (props.horizontal) {
        return props.row ? `grid-row: ${props.row}` : '';
    }
    return props.column ? `grid-column: ${props.column}` : '';
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

div.hsplitter {
  grid-column: 1;
  height: calc(var(--gap) - 2px);
  cursor: row-resize;
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

div.hsplitter:hover,
div.hsplitter.active {
  opacity: 0.7;
}

</style>
