<template>
  <pre id="query-result"> {{ query_result_str }}</pre>
</template>

<script>
export default { name: "query-result" }
</script>

<script setup>
import { ref, defineProps, watch, computed } from 'vue';

const props = defineProps({
  result: {type: Object, required: true }
});

const query_result_str = computed(() => {
  return JSON.stringify(props.result.entities, null, 2);
});
</script>

<style scoped>
#query-result {
  position: relative;
  grid-column: 1;
  grid-row: 1;
  margin: 0px;
  padding-top: 0.1em;
  overflow-y: auto;
}
</style>
