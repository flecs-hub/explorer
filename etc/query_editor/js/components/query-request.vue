<template>
  <template v-if="query_result.error">
    <query-error :error="query_result.error"></query-error>
  </template>
  <template v-else>
    <slot :result="query_result"></slot>
  </template>
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

const query_result = ref({reply: []});

const doRequest = () => {
  flecs.connect(props.host);

  if (!props.query.length) {
    query_result.value = {};
  } else {
    flecs.query(props.query, props.params, (reply) => {
      query_result.value = reply;
    }, (reply) => {
      query_result.value = reply;
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
