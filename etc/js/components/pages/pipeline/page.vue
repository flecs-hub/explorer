<template>
  <div id="page-pipeline" class="page-content">
    <div class="controls">
      <dropdown :items="periodItems" v-model:active_item="periodItem"></dropdown>&nbsp;
      <dropdown :items="pipelines" v-model:active_item="app_params.pipeline"></dropdown>&nbsp;
      <dropdown :items="flecsModeItems" v-model:active_item="flecsModeItem"></dropdown>&nbsp;
      by&nbsp; <dropdown :items="viewModeItems" v-model:active_item="viewModeItem"></dropdown>
    </div>
    <div class="pipeline-container">
      <pipeline 
        :conn="conn"
        :systems="pipelineStatsQueryResults" 
        :flecsMode="flecsMode"
        :viewMode="viewMode">
      </pipeline>
    </div>
  </div>
</template>

<script>
export default { name: "page-pipeline" };
</script>

<script setup>
import { defineProps, defineModel, computed, onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
});

const app_params = defineModel("app_params");
const periodLabel = ref("1 minute");

const viewModeItems = ref(["Default", "Time spent", "Module"]);
const viewModeItem = ref(viewModeItems.value[0]);
const viewMode = computed(() => {
  if (viewModeItem.value == viewModeItems.value[0]) {
    return "default";
  } else if (viewModeItem.value == viewModeItems.value[1]) {
    return "by_time";
  } else if (viewModeItem.value == viewModeItems.value[2]) {
    return "by_module";
  }
});

const flecsModeItems = ref(["Hide flecs", "Show flecs"]);
const flecsModeItem = ref(flecsModeItems.value[0]);
const flecsMode = computed(() => {
  if (flecsModeItem.value == flecsModeItems.value[0]) {
    return "hide_flecs";
  } else if (flecsModeItem.value == flecsModeItems.value[1]) {
    return "show_flecs";
  }
});

const periodItems = ref(['1 second', '1 minute', '1 hour', '1 day', '1 week']);
const periodItem = ref(periodItems.value[1]);
const period = computed(() => {
  if (periodItem.value == "1 second") {
    return "1s";
  } else if (periodItem.value == "1 minute") {
    return "1m";
  } else if (periodItem.value == "1 hour") {
    return "1h";
  } else if (periodItem.value == "1 day") {
    return "1d";
  } else if (periodItem.value == "1 week") {
    return "1w";
  }
});

const pipelineQuery = ref();
const pipelineQueryResults = ref([]);

const pipelineStatsQuery = ref();
const pipelineStatsQueryResults = ref([]);

const pipelines = computed(() => {
  let result = ["All systems"];
  for (let r of pipelineQueryResults.value) {
    let path = r.name;
    if (r.parent) {
      path = r.parent + "." + path;
    }
    result.push(path);
  }
  return result;
});

watch(() => [pipelines.value], () => {
  if (app_params.value.pipeline) {
    return;
  }

  if (pipelines.value && pipelines.value.length) {
    app_params.value.pipeline = pipelines.value[0];
  }
});

watch(() => [app_params.value.pipeline, period.value], () => {
  doPipelineStatsQuery();
});

onMounted(() => {
  pipelineQuery.value = props.conn.query("[none] flecs.pipeline.Pipeline", {
    try: true,
    rows: true,
    managed: true,
    persist: true
  }, (reply) => {
    if (reply.results) {
      pipelineQueryResults.value = reply.results;
    } else {
      pipelineQueryResults.value = [];
    }
  });

  doPipelineStatsQuery();
});

onUnmounted(() => {
  if (pipelineQuery.value) {
    pipelineQuery.value.abort();
  }
  if (pipelineStatsQuery.value) {
    pipelineStatsQuery.value.abort();
  }
});

function doPipelineStatsQuery() {
  if (pipelineStatsQuery.value) {
    pipelineStatsQuery.value.abort();
  }

  pipelineStatsQuery.value = props.conn.request("stats/pipeline", {
    name: app_params.value.pipeline === "All systems" ? "all" : app_params.value.pipeline,
    period: period.value,
    managed: true,
    persist: true
  }, (reply) => {
    pipelineStatsQueryResults.value = reply;

    let totalTime = 0;

    for (let s of reply) {
      let time_spent = 0;
      for (let t of s.time_spent.avg) {
        time_spent += t;
      }

      s.time_spent_sum = time_spent;
      s.time_spent_avg = time_spent / s.time_spent.avg.length;
      totalTime += time_spent;
    }

    for (let s of reply) {
      s.time_spent_pct = s.time_spent_sum / totalTime;
    }
  });
}

</script>

<style scoped>
#page-pipeline {
  display: grid;
  grid-template-columns: 900px auto;
  grid-template-rows: 38px auto;
  height: calc(100% - 1rem);
  overflow: auto;
  background-color: var(--bg-pane);
  border-radius: var(--border-radius-medium);
  padding: 8px;
}

div.controls {
  grid-column: 1;
  grid-row: 1;
  padding-bottom: 0px;
  color: var(--secondary-text);
}

div.pipeline-container {
  grid-column: 1;
  grid-row: 2;
  padding-top: 4px;
  padding-right: 8px;
  overflow-y: auto;
}

</style>
