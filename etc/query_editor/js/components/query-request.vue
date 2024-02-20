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
  query: {type: Object, required: true },
  params: {type: Object, required: false, default: {}}
});

const query_result = ref({reply: []});

const doRequest = () => {
  flecs.connect(props.host);

  let query_func = flecs.query;
  let q = props.query.expr;
  if (props.query.use_name) {
    query_func = flecs.query_name;
    q = props.query.name;
  }

  if (!q || !q.length) {
    query_result.value = {};
  } else {
    query_func(q, props.params, (reply) => {
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

watch(() => [props.query.expr, props.query.name, props.query.use_name], () => {
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
