<template>
  <div :class="visibleClass">
    <slot :result="query_result"></slot>
  </div>
  <template v-if="query_result.error">
    <query-error :error="query_result.error"></query-error>
  </template>
</template>

<script>
export default { name: "query-request" }
</script>

<script setup>
import { ref, defineProps, watch, onMounted, computed } from 'vue';

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

const visibleClass = computed(() => {
  if (query_result.value.error) {
    return "query-request query-request-hide";
  } else {
    return "query-request";
  }
});

onMounted(() => {
  doRequest();
});

watch(() => props.query, () => {
  doRequest();
});
</script>

<style scoped>
div.query-request {
  height: 100%;
}
div.query-request-hide {
  display: none;
}
</style>
