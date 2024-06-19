<template>
  <p>url</p>
  <pre class="query-url"><a :href="url" target="_blank">{{url}}</a></pre>
  <p>curl</p>
  <pre class="query-url">curl "{{url}}"</pre>
</template>

<script>
export default { name: "query-rest" };
</script>
  
<script setup>
import { h, defineProps } from 'vue';

const props = defineProps({
  url: {type: String, required: true}
});

</script>
  
<style scoped>
pre.query-url a {
  color: var(--primary-text);
  text-decoration: none;
}

pre.query-url a:hover {
  text-decoration: underline;
}
</style>
