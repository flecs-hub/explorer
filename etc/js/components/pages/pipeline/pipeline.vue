<template>
  <div class="pipeline">
    <template v-for="segment in segments">
      <pipeline-segment :conn="conn" :segment="segment" :viewMode="viewMode">
      </pipeline-segment>
    </template>
  </div>
</template>

<script>
export default { name: "pipeline" };
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  systems: {type: Array, required: true},
  viewMode: {type: String, required: true},
  flecsMode: {type: String, required: true}
});

function systemFilter(system) {
  if (props.flecsMode == "hide_flecs") {
    if (!system.name) {
      return true;
    }

    if (system.name.slice(0, 6) == "flecs.") {
      return false;
    }
  }

  return true;
}

const segments = computed(() => {
  let segments = [];
  let curSegment = {systems: []};

  /* Default mode: visualize scheduler segments */
  if (props.viewMode == "default") {
    for (let system of props.systems) {
      if (!systemFilter(system)) continue;

      curSegment.systems.push(system);
      if (!system.name) {
        segments.push(curSegment);
        curSegment = {systems: []};
      }
    }

    if (curSegment.systems.length) {
      segments.push(curSegment);
    }

  /* Single list ordered by (avg) time spent */
  } else if (props.viewMode == "by_time") {
    for (let system of props.systems) {
      if (!systemFilter(system)) continue;
      curSegment.systems.push(system);
    }

    curSegment.systems.sort((a, b) => {
      return (a.time_spent_pct < b.time_spent_pct) - 
        (a.time_spent_pct > b.time_spent_pct);
    });

    segments.push(curSegment);

  /* Segment per module */
  } else if (props.viewMode == "by_module") {
    let modules = {};
    for (let system of props.systems) {
      if (!systemFilter(system)) continue;
      if (!system.name) {
        continue;
      }

      let elems = system.name.split(".");
      elems.pop();
      
      let parent;
      if (elems.length) {
        parent = elems.join(".");
      } else {
        parent = "root";
      }

      let module = modules[parent];
      if (!module) {
        module = modules[parent] = {name: parent, systems: []};
      }

      module.systems.push(system);
    }

    for (let module in modules) {
      segments.push(modules[module]);
    }
  }

  return segments;
});

</script>

<style scoped>
div.pipeline div.detail-toggle {
  width: 885px;
}
</style>
