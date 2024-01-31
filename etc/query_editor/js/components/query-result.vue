<template>
  <template v-if="props.result.error">
    <pre id="query-result"><span class="query-result-error">error</span>: {{query_result_str}}</pre>
  </template>
  <template v-else>
    <pre id="query-result">{{query_result_str}}</pre>
  </template>
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
  if (props.result.error) {
    return props.result.error.split("\n").join("\n  ");
  } else {
    return JSON.stringify(props.result, null, 2);
  }
});
</script>

<style scoped>
#query-result {
  position: relative;
  grid-column: 1;
  grid-row: 1;
  margin: 0px;
  padding: 1em;
  overflow-y: auto;
}
span.query-result-error {
  color: var(--bright-red);
}
</style>
