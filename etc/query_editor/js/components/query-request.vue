<template>
  <query-result :result="query_result"></query-result>
</template>

<script>
export default { name: "query-request" }
</script>

<script setup>
import { ref, defineProps, watch, onMounted } from 'vue';

const props = defineProps({
  host: {type: String, required: true },
  query: {type: String, required: true },
  params: {type: Object, required: false, default: {}}
});

const query_result = ref({entities: [], error: undefined, content: undefined});

const doRequest = () => {
  flecs.connect(props.host);

  if (!props.query.length) {
    query_result.value.entities = [];
  } else {
    flecs.query(props.query, props.params, (reply) => {
      query_result.value.entities = reply.entities;
      query_result.value.error = reply.error;
      query_result.value.content = reply.content;
    }, (err) => {
      query_result.value.entities = [];
      query_result.value.error = err.error;
      query_result.value.content = [];
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
