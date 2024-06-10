<template>
  <div class="entity-subtree">
    <entity-tree-item 
      :conn="conn" 
      :item="item" 
      :depth="depth"
      :selectedItem="selectedItem"
      v-for="item in treeQueryResult"
      @select="selectItem"
      :key="item.name">
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
import { onMounted, onUnmounted, ref, defineProps, defineEmits, computed, watch } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  selectedItem: {type: Object, required: false},
  path: {type: String, required: false, default: "0"},
  depth: {type: Number, required: false, default: 0},
  nameFilter: {type: String, required: false}
});

const emit = defineEmits(['select']);
const items = ref({});
const treeQuery = ref();
const treeQueryResult = ref();

const lineIndent = computed(() => {
  return `margin-left: ${props.depth * 12 - 8}px;`;
});

function selectItem(evt) {
  emit('select', evt);
}

onMounted(() => {
  updateQuery();
});

watch(() => props.nameFilter, () => {
  updateQuery();
});

function updateQuery() {
  if (treeQuery.value) {
    treeQuery.value.abort();
  }

  let filter = props.nameFilter;
  if (filter === undefined || !filter.length) {
    filter = `(flecs.core.ChildOf, ${props.path})`;
  } else {
    filter = `$this ~= "${filter}"`;
  }

  const q = `
    ${filter},
    ?flecs.core.Module, 
    ?flecs.core.Component,
    ?flecs.core.Relationship,
    ?flecs.core.Trait,
    ?flecs.core.Target,
    ?flecs.core.Query,
    ?flecs.core.Prefab, 
    ?flecs.core.Disabled, 
    ?flecs.core.ChildOf(_, $this), 
    ?flecs.core.IsA($this, $base|self),
    ?flecs.doc.Description($this, flecs.core.Name),
    ?flecs.doc.Description($this, flecs.doc.Color)`
    ;

  treeQuery.value = 
    props.conn.query(q, {try: true, rows: true, limit: 1000, managed: true}, (reply) => {
      let sortedItems = [];

      if (!reply.results) {
        reply.results = [];
      }

      for (let item of reply.results) {
        const name = item.name + "";
        const name_esc = name.replaceAll(".", "\\.");
        let path = name_esc;
        if (item.parent) {
          path = item.parent + "." + name_esc
        }

        let treeItem = items.value[path];
        if (treeItem === undefined) {
          treeItem = items.value[path] = {};
        }

        Object.assign(treeItem, item);

        treeItem.path = path;
        treeItem.isModule = item.is_set[1];
        treeItem.isComponent = item.is_set[2] || item.is_set[3] || item.is_set[4];
        treeItem.isTarget = item.is_set[5];
        treeItem.isQuery = item.is_set[6];
        treeItem.isPrefab = item.is_set[7];
        treeItem.isDisabled = item.is_set[8];
        treeItem.isParent = item.is_set[9];
        treeItem.baseEntity = item.is_set[10] ? item.vars["base"] : undefined;

        if (item.is_set[11]) {
          treeItem.label = item.components["(Description,Name)"].value;
        } else {
          treeItem.label = undefined;
        }

        if (item.is_set[12]) {
          treeItem.color = item.components["(Description,Color)"].value;
        } else {
          treeItem.color = undefined;
        }

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
}

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
