<template>
  <div id="query-table">
    
  </div>
</template>

<script>
export default { name: "query-json" }
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  result: {type: Object, required: true }
});

const fields = computed(() => {
  return props.field_info;
});

</script>

<style scoped>
#query-table {
  height: 100%;
}

</style>
