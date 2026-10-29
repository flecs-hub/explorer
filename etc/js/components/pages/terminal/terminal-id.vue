<template>
  <span class="term-id">
    <span class="term-dim" v-if="!elems.length">(none)</span>
    <terminal-entity v-else-if="elems.length === 1"
      :path="elems[0]" :scope="scope" :label="short ? shortName(elems[0]) : undefined"
      kind="component">
    </terminal-entity>
    <template v-else>
      <span class="term-punct">(</span><terminal-entity
        :path="elems[0]" :scope="scope" :label="short ? shortName(elems[0]) : undefined"
        kind="component"></terminal-entity><span
        class="term-punct">, </span><terminal-entity
        :path="elems[1]" :scope="scope" :label="short ? shortName(elems[1]) : undefined"
        kind="component"></terminal-entity><span
        class="term-punct">)</span>
    </template>
  </span>
</template>

<script>
export default { name: "terminal-id" };
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  id: { required: false },
  scope: { type: String, required: false },
  short: { type: Boolean, required: false, default: false }
});

const T = flecsTerminal;

const elems = computed(() => {
  const id = props.id;
  if (Array.isArray(id)) {
    return id.filter((e) => e !== undefined && e !== null);
  }
  if (id === undefined || id === null || T.isRoot(id)) {
    return [];
  }
  return [String(id)];
});

function shortName(path) {
  return T.shortName(path);
}
</script>

<style>
#page-terminal span.term-id {
  white-space: nowrap;
}
</style>
