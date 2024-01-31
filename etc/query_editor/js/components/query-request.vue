<template>
  <div id="query-request" class="ace-github-dark">
    <query-result :result="query_result"></query-result>
    <query-status :result="query_result"></query-status>
  </div>
</template>

<script>
export default { name: "query-request" }
</script>

<script setup>
import { ref, defineProps, watch, onMounted } from 'vue';

const props = defineProps({
  host: {type: String, required: true },
  query: {type: String, required: true }
});

const query_result = ref({entities: [], error: undefined});

const doRequest = () => {
  flecs.connect(props.host);

  if (!props.query.length) {
    query_result.value.entities = [];
  } else {
    flecs.query(props.query, {}, (reply) => {
      query_result.value.entities = reply.entities;
      query_result.value.error = reply.error;
    }, (err) => {
      query_result.value.entities = [];
      query_result.value.error = err.error;
    });
  }
}

onMounted(() => {
  doRequest();
});

watch(() => props.query, () => {
  doRequest();
});
</script>

<style scoped>
#query-request {
  position: relative;
  grid-column: 3;
  grid-row: 3 / 4;
  display: grid;
  grid-template-rows: 1fr 0.25rem;
  margin: 0px;
  overflow-y: auto;
  border-radius: 0.5em;
}
</style>
