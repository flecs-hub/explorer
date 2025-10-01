<template>
  <div class="internals-components-table">
    <data-table :headers="headers" :data="filteredComponents" v-model:filter="filter" show_filter="true"></data-table>
  </div>
</template>

<script>
export default { name: "internals-components-table" };
</script>

<script setup>
import { defineProps, computed, ref } from 'vue';

const props = defineProps({
  components: {type: Array, required: true}
});

const filter = ref("");

const headers = computed(() => {
  return [
    {name: "Name", schema: ["entity"], get: (component) => component.name},
    {name: "Size", schema: ["int"], get: (component) => component.type ? component.type.size : 0},
    {name: "Alignment", schema: ["int"], get: (component) => component.type ? component.type.alignment : 0},
    {name: "Hooks", schema: ["hooks"], get: (component) => formatHooks(component)},
    {name: "Tables", schema: ["int"], get: (component) => component.tables.length},
    {name: "Entities", schema: ["int"], get: (component) => component.entity_count},
    {name: "Memory (KB)", schema: ["float"], totals: true, get: (component) => {
      if (!component.memory) {
        return 0;
      }
      return (component.memory.storage + explorer.calculateMemoryTotal(component.memory.component_index)) / 1000;
    }}
  ];
});

const searchableName = computed(() => {
  return props.components.map((component) => {
    let name = component.name;
    if (!component.name) {
      name = component.expr;
    }
    return name.toLowerCase().split(" ").join("");
  });
});

const filteredComponents = computed(() => {
  if (filter.value && filter.value.length > 0) {
    const F = filter.value.toLowerCase().split(" ").join("").split(",");
    return props.components.filter((component, index) => {
      for (let f of F) {
        if (!searchableName.value[index].includes(f)) {
          return false;
        }
      }
      return true;
    });
  }

  return props.components;
});

function formatHooks(component) {
  let result = [];
  if (component.type) {
    if (component.type.ctor) {
      result.push("ctor");
    }
    if (component.type.dtor) {
      result.push("dtor");
    }
    if (component.type.move || component.type.move_ctor) {
      result.push("move");
    }
    if (component.type.copy || component.type.copy_ctor) {
      result.push("copy");
    }
    if (component.type.on_add) {
      result.push("add");
    }
    if (component.type.on_set) {
      result.push("set");
    }
    if (component.type.on_replace) {
      result.push("replace");
    }
    if (component.type.on_remove) {
      result.push("remove");
    }
  }
  if (result.length === 0) {
    return "-";
  }
  return result.join(", ");
}

</script>

<style scoped>

div.internals-components-table {
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

</style>
