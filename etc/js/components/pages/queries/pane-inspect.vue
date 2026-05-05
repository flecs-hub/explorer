<template>
  <div id="pane-inspect">
    <edit-tabs :items="items"
        v-model:active_item="app_params.queries.inspect_tab"
        padding="0.5rem;">
      <template v-slot:table>
        <div :class="visibleClass" class="pane-inspect-table-flush">
          <entity-table :result="result"
              v-model:sort_col="app_params.queries.sort_col"
              v-model:sort_mode="app_params.queries.sort_mode"
              @select="onSelectEntity" ref="queryTable"></entity-table>
        </div>
        <template v-if="result.error">
          <query-error :error="result.error"></query-error>
        </template>
      </template>
      <template v-slot:json>
        <div :class="visibleClass">
          <json-viewer
            :data="json_data"
            :error="!!result.error"
            v-model:format="json_format"
            v-model:highlight="json_highlight"></json-viewer>
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
    </edit-tabs>
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

function loadBool(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === "true";
  } catch (e) {
    return fallback;
  }
}

const json_format = ref(loadBool("queries.json.format", true));
const json_highlight = ref(loadBool("queries.json.highlight", true));

watch(json_format, (v) => {
  try { localStorage.setItem("queries.json.format", String(v)); } catch (e) {}
});

watch(json_highlight, (v) => {
  try { localStorage.setItem("queries.json.highlight", String(v)); } catch (e) {}
});

const json_data = computed(() => {
  if (result.value.error) {
    return result.value.error.split("\n").join("\n  ");
  }
  return { results: result.value.results };
});

const emit = defineEmits(["selectEntity"]);

const query = computed(() => {
  return props.app_params.queries;
});

const items = [
  { label: "Table", value: "table", canClose: false, icon: "table" },
  { label: "JSON", value: "json", canClose: false, icon: "json" },
  { label: "API", value: "api", canClose: false, icon: "code" },
  { label: "Inspect", value: "inspect", canClose: false, icon: "inspect" }
];

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
        persist: true,
        latency_budget_ms: explorer.EDITOR_LATENCY_BUDGET_MS
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
  margin: 0px;
  grid-row: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

div.pane-inspect {
  height: 100%;
}

div.pane-inspect-hide {
  display: none;
}

div.pane-inspect-table-flush {
  margin-left: -0.5rem;
  margin-right: -0.5rem;
}
</style>
