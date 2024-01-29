<template>
  <template v-if="!status">
    <span class="query-status query-status-ok"> </span>
  </template>
  <template v-else>
    <span class="query-status query-status-error"> {{ status }}</span>
  </template>
</template>

<script>
export default { name: "query-status" }
</script>

<script setup>
import { ref, defineProps, watch, computed } from 'vue';

const props = defineProps({
  result: {type: Object, required: true }
});

const status = computed(() => {
  if (props.result.error) {
    const lines = props.result.error.split("\n");
    return lines[0];
  } else {
    return "";
  }
});

</script>

<style scoped>
span.query-status {
  position: relative;
  grid-column: 1;
  grid-row: 2;
  margin: 0px;
  padding-top: 0.1em;
  padding-left: 0.2em;
  color: white;
  font-weight: 500;
}

span.query-status-ok {
  background-color: var(--bg-ok);
}

span.query-status-error {
  background-color: var(--bg-error);
}
</style>
