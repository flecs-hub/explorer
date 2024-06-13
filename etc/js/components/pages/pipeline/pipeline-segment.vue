<template>
  <detail-toggle>
    <template v-slot:summary>
      <template v-if="viewMode == 'by_module'">
        <entity-path :path="segment.name"></entity-path>
      </template>
      <template v-else>
        {{ systemCount }} systems
        <template v-if="syncSystem">
          <span v-if="syncSystem.multithreaded">
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
        <pipeline-system :system="system"></pipeline-system>
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
  segment: {type: Object, required: true},
  viewMode: {type: String, required: true}
});

const systems = computed(() => {
  return props.segment.systems;
});

const syncSystem = computed(() => {
  if (props.viewMode == 'default') {
    let count = systems.value.length;
    if (systems.value[count - 1].name === undefined) {
      return syncSystem;
    }
  }
});

const systemCount = computed(() => {
  let count = systems.value.length;
  if (syncSystem.value) {
    count --;
  }
  return count;
})

</script>

<style scoped>

div.segment {
  border-style: solid;
  border-width: 1px;
  border-color: var(--border);
  border-radius: var(--border-radius-medium);
  margin-bottom: 8px;
  padding-bottom: 4px;
  /* background-color: var(--bg-content-alt); */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

div.segment-header {
  margin: 4px;
  padding: 4px;
  background-color: var(--bg-button-alt);
  border-radius: var(--border-radius-small);
  color: var(--secondary-text);
  font-size: 0.9rem;
}

</style>
