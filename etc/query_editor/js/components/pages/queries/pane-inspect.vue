<template>
<div id="pane-inspect" class="queries-right-pane ace-github-dark">
  <tabs :labels="['json', 'api', 'inspect']" class="inspect-tab-content">
    <template v-slot:json>
      <div :class="visibleClass">
        <query-json :result="result"></query-json>
      </div>
      <template v-if="result.error">
        <query-error :error="result.error"></query-error>
      </template>
    </template>
    <template v-slot:api>
      <div :class="visibleClass">
        <query-api :conn="conn" :result="result" :query="query"></query-api>
      </div>
      <template v-if="result.error">
        <query-error :error="result.error"></query-error>
      </template>
    </template>
    <template v-slot:inspect>
      <div :class="visibleClass">
        <query-inspect :query="query" :result="result"></query-inspect>
      </div>
      <template v-if="result.error">
        <query-error :error="result.error"></query-error>
      </template>
    </template>
  </tabs>
</div>
</template>

<script>
export default {
  name: "pane-inspect",
}
</script>

<script setup>
import { ref, defineProps, computed, onMounted, watch } from 'vue';

const props = defineProps({
  app_state: {type: Object, required: true },
  conn: {type: Object, required: true },
});

const result = ref({reply: []});

const query = computed(() => {
  return props.app_state.query;
});

const doRequest = () => {
  let query_func = props.conn.query.bind(props.conn);
  let q = query.value.expr;
  if (query.value.use_name) {
    query_func = props.conn.queryName.bind(props.conn);
    q = query.value.name;
  }

  if (!q || !q.length) {
    result.value = {};
  } else {
    query_func(q, {try: true, rows: true, query_info: true, field_info: true, query_plan: true, query_profile: true}, 
      (reply) => {
        result.value = reply;
      }, (reply) => {
        result.value = reply;
      });
  }
}

const visibleClass = computed(() => {
  if (result.value.error) {
    return "pane-inspect pane-inspect-hide";
  } else {
    return "pane-inspect";
  }
});

onMounted(() => {
  doRequest();
});

watch(() => [query.value.expr, query.value.name, query.value.use_name], () => {
  doRequest();
});

</script>

<style scoped>
#pane-inspect {
  position: relative;
  border-radius: var(--border-radius-medium);
  margin: 0px;
}

div.pane-inspect {
  height: 100%;
}

div.pane-inspect-hide {
  display: none;
}
</style>

<style>
.inspect-tab-content {
  margin: 0px !important;;
  padding: 0.5rem !important;
}
</style>
