<template>
  <div class="internals-tables-table">
    <data-table 
      :headers="headers" 
      :data="filteredTables" 
      v-model:filter="filter" 
      show_filter="true"
      @selectItem="onSelectItem">
    </data-table>
  </div>
</template>

<script>
export default { name: "internals-tables-table" };
</script>

<script setup>
import { defineProps, computed, ref } from 'vue';

const props = defineProps({
  tables: {type: Array, required: true}
});

const filter = ref("");
const group = ref(null);

const headers = computed(() => {
  let IdHeader = "ID";
  if (group.value) {
    IdHeader = "Count";
  }
  return [
    {name: IdHeader, schema: ["table-id"], get: (table) => table.id},
    {name: "Entities", schema: ["int"], totals: true, get: (table) => table.count},
    {name: "Capacity", schema: ["int"], totals: true, get: (table) => table.size},
    {name: "Columns", schema: ["int"], get: (table) => table.type.length},
    {name: "Memory (KB)", schema: ["float"], totals: true, get: (table) => {
      if (!table.memory) {
        return 0;
      }
      if (typeof table.memory === "number") {
        return table.memory / 1000;
      }
      return ((explorer.calculateMemoryTotal(table.memory.table) +
        explorer.calculateMemoryTotal(table.memory.components)) / 1000);
    }},
    {name: "Components", list: true, get: (table) => formatType(table.type)},
  ];
});

const searchableType = computed(() => {
  return props.tables.map((table) => {
    return formatType(table.type).join("").split(" ").join("").toLowerCase();
  });
});

const filteredTables = computed(() => {
  let tables = props.tables;
  if (filter.value && filter.value.length > 0) {
    const F = filter.value.toLowerCase().split(" ").join("").split(",");
    tables = tables.filter((table, index) => {
      const v = searchableType.value[index];
      for (let f of F) {
        if (!v.includes(f)) {
          return false;
        }
      }
      return true;
    });
  }

  if (group.value) {
    // create map for group strings
    let groups = {};

    for (let table of tables) {
      for (let i = 0; i < table.type.length; i++) {
        const id = table.type[i];
        if (id.includes(group.value)) {
          let copy = table.type.slice();
          copy[i] = "(" + group.value + "," + "*)";

          const key = copy.join(", ");
          let val = groups[key];
          if (!val) {
            val = groups[key] = {id: 0, count: 0, size: 0, memory: 0, type: copy};
          }
          val.id ++;
          val.count += table.count;
          val.size += table.size;
          val.memory += explorer.calculateMemoryTotal(table.memory.table);
          val.memory += explorer.calculateMemoryTotal(table.memory.components);
          break;
        }
      }
    }

    tables = Object.values(groups);
  }

  return tables;
});

function formatType(type) {
  let result = [];

  for (let id of type) {
    let str = explorer.shortenComponent(id);
    result.push(str);
  }

  return result;
}

function onSelectItem(evt) {
  const pair = explorer.parsePair(evt.item);
  if (!pair) {
    return;
  }

  if (pair[1] === "*") {
    group.value = undefined;
    return;
  }

  group.value = pair[0];
}

</script>

<style scoped>

div.internals-tables-table {
  padding: 4px;
  height: calc(100% - 8px);
}

</style>

<style>

.value-table-type {
  min-width: 1000px;
  white-space: normal !important;
  color: var(--secondary-text);
}

</style>
