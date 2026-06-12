<template>
  <pane-container 
    id="page-entities" 
    :class="pageCss" 
    :showLeftPane="appParams.sidebar"
    ref="rootEl">

    <pane-tree 
      :conn="conn"
      v-model:app_params="appParams"
      @selectEntity="onSelectEntity"
      @scriptOpen="onScriptOpen"
      v-if="app_params.sidebar"
      ref="pane_tree">
    </pane-tree>

    <splitter
      v-if="app_params.sidebar"
      :parent="rootEl"
      :column="sidebarSplitterColumn"
      :active="rootEl?.dragging === 'leftPane'"
      @mousedown="rootEl.startDragging('leftPane')"
    ></splitter>

    <pane-content :conn="conn" :app_state="app_state"
      ref="pane_content"
      v-model:tab="appParams.entities.tab"
      v-model:scripts="appParams.scripts"
      @onCodeChange="onCodeChange"
      v-show="!rootEl?.centerPaneHidden">
    </pane-content>

    <splitter
      :parent="rootEl"
      :column="inspectorSplitterColumn"
      :active="rootEl?.dragging === 'rightPane'"
      @mousedown="rootEl.startDragging('rightPane')"
    ></splitter>

    <div class="page-entities-inspector" :style="`grid-column: ${inspectorColumn}`">
      <div :class="inspectorPaneCss('main')"
        @mousedown.capture="setActiveInspector('main')">
        <entity-inspector
          :conn="conn"
          :path="appParams.entities.path"
          :canSplit="!appParams.entities.split"
          v-model:app_params="appParams.entities"
          @close="onCloseInspector('main')"
          @split="onSplit"
          @onCodeChange="onCodeChange"
          @scriptOpen="onScriptOpen"
          @queryOpen="onQueryOpen"
          @selectEntity="onSelectEntity">
        </entity-inspector>
      </div>
      <div :class="inspectorPaneCss('split')"
        v-if="appParams.entities.split"
        @mousedown.capture="setActiveInspector('split')">
        <entity-inspector
          :conn="conn"
          :path="appParams.entities.split_path"
          :app_params="splitInspectorParams"
          @close="onCloseInspector('split')"
          @onCodeChange="onCodeChange"
          @scriptOpen="onScriptOpen"
          @queryOpen="onQueryOpen"
          @selectEntity="onSelectEntity">
        </entity-inspector>
      </div>
    </div>
  </pane-container>
</template>

<script>
export default { name: "page-entities" };
</script>

<script setup>
import { defineProps, defineModel, ref, computed, watch, nextTick } from 'vue';

const pane_tree = ref(null);
const pane_scripts = ref(null);
const pane_content = ref(null);
const rootEl = ref(null);

const props = defineProps({
  conn: {type: Object, required: true},
  app_state: {type: Object, required: true},
});

const appParams = defineModel("app_params");

const showScript = computed(() => {
  if (!props.app_state.has3DCanvas) {
    return false;
  } else if (!appParams.value.script) {
    return false;
  } else if (appParams.value.entities.path) {
    return false;
  } else {
    return true;
  }
});

const showCanvas = computed(() => {
  return props.app_state.has3DCanvas;
});

const showInspector = computed(() => {
  if (!appParams.value.entities.path && !appParams.value.entities.split) {
    return false;
  }
  return true;
});

watch(() => [showCanvas.value, showInspector.value, showScript.value, appParams.value.sidebar], () => {
  nextTick(() => {
    var resizeEvent = new Event('resize');
    window.dispatchEvent(resizeEvent);
  });
});

const splitInspectorParams = {
  get path() { return appParams.value.entities.split_path; },
  set path(value) { appParams.value.entities.split_path = value; },
  get inspector_tab() { return appParams.value.entities.split_inspector_tab; },
  set inspector_tab(value) { appParams.value.entities.split_inspector_tab = value; }
};

function onSplit() {
  appParams.value.entities.split = true;
  appParams.value.entities.split_path = appParams.value.entities.path;
  appParams.value.entities.split_inspector_tab = "Inspect";
  appParams.value.entities.active_inspector = "main";
}

