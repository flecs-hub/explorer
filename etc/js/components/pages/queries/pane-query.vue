<template>
  <div id="pane-query">
    <edit-tabs :items="items"
        v-model:active_item="app_params.queries.query_tab"
        padding="0.5rem;">
      <template v-slot:editor>
        <query-editor
          :conn="conn"
          v-model:query="query.expr">
        </query-editor>
      </template>
      <template v-slot:browse>
        <query-browser
          :conn="conn"
          v-model:query_name="query.name"
          v-model:query_kind="query.kind">
        </query-browser>
      </template>
    </edit-tabs>
  </div>
</template>

<script>
export default { name: "pane-query" }
</script>

<script setup>
import { defineProps, defineModel, computed, watch } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true}
});

const app_params = defineModel("app_params");

const query = computed(() => {
  return app_params.value.queries;
});

const items = [
  { label: "Editor", value: "editor", canClose: false, icon: "edit" },
  { label: "Browse", value: "browse", canClose: false, icon: "search" }
];

watch(() => app_params.value.queries.query_tab, (tab) => {
  const isBrowse = tab == "browse";
  if (!isBrowse) {
    query.value.kind = "query";
  }
  query.value.use_name = isBrowse;
});
</script>

<style scoped>
#pane-query {
  grid-column: 1;
  grid-row: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
}
</style>
