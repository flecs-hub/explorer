<template>
  <div class="internals-queries-table">
    <data-table :headers="headers" :data="filteredComponents" v-model:filter="filter" show_filter="true" :selectable="true"
      @refresh="onRefresh"
      @select="onSelect">
    </data-table>
  </div>
</template>

<script>
export default { name: "internals-queries-table" };
</script>

<script setup>
import { defineProps, computed, ref, defineEmits, defineModel } from 'vue';

const props = defineProps({
  queries: {type: Array, required: true}
});

const filter = ref("");
const emit = defineEmits(["refresh", "select"]);

const headers = computed(() => {
  return [
    {name: "Name", schema: ["entity"], get: (query) => query.name, icon: (query) => explorer.queryIcon(query.kind)},
    {name: "Results", schema: ["int"], get: (query) => query.results },
    {name: "Count", schema: ["int"], get: (query) => query.count },
    {name: "Cache kind", schema: ["enum"], get: (query) => query.cache_kind },
    {name: "Eval mode", schema: ["enum"], get: (query) => query.eval_mode },
    {name: "Eval count", schema: ["int"], get: (query) => query.eval_count },
    {name: "Eval time (us)", schema: ["float"], get: (query) => query.eval_time * 1000 * 1000 },
    {name: "Memory (KB)", schema: ["float"], totals: true, get: (query) => {
      if (!query.memory) {
        return 0;
      }
      return explorer.calculateMemoryTotal(query.memory) / 1000;
    }}
  ];
});

const searchableName = computed(() => {
  return props.queries.map((query) => {
    let name = query.name;
    if (!query.name) {
      name = query.expr;
    }
    return name.toLowerCase().split(" ").join("");
  });
});

const filteredComponents = computed(() => {
  if (filter.value && filter.value.length > 0) {
    const F = filter.value.toLowerCase().split(" ").join("").split(",");
    return props.queries.filter((query, index) => {
      for (let f of F) {
        if (!searchableName.value[index].includes(f)) {
          return false;
        }
      }
      return true;
    });
  }

  return props.queries;
});

function onRefresh() {
  emit("refresh");
}

function onSelect(item) {
  emit("select", item);
}

</script>

<style scoped>

div.internals-queries-table {
  padding: 4px;
  height: calc(100% - 8px);
}

</style>

<style>

.value-hooks {
  min-width: 150px;
  color: var(--secondary-text);
  white-space: normal !important;
}

.value-traits {
  color: var(--secondary-text);
}

</style>

<style>

.value-query-expr {
  color: var(--secondary-text);
}

</style>
