<template>
  <pane-container
    id="page-queries"
    class="page-content"
    :showLeftPane="app_params.sidebar"
    :showRightPane="showInspector"
    ref="rootEl">

    <pane-query
      v-model:app_params="app_params"
      :conn="conn"
      v-if="app_params.sidebar">
    </pane-query>

    <splitter
      v-if="app_params.sidebar"
      :parent="rootEl"
      :column="2"
      :active="rootEl?.dragging === 'leftPane'"
      @mousedown="rootEl.startDragging('leftPane')">
    </splitter>

    <pane-inspect
      :app_params="app_params"
      :conn="conn"
      :style="`grid-column: ${centerColumn}`"
      @selectEntity="selectEntity">
    </pane-inspect>

    <splitter
      v-if="showInspector"
      :parent="rootEl"
      :column="inspectorSplitterColumn"
      :active="rootEl?.dragging === 'rightPane'"
      @mousedown="rootEl.startDragging('rightPane')">
    </splitter>

    <div v-if="showInspector" class="page-queries-inspector" :style="`grid-column: ${inspectorColumn}`">
      <entity-inspector
        :conn="conn"
        :path="app_params.queries.path"
        :app_params="app_params.queries"
        @close="onClose"
        @selectEntity="onSelectEntity">
      </entity-inspector>
    </div>
  </pane-container>
</template>

<script>
export default { name: "page-queries" };
</script>

<script setup>
import { defineProps, defineModel, computed, ref } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  app_params: {type: Object, required: true},
});

const app_params = defineModel("app_params");
const rootEl = ref(null);

const showInspector = computed(() => {
  return app_params.value.queries.path !== undefined;
});

const centerColumn = computed(() => {
  return app_params.value.sidebar ? 3 : 1;
});

const inspectorSplitterColumn = computed(() => {
  return app_params.value.sidebar ? 4 : 2;
});

const inspectorColumn = computed(() => {
  return app_params.value.sidebar ? 5 : 3;
});

function selectEntity(entity) {
  app_params.value.queries.path = entity;
}

function onClose() {
  app_params.value.queries.path = undefined;
}

function onSelectEntity(path) {
  app_params.value.queries.path = path;
}

</script>

<style scoped>
#page-queries {
  display: grid;
  grid-template-rows: 100%;
  column-gap: 0;
  row-gap: var(--gap);
  height: calc(100vh - var(--header-height) - var(--footer-height) - 3 * var(--gap));
  overflow-x: hidden;
  overflow-y: hidden;
  min-width: 0;
  min-height: 0;
}

div.page-queries-inspector {
  grid-row: 1;
  overflow-x: auto;
  min-width: 0;
  min-height: 0;
}
</style>
