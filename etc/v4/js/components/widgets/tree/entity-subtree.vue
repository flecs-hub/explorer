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
    <template v-if="path !== '#0'">
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
  path: {type: String, required: false, default: "#0"},
  depth: {type: Number, required: false, default: 0},
  nameFilter: {type: String, required: false},
  queryFilter: {type: String, required: false}
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

watch(() => [props.nameFilter, props.queryFilter], () => {
  updateQuery();
});

function updateQuery() {
  if (treeQuery.value) {
    treeQuery.value.abort();
  }

  let q = `
    [none] ?flecs.core.Module, 
    [none] ?flecs.core.Component,
    [none] ?flecs.core.Relationship,
    [none] ?flecs.core.Trait,
    [none] ?flecs.core.Target,
    [none] ?flecs.core.Query,
    [none] ?flecs.core.Prefab, 
    [none] ?flecs.core.Disabled, 
    [none] ?flecs.core.ChildOf(_, $this), 
    [none] ?flecs.core.IsA($this, $base|self)`
    ;

  let nf = props.nameFilter ? props.nameFilter : undefined;
  let qf = props.queryFilter ? props.queryFilter : undefined;

  if (!nf && !qf) {
    let path = props.path;
    if (path) {
      path = path.replaceAll(" ", "\\ ");
      q += `, (flecs.core.ChildOf, ${path})`;
    }
  }

  if (qf) {
    q += `, ${qf}`
  }

  if (nf) {
    q += `, $this ~= "${nf}"`;
  }

  treeQuery.value = 
    props.conn.query(q, {
      try: true, 
      rows: true, 
      limit: 1000, 
      doc: true,
      managed: true,
      persist: props.path === "0" // persist root query across reconnects
    },
    (reply) => {
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
        treeItem.isModule = item.fields.is_set[0];
        treeItem.isComponent = item.fields.is_set[1] || item.fields.is_set[2] || item.fields.is_set[3];
        treeItem.isTarget = item.fields.is_set[4];
        treeItem.isQuery = item.fields.is_set[5];
        treeItem.isPrefab = item.fields.is_set[6];
        treeItem.isDisabled = item.fields.is_set[7];
        treeItem.isParent = item.fields.is_set[8];
        treeItem.baseEntity = item.fields.is_set[9] ? item.vars["base"] : undefined;

        if (item.doc) {
          treeItem.label = item.doc.label;
          treeItem.color = item.doc.color;
        } else {
          treeItem.label = undefined;
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
    }, (err) => {}, () => {
      treeQueryResult.value = [];
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
