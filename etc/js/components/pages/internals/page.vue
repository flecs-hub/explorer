<template>
  <div id="page-internals" :class="pageCss">
    <edit-tabs :items="items" v-model:active_item="app_params.internals.tab">
      <template v-slot:tables>
        <template v-if="tablesLoading">
          <div class="loading">Loading...</div>
        </template>
        <template v-else>
          <internals-tables-table :tables="tables" @refresh="onRefresh"></internals-tables-table>
        </template>
      </template>
      <template v-slot:components>
        <template v-if="componentsLoading">
          <div class="loading">Loading...</div>
        </template>
        <template v-else>
          <internals-components-table :components="components" @refresh="onRefresh"></internals-components-table>
        </template>
      </template>
      <template v-slot:queries>
        <template v-if="queriesLoading">
          <div class="loading">Loading...</div>
        </template>
        <template v-else>
          <internals-queries-table :queries="queries" 
            :conn="conn"
            v-model:app_params="app_params"
            @refresh="onRefresh"
            @select="onSelect">
          </internals-queries-table>
        </template>
      </template>
      <template v-slot:build>
        <internals-build :conn="conn" :app_state="app_state"></internals-build>
      </template>
      <template v-slot:connection>
        <internals-connection :conn="conn" :app_state="app_state"></internals-connection>
      </template>
      <template v-slot:natvis>
        <internals-natvis :conn="conn" :app_state="app_state"></internals-natvis>
      </template>
    </edit-tabs>

    <div class="page-internals-inspector" v-if="app_params.internals.path">
      <entity-inspector
        :conn="conn"
        :path="app_params.internals.path"
        v-model:app_params="app_params.internals"
        @close="onClose">
      </entity-inspector>
    </div>
  </div>
</template>

<script>
export default { name: "page-internals" };
</script>

<script setup>
import { defineProps, computed, defineModel, onMounted, ref } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  app_state: {type: Object, required: true}
});

const app_params = defineModel("app_params");

const tablesLoading = ref(true);
const tables = ref([]);

const componentsLoading = ref(true);
const components = ref([]);

const queriesLoading = ref(true);
const queries = ref([]);

const items = computed(() => {
  let result = [];

  result.push({
    label: "Tables",
    value: "tables",
    canClose: false,
    icon: "table"
  });

  result.push({
    label: "Components",
    value: "components",
    canClose: false,
    icon: "symbol-field"
  });

  result.push({
    label: "Queries",
    value: "queries",
    canClose: false,
    icon: "search"
  });

  result.push({
    label: "Build",
    value: "build",
    canClose: false,
    icon: "tools"
  });

  result.push({
    label: "Natvis",
    value: "natvis",
    canClose: false,
    icon: "bug"
  });

  result.push({
    label: "Connection",
    value: "connection",
    canClose: false,
    icon: "remote"
  });

  return result;
});

const pageCss = computed(() => {
  let result = ["page-content"];
  if (app_params.value.internals.path) {
    result.push("page-internals-show-inspector");
  }
  return result;
});

function refresh() {
  props.conn.request("tables", {}, (reply) => {
    tables.value = reply;
    tablesLoading.value = false;
  });

  props.conn.request("components", {}, (reply) => {
    components.value = reply;
    componentsLoading.value = false;
  });

  props.conn.request("queries", {}, (reply) => {
    queries.value = reply;
    queriesLoading.value = false;
  });
}

onMounted(() => {
  refresh();
});

function onRefresh() {
  refresh();
}

function onSelect(name) {
  app_params.value.internals.inspector_tab = "Query";
  app_params.value.internals.path = name;
}

function onClose() {
  app_params.value.internals.path = undefined;
}

</script>

<style scoped>

#page-internals {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--gap);

  height: calc(100vh - var(--header-height) - var(--footer-height) - 3 * var(--gap));
}

div.loading {
  color: var(--secondary-text);
  font-size: 1rem;
  font-weight: 500;
  text-align: center;
  padding: 1rem;
}

div.page-internals-show-inspector {
  grid-template-columns: 1fr 1fr !important;
}

div.page-internals-inspector {
  height: inherit;
}

</style>