function setActiveInspector(which) {
  appParams.value.entities.active_inspector = which;
}

function inspectorPaneCss(which) {
  let classes = ["page-entities-inspector-pane"];
  if (appParams.value.entities.split &&
      appParams.value.entities.active_inspector === which)
  {
    classes.push("page-entities-inspector-pane-active");
  }
  return classes;
}

function onCloseInspector(which) {
  const entities = appParams.value.entities;
  if (entities.split) {
    if (which === "main") {
      entities.path = entities.split_path;
      entities.inspector_tab = entities.split_inspector_tab;
    }
    entities.split = false;
    entities.split_path = undefined;
    entities.split_inspector_tab = "Inspect";
    entities.active_inspector = "main";
    if (!entities.path) {
      pane_tree.value.unselect();
    }
  } else {
    entities.path = undefined;
    pane_tree.value.unselect();
  }
}

function onScriptOpen(path) {
  if (showCanvas.value) {
    // If the explorer has a canvas, show script in the inspector spot so a user
    // can edit the script while seeing the scene.
    appParams.value.script = path;
    appParams.value.entities.path = undefined;
    console.log("set script to ", path);
  } else {
    // If the explorer doesn't have a canvas, open script in the center pane.
    pane_content.value.openScript(path);
  }
}

function onSelectEntity(path, tab) {
  const entities = appParams.value.entities;
  if (entities.split && entities.active_inspector === "split") {
    entities.split_path = path;
    if (tab) {
      entities.split_inspector_tab = tab;
    }
  } else {
    entities.path = path;
    if (tab) {
      entities.inspector_tab = tab;
    }
  }
}

function onQueryOpen() {
  appParams.value.page = "queries";
  appParams.value.queries.name = appParams.value.entities.path;
  appParams.value.queries.use_name = true;
  appParams.value.queries.path = undefined;
  appParams.value.queries.query_tab="browse";
  appParams.value.queries.inspect_tab="table";
}

const pageCss = computed(() => {
  let classes = ["page-content"];
  if (showInspector.value || showScript.value) {
    classes.push("page-entities-show-inspector");
  }
  if (appParams.value.sidebar == true) {
    classes.push("page-entities-show-sidebar");
  }
  return classes;
});

const inspectorColumn = computed(() => {
  return (appParams.value.sidebar) ? 5 : 3;
});

const sidebarSplitterColumn = computed(() => {
  if (appParams.value.sidebar) return 2;
  return 0;
});

const inspectorSplitterColumn = computed(() => {
  return appParams.value.sidebar ? 4 : 2;
});

function onCodeChange(evt) {
  if (props.app_state.mode == flecs.ConnectionMode.Wasm) {
    appParams.value.code = evt;
  }
}

</script>

<style scoped>
#page-entities {
  display: grid;
  grid-template-columns: 300px calc(100% - 300px - var(--gap)) 0px;
  grid-template-rows: 100%;
  column-gap: 0; /* we'll model gaps explicitly as splitter columns */
  row-gap: var(--gap);
  height: calc(100vh - var(--header-height) - var(--footer-height) - 3 * var(--gap));
  overflow-x: hidden;
  overflow-y: hidden;
  min-width: 0;
  min-height: 0;
}

#page-entities:not(.page-entities-show-inspector):not(.page-entities-show-sidebar) {
  grid-template-columns: calc(100%);
}

/* Grid sizes are overridden dynamically via inline style */

div.page-entities-script-hide {
  display: none;
}

div.page-entities-script {
  grid-row: 1;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

div.page-entities-inspector {
  grid-row: 1;
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  min-width: 0;
  min-height: 0;
}

div.page-entities-inspector-pane {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  overflow-x: auto;
  outline: 1px solid transparent;
  outline-offset: -1px;
  border-radius: var(--border-radius-medium);
}

div.page-entities-inspector-pane-active {
  outline-color: var(--green);
}

</style>
