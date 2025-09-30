<template>
  <detail-toggle>
    <template v-slot:summary>
      <template v-if="viewMode == 'by_module'">
        <entity-path :path="segment.name"></entity-path>
      </template>
      <template v-else>
        {{ systemCount }} systems
        <template v-if="syncSystem">
          <span v-if="syncSystem.multi_threaded">
            , multithreaded
          </span>
          <span v-else>
            , singlethreaded
          </span>
          <span v-if="syncSystem.immediate">
            , immediate
          </span>
          <span v-else>
            , readonly
          </span>
        </template>
      </template>
    </template>
    <template v-slot:detail>
      <template v-for="(system, i) in systems" :key="i">
        <pipeline-system :conn="conn" :system="system"></pipeline-system>
      </template>
    </template>
  </detail-toggle>
</template>

<script>
export default { name: "pipeline-segment" };
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  segment: {type: Object, required: true},
  viewMode: {type: String, required: true}
});

const systems = computed(() => {
  return props.segment.systems;
});

const syncSystem = computed(() => {
  if (props.viewMode == 'default') {
    let count = systems.value.length;
    let sys = systems.value[count - 1];
    if (sys.name === undefined) {
      return sys;
    }
  }
  return undefined;
});

const systemCount = computed(() => {
  return props.segment.count;
});

</script>

<style scoped>
</style>
