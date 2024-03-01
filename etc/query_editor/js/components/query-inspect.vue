<template>
  <div id="query-inspect">
    <p>expression</p>
    <query-expr :result="result"></query-expr>
    <p>query plan</p>
    <query-plan :result="result"></query-plan>
    <p>query profile</p>
    <query-profile :result="result"></query-profile>
  </div>
</template>

<script>
export default { name: "query-inspect" }
</script>

<script setup>
import { defineProps, h } from 'vue';

const props = defineProps({
  result: {type: Object, required: true}
});

</script>

<style scoped>
#query-inspect {
  padding-top: 0.5rem;
}

#query-inspect p {
  margin: 0px;
  padding-left: 0.5rem;
  text-transform: uppercase;
  color: var(--secondary-text);
  font-weight: bold;
  font-size: 1rem;
}
</style>