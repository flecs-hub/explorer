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
      <div class="handle" v-if="app_params.sidebar" @mousedown="(e) => startResize('sidebar', e)">
        <div class="handle-grab-box"></div>
      </div>

      <div class="split-pane main-pane" :style="{ width: mainWidth + 'px' }">
        <div id="canvasPlaceholder" :class="canvasCss" v-if="showCanvas" ref="canvasPlaceholderRef">
        </div>
      </div>

      <div class="handle" v-if="showInspector || showScript" @mousedown="(e) => startResize('inspector', e)">
        <div class="handle-grab-box"></div>
      </div>

      <div class="split-pane" v-if="showInspector || showScript" :style="{ width: inspectorWidth + 'px' }">
        <pane-inspector
          v-if="showInspector"
          :conn="conn"
          :app_params="appParams"
          @abort="onAbort"
          @scriptOpen="onScriptOpen">
        </pane-inspector>
        <div :class="scriptCss" v-if="showScript">
          <pane-scripts
            :conn="conn"
            v-model:script="appParams.script"
            v-model:scripts="appParams.scripts"
            ref="pane_scripts">
          </pane-scripts>
        </div>
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

const canvasPlaceholderRef = ref(null);
let resizeObserver = null;

const showScript = computed(() => {
  if (!appParams.value.script) {
    return false;
  }
  return true;
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
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        var resizeEvent = new Event('resize');
        window.dispatchEvent(resizeEvent);
      });
    });
  });
});

function onAbort(evt) {
  appParams.value.entity.path = undefined;
}

function onScriptOpen(path) {
  appParams.value.entity.path = undefined;

  appParams.value.script = path;
  if (!appParams.value.scripts.includes(path)) {
    appParams.value.scripts.push(path);
  }

  pane_scripts.value.openScript(path);
}

