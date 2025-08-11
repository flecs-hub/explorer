<template>
  <pane-container 
    id="page-entities" 
    :class="pageCss" 
    :showLeftPane="appParams.sidebar"
    :showRightPane="showRightPane"
    ref="rootEl">

    <pane-tree 
      :conn="conn"
      v-model:app_params="appParams"
      @scriptOpen="onScriptOpen"
      @entityOpen="onEntityOpen"
      v-if="app_params.sidebar"
      ref="pane_tree">
    </pane-tree>

    <splitter
      v-if="app_params.sidebar && (showCanvas || showInspector || showScript)"
      :parent="rootEl"
      :column="sidebarSplitterColumn"
      @mousedown="rootEl.startDragging('leftPane')"
    ></splitter>

    <div id="canvasPlaceholder" :class="canvasCss" :style="`grid-column: ${canvasColumn}`"></div>

    <div :class="scriptCss" :style="`grid-column: ${scriptColumn}`">
      <pane-scripts
        :conn="conn"
        v-model:script="appParams.script"
        v-model:scripts="appParams.scripts"
        ref="pane_scripts">
      </pane-scripts>
    </div>

    <splitter
      v-if="showRightPane"
      :parent="rootEl"
      :column="inspectorSplitterColumn"
      @mousedown="rootEl.startDragging('rightPane')"
    ></splitter>

    <div class="page-entities-inspector" :style="`grid-column: ${inspectorColumn}`"
      v-if="showInspector">
      <pane-inspector
        :conn="conn"
        :app_params="appParams"
        @abort="onAbort"
        @scriptOpen="onScriptOpen"
        @selectEntity="onSelectEntity">
      </pane-inspector>
    </div>
  </pane-container>
</template>

<script>
export default { name: "page-entities" };
</script>

<script setup>
import { defineProps, defineModel, ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

const pane_tree = ref(null);
const pane_scripts = ref(null);
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
  } else if (appParams.value.entity.path) {
    return false;
  } else {
    return true;
  }
});

const showCanvas = computed(() => {
  return props.app_state.has3DCanvas;
});

const showInspector = computed(() => {
  if (!appParams.value.entity.path) {
    return false;
  }
  return true;
});

// Right pane is shown when either an entity inspector is open or the
// script editor is active.
const showRightPane = computed(() => showInspector.value || showScript.value);

watch(() => [showCanvas.value, showInspector.value, showScript.value, appParams.value.sidebar], () => {
  nextTick(() => {
    var resizeEvent = new Event('resize');
    window.dispatchEvent(resizeEvent);
  });
});

function onAbort(evt) {
  appParams.value.entity.path = undefined;
  pane_tree.value.unselect();
}

function onSelectEntity(path) {
  appParams.value.entity.path = path;
}

function onScriptOpen(path) {
  if (!props.app_state.has3DCanvas) {
    pane_scripts.value.openScript(path);
    appParams.value.entity.path = path;
  } else {
    appParams.value.entity.path = undefined;
    appParams.value.scripts.length = 0;
    pane_scripts.value.openScript(path);
  }
}

function onEntityOpen(path) {
  if (props.app_state.has3DCanvas) {
    pane_scripts.value.closeScripts();
  }
}

const pageCss = computed(() => {
  let classes = ["page-content"];
  if (appParams.value.entity.path || showScript.value) {
    classes.push("page-entities-show-inspector");
  }
  if (appParams.value.sidebar == true) {
    classes.push("page-entities-show-sidebar");
  }
  return classes;
});

const scriptCss = computed(() => {
  let classes = ["page-entities-script"];
  if (!appParams.value.script) {
    classes.push("page-entities-script-hide");
  }
  return classes;
})

const canvasCss = computed(() => {
  let classes = ["page-entities-canvas"];
  if (!showCanvas.value) {
    classes.push("page-entities-canvas-hide")
  }
  return classes;
});

const canvasColumn = computed(() => {
  // With both: tree(1) | split(2) | canvas(3) | split(4) | inspector(5)
  if (appParams.value.sidebar && showInspector.value) return 3;
  // With only sidebar: tree(1) | split(2) | canvas(3)
  if (appParams.value.sidebar && !showInspector.value) return 3;
  // With only inspector: canvas(1) | split(2) | inspector(3)
  if (!appParams.value.sidebar && showInspector.value) return 1;
  // Neither
  return 1;
});

const scriptColumn = computed(() => {
  // Script pane should occupy the right pane column, same as inspector
  return inspectorColumn.value;
});

const inspectorColumn = computed(() => {
  if (!showRightPane.value) return 0;
  if (appParams.value.sidebar && showRightPane.value) return 5;
  if (!appParams.value.sidebar && showRightPane.value) return 3;
  return 0;
});

const sidebarSplitterColumn = computed(() => {
  // With both: tree(1) | split(2) | canvas(3) | split(4) | inspector(5)
  // With only sidebar: tree(1) | split(2) | canvas(3)
  if (appParams.value.sidebar) return 2;
  return 0;
});

const inspectorSplitterColumn = computed(() => {
  if (!showRightPane.value) return 0;
  // With both: inspector split at 4; with only inspector: split at 2
  return appParams.value.sidebar ? 4 : 2;
});

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

div.page-entities-canvas {
  grid-row: 1;
  border-radius: var(--border-radius-medium);
  overflow: hidden;
  min-width: 0;
  min-height: 0;
}

div.page-entities-script-hide {
  display: none;
}

div.page-entities-canvas-hide {
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
  overflow-x: auto;
  min-width: 0;
  min-height: 0;
}

</style>
