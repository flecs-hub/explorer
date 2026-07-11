<template>
  <div id="pane-tree">
    <edit-tabs :items="items" v-model:active_item="appParams.entities.tree_mode" padding="0px;" storageKey="tree" @visibleChanged="onVisibleChanged">
      <template v-for="tab in visibleTabs" :key="tab" v-slot:[tab]>
        <div class="pane-tree-content">
          <div class="pane-tree-search">
            <search-box v-model="nameFilters[tab]"></search-box>
          </div>
          <div class="pane-tree-entity-tree">
            <entity-tree
              :conn="conn"
              :nameFilter="nameFilters[tab]"
              :queryFilter="queryFilterFor(tab)"
              :showButtons="tab !== 'Scripts' && tab !== 'Singletons'"
              @select="item => selectItem(item, tab)"
              :ref="el => setTreeRef(tab, el)">
            </entity-tree>
          </div>
        </div>
      </template>
    </edit-tabs>
  </div>
</template>

<script>
export default { name: "pane-tree" }
</script>

<script setup>
import { computed, defineProps, defineModel, defineExpose, ref, reactive } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
});

const emit = defineEmits(["scriptOpen", "selectEntity"]);
const appParams = defineModel("app_params");
const nameFilters = reactive({});
const activeTabs = ref([]);
const treeRefs = {};

const items = computed(() => {
  let result = [
    { label: "Entities", value: "Entities", canClose: false },
    { label: "Singletons", value: "Singletons", canClose: false },
    { label: "Scripts", value: "Scripts", canClose: false }
  ];

  if (appParams.value.script) {
    result.push({ label: "Outline", value: "Outline", canClose: false });
  }

  return result;
});

const visibleTabs = computed(() => {
  let result = activeTabs.value;
  if (!result.length) {
    result = [appParams.value.entities.tree_mode];
  }
  return result.filter(tab => tab !== undefined);
});

function queryFilterFor(mode) {
  let result = "";

  if (mode === "Outline") {
    let activeScript = appParams.value.script;
    if (activeScript) {
      result = `[none] (flecs.script.Script, ${activeScript})`;
      if (!nameFilters[mode]) {
        result += `, !flecs.script.Script(up, ${activeScript})`;
      }
    } else {
      result = `!_`; // match nothing
    }
  } else if (mode === "Scripts") {
    result = `[none] flecs.script.Script, !flecs.core.Component`;
  } else if (mode === "Singletons") {
    result = `[none] flecs.core.Singleton, !flecs.core.Module`;
  }

  return result;
}

function onVisibleChanged(tabs) {
  activeTabs.value = tabs;
}

function setTreeRef(tab, el) {
  if (el) {
    treeRefs[tab] = el;
  } else {
    delete treeRefs[tab];
  }
}

function selectItem(item, tab) {
  if (item) {
    const selectedTab = tab === "Scripts" ? "Script" : undefined;
    emit("selectEntity", item.queryRef || item.path, selectedTab);
  } else {
    emit("selectEntity", undefined);
  }
}

const unselect = () => {
  for (let tab in treeRefs) {
    treeRefs[tab].unselect();
  }
}

defineExpose({
  unselect
});

</script>

<style scoped>
#pane-tree {
  grid-column: 1;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

div.pane-tree-content {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  min-height: 0;
}

div.pane-tree-search {
  grid-row: 1;
  padding: 8px;
}

div.pane-tree-entity-tree {
  grid-row: 2;
  overflow: auto;
  min-height: 0;
}
</style>
