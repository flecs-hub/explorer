<template>
  <div class="internals-tables-table">
    <data-table 
      :headers="headers" 
      :data="filteredTables" 
      v-model:filter="filter" 
      show_filter="true">
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

const headers = computed(() => {
  return [
    {name: "ID", schema: ["table-id"], get: (table) => table.id},
    {name: "Entities", schema: ["int"], totals: true, get: (table) => table.count},
    {name: "Capacity", schema: ["int"], totals: true, get: (table) => table.size},
    {name: "Columns", schema: ["int"], get: (table) => table.type.length},
    {name: "Memory (KB)", schema: ["float"], totals: true, get: (table) => {
      if (!table.memory) {
        return 0;
      }
      return ((explorer.calculateMemoryTotal(table.memory.table) +
        explorer.calculateMemoryTotal(table.memory.components)) / 1000);
    }},
    {name: "Components", schema: ["table-type"],get: (table) => formatType(table.type)},
  ];
});

const searchableType = computed(() => {
  return props.tables.map((table) => {
    return formatType(table.type).toLowerCase().split(" ").join("");
  });
});

const filteredTables = computed(() => {
  if (filter.value && filter.value.length > 0) {
    const F = filter.value.toLowerCase().split(" ").join("").split(",");
    return props.tables.filter((table, index) => {
      const v = searchableType.value[index];
      for (let f of F) {
        if (!v.includes(f)) {
          return false;
        }
      }
      return true;
    });
  }
  return props.tables;
});

function formatType(type) {
  let result = [];

  for (let id of type) {
    let str = explorer.shortenComponent(id);
    result.push(str);
  }

  return result.join(", ");;
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
