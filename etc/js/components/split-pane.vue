<template>
  <div class="split-pane-container" :data-direction="direction">
    <slot></slot>
  </div>
</template>

<script>
export default { name: "split-pane" };
</script>

<script setup>
import { defineProps } from 'vue';

defineProps({
  direction: {
    type: String,
    default: 'horizontal',
    validator: (value) => ['horizontal', 'vertical'].includes(value)
  }
});
</script>

<style scoped>
.split-pane-container {
  display: flex;
  height: 100%;
  gap: var(--gap);
}

.split-pane-container[data-direction="vertical"] {
  flex-direction: column;
}
</style> 