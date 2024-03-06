<template>
<div id="pane-inspect" class="ace-github-dark">
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
        <query-api :result="result" :query="query"></query-api>
      </div>
      <template v-if="result.error">
        <query-error :error="result.error"></query-error>
      </template>
    </template>
    <template v-slot:inspect>
      <div :class="visibleClass">
        <query-inspect :result="result"></query-inspect>
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
  host: {type: String, required: true },
  query: {type: Object, required: true },
});

const result = ref({reply: []});

const doRequest = () => {
  flecs.connect(props.host);

  let query_func = flecs.query;
  let q = props.query.expr;
  if (props.query.use_name) {
    query_func = flecs.query_name;
    q = props.query.name;
  }

  if (!q || !q.length) {
    result.value = {};
  } else {
    query_func(q, {try: true, query_info: true, field_info: true, query_plan: true, query_profile: true}, 
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

watch(() => [props.query.expr, props.query.name, props.query.use_name], () => {
  doRequest();
});

</script>

<style scoped>
#pane-inspect {
  position: relative;
  grid-column: 3;
  grid-row: 3 / 4;
  border-radius: var(--border-radius-medium);
  height: calc(100vh - 60px);
  margin: 0px;
}

@media screen and (max-width: 800px) {
  #pane-inspect {
    grid-column: 2;
    grid-row: 4;
    height: calc(60vh - 2.25rem);
  }
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