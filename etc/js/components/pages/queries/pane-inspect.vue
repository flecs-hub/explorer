<template>
  <div id="pane-inspect" class="pane">
    <tabs :items="['table', 'json', 'api', 'inspect']"
        v-model:active_tab="app_params.queries.inspect_tab"
        class="inspect-tab-content">
    <template v-slot:table>
      <div :class="visibleClass">
        <entity-table :result="result" @select="onSelectEntity" ref="queryTable"></entity-table>
      </div>
      <template v-if="result.error">
        <query-error :error="result.error"></query-error>
      </template>
    </template>
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
import { ref, defineProps, defineEmits, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  app_params: {type: Object, required: true },
  conn: {type: Object, required: true }
});

const result = ref({reply: []});
const request = ref(undefined);
const queryTable = ref(null);

const emit = defineEmits(["selectEntity"]);

const query = computed(() => {
  return props.app_params.queries;
});

const doRequest = () => {
  if (request.value) {
    request.value.abort();
  }

  let query_func = props.conn.query.bind(props.conn);
  let q = query.value.expr;
  if (query.value.use_name) {
    query_func = props.conn.queryName.bind(props.conn);
    q = query.value.name;
  }

  if (!q || !q.length) {
    result.value = {};
    request.value = undefined;
  } else {
    request.value = query_func(q, {
        try: true,
        rows: true, 
        full_paths: true,
        query_info: true, 
        field_info: true, 
        query_plan: true, 
        query_profile: true,
        managed: true,
        persist: true
      }, 
      (reply) => {
        result.value = reply;
      }, (reply) => {
        result.value = reply;
      }, () => {
        result.value = []; // Aborted
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

onUnmounted(() => {
  if (request.value) {
    request.value.abort();
  }
})

watch(() => [query.value.expr, query.value.name, query.value.use_name], () => {
  queryTable.value.resetQuery();
  doRequest();
});

function onSelectEntity(entity) {
  emit("selectEntity", entity);
}

</script>

<style scoped>
#pane-inspect {
  position: relative;
  border-radius: var(--border-radius-medium);
  margin: 0px;
  grid-row: 1;
  min-width: 0;
  min-height: 0;
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
