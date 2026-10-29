<template>
  <div class="term-entities">
    <div class="term-dim" v-if="!entities.length && command !== 'ls'">no matches</div>
    <div class="term-entities-grid" :style="gridStyle" v-if="entities.length">
      <terminal-entity v-for="e in visible" :key="e"
        :path="e" :scope="scope" :label="label(e)">
      </terminal-entity>
    </div>
    <div v-if="entities.length > limit">
      <span class="term-more" @click.stop="limit = entities.length">&hellip; show {{ entities.length - limit }} more</span>
    </div>
    <div class="term-count" v-if="command !== 'ls' && entities.length > 1">{{ entities.length }} entities</div>
  </div>
</template>

<script>
export default { name: "terminal-entities" };
</script>

<script setup>
import { defineProps, computed, ref } from 'vue';

const props = defineProps({
  entities: { type: Array, required: true },
  scope: { type: String, required: false },
  command: { type: String, required: false }
});

const T = flecsTerminal;
const limit = ref(300);

const visible = computed(() => props.entities.slice(0, limit.value));

const sameParent = computed(() => {
  if (!props.entities.length) {
    return true;
  }
  const parent = explorer.entityParent(props.entities[0]);
  return props.entities.every((e) => explorer.entityParent(e) === parent);
});

function label(path) {
  return sameParent.value ? T.shortName(path) : T.relativePath(path, props.scope);
}

const gridStyle = computed(() => {
  let width = 4;
  for (const e of visible.value) {
    width = Math.max(width, label(e).length);
  }
  width = Math.min(width + 2, 48);
  return `grid-template-columns: repeat(auto-fill, minmax(${width}ch, max-content));`;
});
</script>

<style>
#terminal-pane div.term-entities-grid {
  display: grid;
  column-gap: 2ch;
}

#terminal-pane div.term-entities-grid span.term-entity {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
