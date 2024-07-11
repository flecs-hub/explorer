<template>
  <div id="page-entities" :class="pageCss()">
    <pane-tree 
      :conn="conn"
      v-model:app_params="appParams"
      @scriptOpen="onScriptOpen"
      @entityOpen="onEntityOpen">
    </pane-tree>
    <div :class="canvasCss()">
      <scene-canvas></scene-canvas>
    </div>
    <div :class="scriptCss()">
      <pane-scripts
        :conn="conn"
        v-model:active_script="appParams.active_script"
        v-model:scripts="appParams.scripts"
        ref="pane_scripts">
      </pane-scripts>
    </div>
    <div class="page-entities-inspector" v-if="showInspector">
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

const pane_scripts = ref(null);

const props = defineProps({
  conn: {type: Object, required: true},
  app_state: {type: Object, required: true},
});

const appParams = defineModel("app_params");

const showScript = computed(() => {
  if (!props.app_state.has3DCanvas) {
    return false;
  } else if (!appParams.value.active_script) {
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

watch(() => [showCanvas.value, showInspector.value, showScript.value], () => {
  nextTick(() => {
    var resizeEvent = new Event('resize');
    window.dispatchEvent(resizeEvent);
  });
});

function onAbort(evt) {
  appParams.value.entity.path = undefined;
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

function pageCss() {
  let classes = ["page-content"];
  if (appParams.value.entity.path || showScript.value) {
    classes.push("page-entities-show-inspector");
  }
  return classes;
}

function scriptCss() {
  let classes = ["page-entities-script"];
  if (showCanvas.value) {
    classes.push("page-entities-script-side");
  }
  return classes;
}

function canvasCss() {
  let classes = ["page-entities-canvas"];
  if (!showCanvas.value) {
    classes.push("page-entities-canvas-hide")
  }
  return classes;
}

</script>

<style scoped>
#page-entities {
  display: grid;
  grid-template-columns: 300px calc(100% - 300px - var(--gap)) 0px;
  grid-template-rows: 100%;
  gap: var(--gap);
  height: calc(100vh - var(--header-height) - var(--footer-height) - 3 * var(--gap));
}

div.page-entities-show-inspector {
  grid-template-columns: 300px calc(100% - 300px - 450px - 2 * var(--gap)) 450px !important;
}

div.page-entities-canvas {
  grid-column: 2;
  grid-row: 1;
  border-radius: var(--border-radius-medium);
  overflow: hidden;
}

div.page-entities-canvas-hide {
  display: none;
}

div.page-entities-script {
  grid-column: 2;
  grid-row: 1;
  height: 100%;
}

div.page-entities-script-side {
  grid-column: 3;
}

div.page-entities-inspector {
  grid-column: 3;
  grid-row: 1;
  overflow-x: auto;
}

</style>
