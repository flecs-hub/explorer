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
    return "#FFE100";
  } else if (props.item.isComponent) {
    return "#4981B5";
  } else if (props.item.isPrefab) {
    return "#DDE0E6";
  } else {
    return "var(--green)";
  }
});

</script>

<style scoped>
</style>
