<template>
  <div id="pane-tree" class="pane">
    <div class="pane-tree-search-box">
      <div class="pane-tree-select">
        <dropdown 
          :items="treeModeItems" 
          v-model:active_item="appParams.entities.tree_mode">
        </dropdown>
      </div>
      <div class="pane-tree-search">
        <search-box v-model="nameFilter"></search-box>
      </div>
    </div>
    <div class="pane-tree-entity-tree">
      <entity-tree 
        :conn="conn" 
        :nameFilter="nameFilter"
        :queryFilter="queryFilter"
        @select="selectItem"
        ref="entity_tree">
      </entity-tree>
    </div>
  </div>
</template>

<script>
export default { name: "pane-tree" }
</script>

<script setup>
import { computed, defineProps, defineModel, defineExpose, ref } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
});

const emit = defineEmits(["scriptOpen", "selectEntity"]);
const appParams = defineModel("app_params");
const nameFilter = ref();
const entity_tree = ref(null);

const treeModeItems = computed(() => {
  if (appParams.value.script) {
    return ['Entities', 'Scripts', 'Outline'];
  } else {
    return ['Entities', 'Scripts'];
  }
});

const queryFilter = computed(() => {
  let result = "";

  if (appParams.value.entities.tree_mode === "Outline") {
    let activeScript = appParams.value.script;
    if (activeScript) {
      result = `[none] (flecs.script.Script, ${activeScript})`;
      if (!nameFilter.value) {
        result += `, !flecs.script.Script(up, ${activeScript})`;
      }
    } else {
      result = `!_`; // match nothing
    }
  } else if (appParams.value.entities.tree_mode === "Scripts") {
    result = `[none] flecs.script.Script, !flecs.core.Component`;
  }

  return result;
});

function selectItem(item) {
  if (item) {
    let path = item.path;
    const idStart = path.indexOf("#");
    if (idStart != -1) {
      path = path.slice(idStart, path.length);
    }

    emit("selectEntity", path);
  } else {
    emit("selectEntity", undefined);
  }
}

const unselect = () => {
  entity_tree.value.unselect();
}

defineExpose({
  unselect
});

</script>

<style scoped>
#pane-tree {
  display: grid;
  grid-column: 1;
  grid-template-rows: calc(72px + var(--gap)) 1rem;
  gap: 0.5rem;
}

div.pane-tree-search-box {
  grid-row: 1;
  padding: 8px;

  display: grid;
  grid-template-rows: 36px 36px;
  gap: var(--gap);
}

div.pane-tree-entity-tree {
  grid-row: 2;
  height: calc(100vh - 72px - 8px - var(--header-height) - var(--footer-height) - 4 * var(--gap));
  overflow: auto;
}

div.pane-tree-select {
  grid-row: 1;
}

div.pane-tree-select div.dropdown {
  width: 100%;
}

div.pane-tree-search {
  grid-row: 2;
}

</style>
