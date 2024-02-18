<template>
  <pre><span class="code-function">flecs.query</span><span class="code-operator">(</span><span class="code-string">"{{ query_trimmed }}"</span><span class="code-operator">,
  {</span><span class="code-member">rows</span><span class="code-operator">: </span><span class="code-keyword">true</span><span class="code-operator">},</span>
  <span class="code-operator">(</span><span class="code-variable">reply</span><span class="code-operator">) => {
    <span class="code-comment">// Success</span>
  }, </span>
  <span class="code-operator">(</span><span class="code-variable">reply</span><span class="code-operator">) => {
    <span class="code-comment">// Failed</span>
  });</span></pre>
</template>

<script>
export default { name: "query-js" }
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  query: {type: String, required: true}
});

const query_trimmed = computed(() => {
  return flecs.query_trim(props.query);
});

</script>
