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

    <div :class="inspectorCss" :style="`grid-column: ${inspectorColumn}`" ref="inspectorEl">
      <div class="page-entities-inspector-column"
        :class="{'page-entities-inspector-column-vsplit': appParams.entities.split}"
        :style="inspectorColumnStyle(0)"
        ref="column0El">
        <div class="page-entities-inspector-pane"
          :style="inspectorPaneStyle(0, 0)"
          @mousedown.capture="setActiveInspector('main')">
          <entity-inspector
            :conn="conn"
            :path="appParams.entities.path"
            :canSplit="!appParams.entities.split"
            :canSplitH="!appParams.entities.hsplit_main"
            storageKey="inspector-main"
            :inactive="inspectorInactive('main')"
            v-model:app_params="appParams.entities"
            @close="onCloseInspector('main')"
            @split="onSplitV('main')"
            @splitH="onSplitH"
            @onCodeChange="onCodeChange"
            @scriptOpen="onScriptOpen"
            @queryOpen="onQueryOpen"
            @selectEntity="onSelectEntity">
          </entity-inspector>
        </div>
        <splitter
          v-if="appParams.entities.split"
          horizontal
          :active="rootEl?.dragging === 'inspectorVSplit0'"
          @mousedown="startInspectorVDrag(0)">
        </splitter>
        <div class="page-entities-inspector-pane"
          v-if="appParams.entities.split"
          :style="inspectorPaneStyle(0, 1)"
          @mousedown.capture="setActiveInspector('split')">
          <entity-inspector
            :conn="conn"
            :path="appParams.entities.split_path"
            :app_params="splitInspectorParams"
            storageKey="inspector-split"
            :inactive="inspectorInactive('split')"
            @close="onCloseInspector('split')"
            @onCodeChange="onCodeChange"
            @scriptOpen="onScriptOpen"
            @queryOpen="onQueryOpen"
            @selectEntity="onSelectEntity">
          </entity-inspector>
        </div>
      </div>
      <splitter
        v-if="appParams.entities.hsplit_main"
        :active="rootEl?.dragging === 'inspectorSplit'"
        @mousedown="startInspectorDrag">
      </splitter>
      <div class="page-entities-inspector-column"
        v-if="appParams.entities.hsplit_main"
        :class="{'page-entities-inspector-column-vsplit': appParams.entities.split2}"
        :style="inspectorColumnStyle(1)"
        ref="column1El">
        <div class="page-entities-inspector-pane"
          :style="inspectorPaneStyle(1, 0)"
          @mousedown.capture="setActiveInspector('main2')">
          <entity-inspector
            :conn="conn"
            :path="appParams.entities.main2_path"
            :canSplit="!appParams.entities.split2"
            storageKey="inspector-main2"
            :app_params="main2InspectorParams"
            :inactive="inspectorInactive('main2')"
            @close="onCloseInspector('main2')"
            @split="onSplitV('main2')"
            @onCodeChange="onCodeChange"
            @scriptOpen="onScriptOpen"
            @queryOpen="onQueryOpen"
            @selectEntity="onSelectEntity">
          </entity-inspector>
        </div>
        <splitter
          v-if="appParams.entities.split2"
          horizontal
          :active="rootEl?.dragging === 'inspectorVSplit1'"
          @mousedown="startInspectorVDrag(1)">
        </splitter>
        <div class="page-entities-inspector-pane"
          v-if="appParams.entities.split2"
          :style="inspectorPaneStyle(1, 1)"
          @mousedown.capture="setActiveInspector('split2')">
          <entity-inspector
            :conn="conn"
            :path="appParams.entities.split2_path"
            :app_params="split2InspectorParams"
            storageKey="inspector-split2"
            :inactive="inspectorInactive('split2')"
            @close="onCloseInspector('split2')"
            @onCodeChange="onCodeChange"
            @scriptOpen="onScriptOpen"
            @queryOpen="onQueryOpen"
            @selectEntity="onSelectEntity">
          </entity-inspector>
        </div>
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
  const entities = appParams.value.entities;
  if (!entities.path && !entities.split && !entities.hsplit_main) {
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

const inspectorSlots = {
  main:   {path: "path",        tab: "inspector_tab",        detail: "low_detail"},
  main2:  {path: "main2_path",  tab: "main2_inspector_tab",  detail: "main2_low_detail"},
  split:  {path: "split_path",  tab: "split_inspector_tab",  detail: "split_low_detail"},
  split2: {path: "split2_path", tab: "split2_inspector_tab", detail: "split2_low_detail"}
};

function makeInspectorParams(which) {
  const keys = inspectorSlots[which];
  return {
    get path() { return appParams.value.entities[keys.path]; },
    set path(value) { appParams.value.entities[keys.path] = value; },
    get inspector_tab() { return appParams.value.entities[keys.tab]; },
    set inspector_tab(value) { appParams.value.entities[keys.tab] = value; },
    get low_detail() { return appParams.value.entities[keys.detail]; },
    set low_detail(value) { appParams.value.entities[keys.detail] = value; }
  };
}

const main2InspectorParams = makeInspectorParams("main2");
const splitInspectorParams = makeInspectorParams("split");
const split2InspectorParams = makeInspectorParams("split2");

function inspectorVisible(which) {
  const entities = appParams.value.entities;
  if (which === "main2") return entities.hsplit_main;
  if (which === "split") return entities.split;
  if (which === "split2") return entities.hsplit_main && entities.split2;
  return which === "main";
}

function activeInspector() {
  const which = appParams.value.entities.active_inspector;
  return inspectorVisible(which) ? which : "main";
}

function inspectorCount() {
  const entities = appParams.value.entities;
  let count = 1;
  if (entities.split) count++;
  if (entities.hsplit_main) count++;
  if (entities.hsplit_main && entities.split2) count++;
  return count;
}

function onSplitV(which) {
  const entities = appParams.value.entities;
  if (which === "main") {
    entities.split = true;
    entities.split_path = entities.path;
    entities.split_inspector_tab = "Inspect";
    entities.split_low_detail = false;
  } else {
    entities.split2 = true;
    entities.split2_path = entities.main2_path;
    entities.split2_inspector_tab = "Inspect";
    entities.split2_low_detail = false;
  }
  entities.active_inspector = which;
}

function onSplitH() {
  const entities = appParams.value.entities;

  // Measure the existing inspector so it keeps its size after the split. The
  // new inspector is added next to it with an equal width, growing the total
  // area occupied by the inspectors rather than shrinking the existing one.
  const existingWidth = column0El.value.getBoundingClientRect().width;
  const gap = parseFloat(getComputedStyle(inspectorEl.value).gap) || 0;

  inspectorSplitRatio.value = 0.5;
  localStorage.setItem('page-entities.inspectorSplitRatio', '0.5');

  entities.hsplit_main = true;
  entities.main2_path = entities.path;
  entities.main2_inspector_tab = "Inspect";
  entities.main2_low_detail = false;
  entities.active_inspector = "main";

  rootEl.value.setRightPaneWidth(existingWidth * 2 + gap);
}

function setActiveInspector(which) {
  appParams.value.entities.active_inspector = which;
}

function inspectorInactive(which) {
  return inspectorCount() > 1 && activeInspector() !== which;
}

function moveInspector(dst, src) {
  const entities = appParams.value.entities;
  entities[inspectorSlots[dst].path] = entities[inspectorSlots[src].path];
  entities[inspectorSlots[dst].tab] = entities[inspectorSlots[src].tab];
  entities[inspectorSlots[dst].detail] = entities[inspectorSlots[src].detail];
}

function clearInspector(which) {
  const entities = appParams.value.entities;
  entities[inspectorSlots[which].path] = undefined;
  entities[inspectorSlots[which].tab] = "Inspect";
  entities[inspectorSlots[which].detail] = false;
}

function onCloseInspector(which) {
  const entities = appParams.value.entities;

  // When closing a horizontally-split inspector, shrink the total area back to
  // the remaining column's current width so it keeps its size.
  let remainingColumn = null;
  if (which === "main" && !entities.split && entities.hsplit_main) {
    remainingColumn = column1El.value;
  } else if (which === "main2" && !entities.split2 && entities.hsplit_main) {
    remainingColumn = column0El.value;
  }
  const remainingWidth = remainingColumn ?
    remainingColumn.getBoundingClientRect().width : null;

  if (which === "main") {
    if (entities.split) {
      moveInspector("main", "split");
      entities.split = false;
      clearInspector("split");
      if (entities.active_inspector === "split") {
        entities.active_inspector = "main";
      }
    } else if (entities.hsplit_main) {
      moveInspector("main", "main2");
      if (entities.split2) {
        moveInspector("split", "split2");
      }
      entities.split = entities.split2;
      entities.hsplit_main = false;
      entities.split2 = false;
      clearInspector("main2");
      clearInspector("split2");
      if (entities.active_inspector === "main2") {
        entities.active_inspector = "main";
      } else if (entities.active_inspector === "split2") {
        entities.active_inspector = "split";
      }
    } else {
      clearInspector("main");
    }
  } else if (which === "main2") {
    if (entities.split2) {
      moveInspector("main2", "split2");
      entities.split2 = false;
      clearInspector("split2");
      if (entities.active_inspector === "split2") {
        entities.active_inspector = "main2";
      }
    } else {
      entities.hsplit_main = false;
      clearInspector("main2");
    }
  } else if (which === "split") {
    entities.split = false;
    clearInspector("split");
  } else if (which === "split2") {
    entities.split2 = false;
    clearInspector("split2");
  }

  if (!inspectorVisible(entities.active_inspector)) {
    entities.active_inspector = "main";
  }

  if (remainingWidth != null) {
    rootEl.value.setRightPaneWidth(remainingWidth);
  }

  if (!entities.path && inspectorCount() === 1) {
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
  const keys = inspectorSlots[activeInspector()];
  entities[keys.path] = path;
  if (tab) {
    entities[keys.tab] = tab;
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

const inspectorEl = ref(null);
const inspectorSplitRatio = ref(
  Number(localStorage.getItem('page-entities.inspectorSplitRatio')) || 0.5);

function startInspectorDrag() {
  const rect = inspectorEl.value.getBoundingClientRect();
  rootEl.value.startDragging('inspectorSplit', (e) => {
    let ratio = (e.clientX - rect.left) / rect.width;
    ratio = Math.max(0.15, Math.min(0.85, ratio));
    inspectorSplitRatio.value = ratio;
    localStorage.setItem('page-entities.inspectorSplitRatio', String(ratio));
  });
}

function inspectorColumnStyle(index) {
  if (!appParams.value.entities.hsplit_main) {
    return '';
  }
  const ratio = index === 0 ?
    inspectorSplitRatio.value : 1 - inspectorSplitRatio.value;
  return `flex: ${ratio} 1 0%`;
}

const column0El = ref(null);
const column1El = ref(null);
const inspectorVSplitRatio = ref([
  Number(localStorage.getItem('page-entities.inspectorVSplitRatio0')) || 0.5,
  Number(localStorage.getItem('page-entities.inspectorVSplitRatio1')) || 0.5]);

function startInspectorVDrag(index) {
  const columnEl = index === 0 ? column0El.value : column1El.value;
  const rect = columnEl.getBoundingClientRect();
  rootEl.value.startDragging('inspectorVSplit' + index, (e) => {
    let ratio = (e.clientY - rect.top) / rect.height;
    ratio = Math.max(0.15, Math.min(0.85, ratio));
    inspectorVSplitRatio.value[index] = ratio;
    localStorage.setItem('page-entities.inspectorVSplitRatio' + index, String(ratio));
  }, 'row-resize');
}

function inspectorPaneStyle(columnIndex, paneIndex) {
  const split = columnIndex === 0 ?
    appParams.value.entities.split : appParams.value.entities.split2;
  if (!split) {
    return '';
  }
  const ratio = paneIndex === 0 ?
    inspectorVSplitRatio.value[columnIndex] : 1 - inspectorVSplitRatio.value[columnIndex];
  return `flex: ${ratio} 1 0%`;
}

const inspectorCss = computed(() => {
  let classes = ["page-entities-inspector"];
  if (appParams.value.entities.hsplit_main) {
    classes.push("page-entities-inspector-hsplit");
  }
  return classes;
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
  flex-direction: row;
  gap: var(--gap);
  min-width: 0;
  min-height: 0;
}

div.page-entities-inspector-hsplit {
  gap: 0;
}

div.page-entities-inspector-hsplit > div.vsplitter {
  margin: 0 1px;
}

div.page-entities-inspector-column {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  min-width: 0;
  min-height: 0;
}

div.page-entities-inspector-column-vsplit {
  gap: 0;
}

div.page-entities-inspector-column-vsplit > div.hsplitter {
  margin: 1px 0;
}

div.page-entities-inspector-pane {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  overflow-x: auto;
  border-radius: var(--border-radius-medium);
}

</style>
