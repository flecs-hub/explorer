<template>
  <div id="pane-tree" class="ace-github-dark">
    <div class="pane-tree-search-box">
      <search-box v-model="nameFilter"></search-box>
    </div>
    <div class="pane-tree-entity-tree">
      <entity-tree 
        :conn="conn" 
        :nameFilter="nameFilter"
        @select="selectItem">
      </entity-tree>
    </div>
  </div>
</template>

<script>
export default { name: "pane-tree" }
</script>

<script setup>
import { defineProps, defineModel, ref } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
});

const appState = defineModel("app_state");
const nameFilter = ref();

function selectItem(item) {
  if (item) {
    appState.value.entity.path = item.path;
  } else {
    appState.value.entity.path = undefined;
  }
}

</script>

<style scoped>
#pane-tree {
  display: grid;
  grid-column: 1;
  grid-template-rows: 36px 1rem;
  gap: 0.5rem;
  border-radius: var(--border-radius-medium);
}

div.pane-tree-search-box {
  grid-row: 1;
  padding: 8px;
}

div.pane-tree-entity-tree {
  grid-row: 2;
  /* grid-template-rows: calc(100vh - 9rem); */
  height: calc(100vh - 36px - 8px - 3.5rem);
  overflow: auto;
}

</style>
