<template>
  <div id="query-result">
    <pre>{{query_result_str}}</pre>
  </div>
</template>

<script>
export default { name: "query-result" }
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  result: {type: Object, required: true }
});

const query_result_str = computed(() => {
  if (props.result.error) {
    return props.result.error.split("\n").join("\n  ");
  } else if (props.result.content) {
    return props.result.content;
  } else {
    return JSON.stringify(props.result, null, 2);
  }
});
</script>

<style scoped>
#query-result pre {
  position: relative;
  margin: 0px;
  padding: 1rem;
}
span.query-result-error {
  color: var(--bright-red);
}
</style>