function onEntityOpen(path) {
  if (props.app_state.has3DCanvas) {
    appParams.value.script = undefined;
    appParams.value.scripts.length = 0;
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

const getMinWidth = (defaultMin, totalWidth) => {
  if (totalWidth < 600) {
    return Math.min(defaultMin, totalWidth * 0.15); // Smaller min % on very small screens
  } else if (totalWidth < 1000) {
    return Math.min(defaultMin, totalWidth * 0.20);
  }
  return defaultMin;
};

const minSidebarWidth = computed(() => getMinWidth(200, window.innerWidth));
const minInspectorWidth = computed(() => getMinWidth(300, window.innerWidth));
const minMainWidth = computed(() => getMinWidth(200, window.innerWidth)); // Minimum width for the main canvas area

const mainWidth = computed(() => {
  const totalWidth = window.innerWidth;
  let width = totalWidth;
  if (appParams.value.sidebar) {
    width -= sidebarWidth.value;
  }
  if (showInspector.value || showScript.value) {
    width -= inspectorWidth.value;
  }
  return Math.max(minMainWidth.value, width); // Ensure mainWidth respects its minimum
});

const sidebarRatio = ref(sidebarWidth.value / window.innerWidth);
const inspectorRatio = ref(inspectorWidth.value / window.innerWidth);

let isResizing = false;
let currentHandle = null;
let initialMouseX = 0;
let initialSidebarWidth = 0;
let initialInspectorWidth = 0;

function startResize(handle, e) {
  isResizing = true;
  currentHandle = handle;
  initialMouseX = e.clientX;
  initialSidebarWidth = sidebarWidth.value;
  initialInspectorWidth = inspectorWidth.value;

  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.body.classList.add('noselect');
  document.body.style.cursor = 'col-resize';
}

function handleResize(e) {
  if (!isResizing) return;

  const totalWidth = window.innerWidth;
  let deltaX = e.clientX - initialMouseX;

  if (currentHandle === 'sidebar') {
    const minWidth = minSidebarWidth.value;
    const maxSidebarWidth = totalWidth - minMainWidth.value - (showInspector.value || showScript.value ? minInspectorWidth.value : 0);
    let newWidth = initialSidebarWidth + deltaX;

    newWidth = Math.max(minWidth, Math.min(maxSidebarWidth, newWidth));

    sidebarWidth.value = newWidth;
    sidebarRatio.value = sidebarWidth.value / totalWidth;

  } else if (currentHandle === 'inspector') {
    const minWidth = minInspectorWidth.value;
    const maxInspectorWidth = totalWidth - minMainWidth.value - (appParams.value.sidebar ? minSidebarWidth.value : 0);
    let newWidth = initialInspectorWidth - deltaX;

    newWidth = Math.max(minWidth, Math.min(maxInspectorWidth, newWidth));

    inspectorWidth.value = newWidth;
    inspectorRatio.value = inspectorWidth.value / totalWidth;
  }

  window.dispatchEvent(new Event('resize'));
}

function stopResize() {
  isResizing = false;
  currentHandle = null;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.classList.remove('noselect');
  document.body.style.cursor = '';

  const handles = document.querySelectorAll('.handle-grab-box');
  handles.forEach(handle => {
    handle.style.width = '4px';
    handle.style.backgroundColor = 'var(--color-border)';
  });
}

onMounted(() => {
  const totalWidth = window.innerWidth;

  nextTick(() => {
    let initialSidebar = totalWidth * sidebarRatio.value;
    let initialInspector = totalWidth * inspectorRatio.value;

    sidebarWidth.value = appParams.value.sidebar ? Math.max(minSidebarWidth.value, initialSidebar) : 0;
    inspectorWidth.value = (showInspector.value || showScript.value) ? Math.max(minInspectorWidth.value, initialInspector) : 0;

    let currentTotal = sidebarWidth.value + inspectorWidth.value + minMainWidth.value;
    if (currentTotal > totalWidth) {
        let overage = currentTotal - totalWidth;
        let sidebarReduction = 0;
        let inspectorReduction = 0;
        let sidebarCanReduce = sidebarWidth.value - minSidebarWidth.value;
        let inspectorCanReduce = inspectorWidth.value - minInspectorWidth.value;

        if (sidebarCanReduce + inspectorCanReduce >= overage) {
            let totalReducible = sidebarCanReduce + inspectorCanReduce;
            sidebarReduction = (totalReducible > 0) ? overage * (sidebarCanReduce / totalReducible) : 0;
            inspectorReduction = (totalReducible > 0) ? overage * (inspectorCanReduce / totalReducible) : 0;
        } else {
            sidebarReduction = sidebarCanReduce;
            inspectorReduction = inspectorCanReduce;
        }

        sidebarWidth.value -= sidebarReduction;
        inspectorWidth.value -= inspectorReduction;
    }

    sidebarRatio.value = sidebarWidth.value / totalWidth;
    inspectorRatio.value = inspectorWidth.value / totalWidth;

    window.dispatchEvent(new Event('resize'));
  });

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(entries => {
      window.dispatchEvent(new Event('resize'));
    });

    nextTick(() => {
      if (canvasPlaceholderRef.value) {
        resizeObserver.observe(canvasPlaceholderRef.value);
      }
    });

    watch(canvasPlaceholderRef, (newValue) => {
      if (newValue) {
        resizeObserver.observe(newValue);
      } else {
      }
    });
  } else {
    console.warn("ResizeObserver not supported, canvas resizing on sidebar toggle might be imperfect.");
  }

  window.addEventListener('resize', () => {
    if (!isResizing) {
      const totalWidth = window.innerWidth;
      let targetSidebar = totalWidth * sidebarRatio.value;
      let targetInspector = totalWidth * inspectorRatio.value;

      sidebarWidth.value = appParams.value.sidebar ? Math.max(minSidebarWidth.value, targetSidebar) : 0;
      inspectorWidth.value = (showInspector.value || showScript.value) ? Math.max(minInspectorWidth.value, targetInspector) : 0;

      // Recalculate to ensure main pane minimum width is respected after resize
      let currentTotal = sidebarWidth.value + inspectorWidth.value + minMainWidth.value;
      if (currentTotal > totalWidth) {
          let overage = currentTotal - totalWidth;
          let sidebarReduction = 0;
          let inspectorReduction = 0;
          let sidebarCanReduce = sidebarWidth.value - minSidebarWidth.value;
          let inspectorCanReduce = inspectorWidth.value - minInspectorWidth.value;

          if (sidebarCanReduce + inspectorCanReduce >= overage) {
              let totalReducible = sidebarCanReduce + inspectorCanReduce;
              sidebarReduction = (totalReducible > 0) ? overage * (sidebarCanReduce / totalReducible) : 0;
              inspectorReduction = (totalReducible > 0) ? overage * (inspectorCanReduce / totalReducible) : 0;
          } else {
              sidebarReduction = sidebarCanReduce;
              inspectorReduction = inspectorCanReduce;
          }
          sidebarWidth.value -= sidebarReduction;
          inspectorWidth.value -= inspectorReduction;
      }
    }
  });
});

onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
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

.main-pane {
  display: flex;
  flex-direction: column;
}

.handle {
  flex: 0 0 var(--gap);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  cursor: col-resize;
  position: relative;
  z-index: 10;
}

.handle-grab-box {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  background: var(--color-border);
  transition: width 0.2s, background-color 0.2s;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  cursor: col-resize;
}

.handle:hover .handle-grab-box {
  background: var(--color-primary);
  width: 6px;
}

div.page-entities-canvas {
  height: 100%;
  width: 100%;
  border-radius: var(--border-radius-medium);
  overflow: hidden;
}

div.page-entities-canvas-hide {
  display: none;
}

div.page-entities-script {
  height: 100%;
  display: flex;
  flex-direction: column;
}

div.page-entities-inspector {
  height: 100%;
  overflow-x: auto;
}
</style>
