<template>
  <div id="page-entities" :class="pageCss">
    <split-pane>
      <div class="split-pane" v-if="app_params.sidebar" :style="{ width: sidebarWidth + 'px' }">
        <pane-tree 
          :conn="conn"
          v-model:app_params="appParams"
          @scriptOpen="onScriptOpen"
          @entityOpen="onEntityOpen">
        </pane-tree>
      </div>
      <div class="handle" v-if="app_params.sidebar" @mousedown="startResize('sidebar')">
        <div class="handle-grab-box"></div>
      </div>

      <div class="split-pane" :style="{ width: mainWidth + 'px' }">
        <div id="canvasPlaceholder" :class="canvasCss" v-if="showCanvas">
        </div>
        <div :class="scriptCss" v-if="showScript">
          <pane-scripts
            :conn="conn"
            v-model:script="appParams.script"
            v-model:scripts="appParams.scripts"
            ref="pane_scripts">
          </pane-scripts>
        </div>
      </div>

      <div class="handle" v-if="showInspector" @mousedown="startResize('inspector')">
        <div class="handle-grab-box"></div>
      </div>

      <div class="split-pane" v-if="showInspector" :style="{ width: inspectorWidth + 'px' }">
        <pane-inspector
          :conn="conn"
          :app_params="appParams"
          @abort="onAbort"
          @scriptOpen="onScriptOpen">
        </pane-inspector>
      </div>
    </split-pane>
  </div>
</template>

<script>
export default { name: "page-entities" };
</script>

<script setup>
import { defineProps, defineModel, ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import SplitPane from '../../split-pane.vue';

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
  return classes;
})

const canvasCss = computed(() => {
  let classes = ["page-entities-canvas"];
  if (!showCanvas.value) {
    classes.push("page-entities-canvas-hide")
  }
  return classes;
});

const sidebarWidth = ref(300);
const inspectorWidth = ref(500);
const mainWidth = computed(() => {
  const totalWidth = window.innerWidth;
  let width = totalWidth;
  if (appParams.value.sidebar) {
    width -= sidebarWidth.value + 8; // 8px for gap
  }
  if (showInspector.value) {
    width -= inspectorWidth.value + 8;
  }
  return width;
});

let isResizing = false;
let currentHandle = null;

function startResize(handle) {
  isResizing = true;
  currentHandle = handle;
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
}

function handleResize(e) {
  if (!isResizing) return;

  if (currentHandle === 'sidebar') {
    const newWidth = Math.max(200, Math.min(600, e.clientX));
    sidebarWidth.value = newWidth;
  } else if (currentHandle === 'inspector') {
    const totalWidth = window.innerWidth;
    const maxWidth = totalWidth - (appParams.value.sidebar ? sidebarWidth.value + 400 : 400);
    const newWidth = Math.max(300, Math.min(maxWidth, totalWidth - e.clientX));
    inspectorWidth.value = newWidth;
  }

  window.dispatchEvent(new Event('resize'));
}

function stopResize() {
  isResizing = false;
  currentHandle = null;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
}

onMounted(() => {
  window.addEventListener('resize', () => {
    const totalWidth = window.innerWidth;
    if (appParams.value.sidebar && sidebarWidth.value > totalWidth * 0.4) {
      sidebarWidth.value = Math.min(sidebarWidth.value, totalWidth * 0.4);
    }
    if (showInspector.value && inspectorWidth.value > totalWidth * 0.6) {
      inspectorWidth.value = Math.min(inspectorWidth.value, totalWidth * 0.6);
    }
  });
});

onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
});

</script>

<style scoped>
#page-entities {
  height: calc(100vh - var(--header-height) - var(--footer-height) - 3 * var(--gap));
  overflow: hidden;
}

.split-pane {
  height: 100%;
  min-width: 0;
  overflow: auto;
}

.handle {
  cursor: col-resize;
  width: 8px;
  margin: 0 -4px;
  z-index: 100;
}

.handle-grab-box {
  height: 100%;
  width: 4px;
  background: var(--color-border);
  margin: 0 2px;
  transition: background-color 0.2s;
}

.handle:hover .handle-grab-box {
  background: var(--color-primary);
}

div.page-entities-canvas {
  height: 100%;
  border-radius: var(--border-radius-medium);
  overflow: hidden;
}

div.page-entities-canvas-hide {
  display: none;
}

div.page-entities-script {
  height: 100%;
}

div.page-entities-inspector {
  height: 100%;
  overflow-x: auto;
}
</style>
