<template>
  <div id="page-entities" :class="pageCss">
    <pane-tree 
      :conn="conn"
      v-model:app_params="appParams"
      @scriptOpen="onScriptOpen"
      @entityOpen="onEntityOpen"
      v-if="app_params.sidebar"
      ref="pane_tree">
    </pane-tree>
    <div id="canvasPlaceholder" :class="canvasCss" :style="`grid-column: ${canvasColumn}`">
    </div>
    <div :class="scriptCss" :style="`grid-column: ${scriptColumn}`">
      <pane-scripts
        :conn="conn"
        v-model:script="appParams.script"
        v-model:scripts="appParams.scripts"
        ref="pane_scripts">
      </pane-scripts>
    </div>
    <div class="page-entities-inspector" :style="`grid-column: ${inspectorColumn}`"
      v-if="showInspector">
      <pane-inspector
        :conn="conn"
        :app_params="appParams"
        @abort="onAbort"
        @scriptOpen="onScriptOpen">
      </pane-inspector>
    </div>
  </div>
</template>

<script>
export default { name: "page-entities" };
</script>

<script setup>
import { defineProps, defineModel, ref, computed, watch, nextTick } from 'vue';

const pane_tree = ref(null);
const pane_scripts = ref(null);

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
  let result = 2;
  if (!appParams.value.sidebar) {
    result --;
  }
  return result;
});

const scriptColumn = computed(() => {
  let result = 2;
  if (showCanvas.value) {
    result = 3;
  }
  if (!appParams.value.sidebar) {
    result --;
  }
  return result;
});

const inspectorColumn = computed(() => {
  let result = 3;
  if (!appParams.value.sidebar) {
    result --;
  }
  return result;
});

</script>

<style scoped>
#page-entities {
  display: grid;
  grid-template-columns: 300px calc(100% - 300px - var(--gap)) 0px;
  grid-template-rows: 100%;
  gap: var(--gap);
  height: calc(100vh - var(--header-height) - var(--footer-height) - 3 * var(--gap));
}

#page-entities:not(.page-entities-show-inspector):not(.page-entities-show-sidebar) {
  grid-template-columns: calc(100%);
}

#page-entities.page-entities-show-sidebar.page-entities-show-inspector {
  grid-template-columns: 300px calc(100% - 300px - 500px - 2 * var(--gap)) 500px !important;
}

#page-entities:not(.page-entities-show-sidebar).page-entities-show-inspector {
  grid-template-columns: calc(100% - 760px - 1 * var(--gap)) 760px !important;
}

div.page-entities-canvas {
  grid-row: 1;
  border-radius: var(--border-radius-medium);
  overflow: hidden;
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
}

div.page-entities-inspector {
  grid-row: 1;
  overflow-x: auto;
}

</style>
