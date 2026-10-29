<template>
  <div class="term-tree">
    <div class="term-dim" v-if="!nodes.length">(empty)</div>
    <div class="term-tree-line" v-for="(l, i) in visible" :key="i">
      <span class="term-tree-guide noselect">{{ l.prefix }}</span><terminal-entity
        :path="l.entity" :scope="scope" :label="shortName(l.entity)">
      </terminal-entity>
    </div>
    <div v-if="lines.length > limit">
      <span class="term-more" @click.stop="limit = lines.length">&hellip; show {{ lines.length - limit }} more</span>
    </div>
    <div class="term-count" v-if="nodes.length > 1">{{ nodes.length }} entities</div>
  </div>
</template>

<script>
export default { name: "terminal-tree" };
</script>

<script setup>
import { defineProps, computed, ref } from 'vue';

const props = defineProps({
  nodes: { type: Array, required: true },
  scope: { type: String, required: false }
});

const T = flecsTerminal;
const limit = ref(300);

const lines = computed(() => T.treeLines(props.nodes));
const visible = computed(() => lines.value.slice(0, limit.value));

function shortName(path) {
  return T.shortName(path);
}
</script>

<style>
#page-terminal div.term-tree-line {
  white-space: pre;
}

#page-terminal span.term-tree-guide {
  color: var(--border);
}
</style>
