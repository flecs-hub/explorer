<template>
  <div id="pane-query" class="queries-left-pane ace-github-dark">
    <tabs :labels="['editor', 'browse']"
        class="explorer-tab-content"
        v-on:changed="onTab">
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
    </tabs>
  </div>
</template>

<script>
export default { name: "pane-query" }
</script>

<script setup>
import { defineProps, defineModel, computed } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true}
});

const app_state = defineModel("app_state");

const query = computed(() => {
  return app_state.value.query;
});

const host = computed(() => {
  return app_state.value.host;
});

const onTab = (evt) => {
  const isBrowse = evt.tab == "browse";
  if (!isBrowse) {
    query.value.kind = "query";
  }

  query.value.use_name = isBrowse;
}
</script>

<style scoped>
#pane-query {
  border-radius: var(--border-radius-medium);
}
</style>

<style>
.explorer-tab-content {
  padding: 0.5rem !important;
  padding-left: 0px !important;
}
</style>
