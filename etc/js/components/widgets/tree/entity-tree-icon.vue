<template>
  <svg width="8" height="20">
    <circle
      cx="4"
      cy="11"
      r="4"
      :fill="fillColor">
    </circle>
  </svg>
</template>

<script>
export default { name: "entity-tree-icon" }
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  item: {type: Object, required: true}
});

const fillColor = computed(() => {
  if (props.item.color) {
    return props.item.color;
  } else if (props.item.isModule) {
    return "var(--module-color)";
  } else if (props.item.isComponent) {
    return "var(--component-color)";
  } else if (props.item.isTarget) {
    return "var(--target-color)";
  } else if (props.item.isQuery) {
    return "var(--query-color)";
  } else if (props.item.isPrefab) {
    return "var(--prefab-color)";
  } else {
    return "var(--green)";
  }
});

</script>

<style scoped>
</style>
