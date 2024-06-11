<template>
  <div id="query-json">
    <pre>{{query_json_str}}</pre>
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

const query_json_str = computed(() => {
  if (props.result.error) {
    return props.result.error.split("\n").join("\n  ");
  } else {
    return JSON.stringify({results: props.result.results}, null, 2);
  }
});
</script>

<style scoped>
#query-json {
  height: 100%;
}

#query-json pre {
  position: relative;
  margin: 0px;
  padding: 1rem;
  height: calc(100% - 2rem);
  overflow-y: auto;
  color: var(--primary-text);
}
span.query-json-error {
  color: var(--bright-red);
}
</style>
