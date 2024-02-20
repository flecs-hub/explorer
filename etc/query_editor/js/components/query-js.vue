<template>
  <pre><span class="code-function">{{ query_func }}</span><span class="code-operator">(</span><span class="code-string">"{{ query_trimmed }}"</span><span class="code-operator">,
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
  query: {type: Object, required: true}
});

const query_func = computed(() => {
  if (props.query.use_name) {
    return "flecs.query_name";
  } else {
    return "flecs.query";
  }
});

const query_trimmed = computed(() => {
  console.log(props.query);
  if (props.query.use_name) {
    return props.query.name;
  } else {
    return flecs.query_trim(props.query.expr);
  }
});

</script>
