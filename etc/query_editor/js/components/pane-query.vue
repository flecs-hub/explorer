<template>
  <div id="pane-query" class="ace-github-dark">
    <tabs :labels="['editor', 'browse']"
        class="explorer-tab-content"
        v-on:changed="onTab">
      <template v-slot:editor>
        <query-editor 
          :host="host"
          v-model:query="query.expr">
        </query-editor>
      </template>
      <template v-slot:browse>
        <query-browser
          :host="host"
          v-model:query_name="query.name">
        </query-browser>
      </template>
    </tabs>
  </div>
</template>

<script>
export default { name: "pane-query" }
</script>

<script setup>
import { defineProps, defineModel } from 'vue';

const props = defineProps({
  host: {type: String, required: true},
});

const query = defineModel("query");

const onTab = (evt) => {
  query.value.use_name = evt.tab == "browse";
}
</script>

<style scoped>
#pane-query {
  grid-column: 2;
  grid-row: 3;
  border-radius: var(--border-radius-medium);
  height: calc(100vh - 60px);
}
</style>

<style>
.explorer-tab-content {
  padding: 0.5rem !important;
  padding-left: 0px !important;
}
</style>
