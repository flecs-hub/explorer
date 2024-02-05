<template>
  <pre class="query-result-error"><span>error</span>: {{error}}</pre>
</template>
  
<script>
export default { name: "query-error" }
</script>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  error: {type: String, required: true }
});
</script>
  
<style scoped>
pre.query-result-error {
  word-wrap: break-word;
  white-space: break-spaces;
  padding-left: 1rem;
}
pre.query-result-error span {
  color: var(--bright-red);
}
</style>
