<template>
  <div class="entity-subtree">
    <entity-tree-item 
      :conn="conn" 
      :item="item" 
      :depth="depth"
      :selectedItem="selectedItem"
      :key="'entity-tree-item-' + item.path"
      v-for="item in treeQueryResult"
      @select="selectItem">
    </entity-tree-item>
    <template v-if="path !== '0'">
      <div class="entity-tree-vertical-line" :style="lineIndent"></div>
    </template>
  </div>
</template>

<script>
export default { name: "entity-subtree" }
</script>

<script setup>
import { onMounted, onUnmounted, ref, defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  selectedItem: {type: Object, required: false},
  path: {type: String, required: false, default: "0"},
  depth: {type: Number, required: false, default: 0}
});

const emit = defineEmits(['select']);
const items = ref({});

const lineIndent = computed(() => {
  return `margin-left: ${props.depth * 12 - 8}px;`;
});

function selectItem(evt) {
  emit('select', evt);
}

const treeQuery = ref();
const treeQueryResult = ref();

onMounted(() => {
  const q = `
    (ChildOf, ${props.path}), 
    ?Module, 
    ?Component, 
    ?Prefab, 
    ?Disabled, 
    ?ChildOf(_, $this), 
    ?IsA($this, $base|self)`
    ;

  treeQuery.value = 
    props.conn.query(q, {try: true, rows: true, limit: 1000, poll_interval: 1000}, (reply) => {
      let sortedItems = [];

      for (let item of reply.results) {
        const name = item.name + "";
        const name_esc = name.replaceAll(".", "\\.");
        let path = name_esc;
        if (item.parent) {
          path = item.parent + "." + name_esc
        }

        let treeItem = items[path];
        if (treeItem === undefined) {
          treeItem = items[path] = {};
        }

        Object.assign(treeItem, item);

        treeItem.path = path;
        treeItem.isModule = item.is_set[1];
        treeItem.isComponent = item.is_set[2];
        treeItem.isPrefab = item.is_set[3];
        treeItem.isDisabled = item.is_set[4];
        treeItem.isParent = item.is_set[5];
        treeItem.baseEntity = item.is_set[6] ? item.vars["base"] : undefined;
        sortedItems.push(treeItem);
      }

      sortedItems.sort((a, b) => {
        if (a.isModule == b.isModule) {
          if (a.isParent == b.isParent) {
            if (a.label) {
              return a.label.localeCompare(b.label);
            } else {
              return a.name.localeCompare(b.name);
            }
          } else if (a.isParent) {
            return -1;
          } else {
            return 1;
          }
        } else if (a.isModule) {
          return -1;
        } else {
          return 1;
        }
      });

      treeQueryResult.value = sortedItems;
    });
});

onUnmounted(() => {
  treeQuery.value.abort();
});

</script>

<style scoped>
div.entity-subtree {
  position: relative;
}

div.entity-tree-vertical-line {
  position: absolute;
  top: 2px;
  left: 4px;
  min-width: 1px;
  height: calc(100% - 4px);
  background-color: white;
  opacity: 0.2;
}

</style>
