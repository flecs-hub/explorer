<template>
  <div id="pane-tree">
    <edit-tabs :items="items" v-model:active_item="appParams.entities.tree_mode" padding="0px;">
      <template v-slot:[appParams.entities.tree_mode]>
        <div class="pane-tree-content">
          <div class="pane-tree-search">
            <search-box v-model="nameFilter"></search-box>
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
    </edit-tabs>
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

const items = computed(() => {
  let result = [
    { label: "Entities", value: "Entities", canClose: false },
    { label: "Scripts", value: "Scripts", canClose: false }
  ];

  if (appParams.value.script) {
    result.push({ label: "Outline", value: "Outline", canClose: false });
  }

  return result;
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
    emit("selectEntity", item.queryRef || item.path);
  } else {
    emit("selectEntity", undefined);
  }
}

const unselect = () => {
  if (entity_tree.value) {
    entity_tree.value.unselect();
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
