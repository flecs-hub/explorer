<template>
  <div :class="css" v-on:click="emit('click')">
    <div><entity-parent :path="path"></entity-parent></div>
    <div><entity-name :path="path"></entity-name></div>
  </div>
</template>

<script>
export default {
  name: "entity-list-item",
}
</script>

<script setup>
import { computed, defineProps, h } from 'vue';

const emit = defineEmits(['click']);

const props = defineProps({
  path: {type: String, required: true },
  index: {type: Number, required: false, default: 0},
  selected: {type: Number, required: false, default: -1},
});

const css = computed(() => {
  let classes = ['entity-list-item', 'noselect']
  if (props.index == props.selected) {
    classes.push('entity-list-item-selected');
  } else if ((props.index + 1) % 2 == 0) {
    classes.push('entity-list-item-alt');
  }
  return classes;
});

</script>

<style scoped>

div.entity-list-item {
  display: flex;
  flex-direction: column;
  position: relative;
  margin-bottom: 0em;
  padding: 0.5em;
  cursor: pointer;
  border-style: solid;
  border-width: 0px;
  border-bottom-width: 0px;
  background-color: var(--bg-content);
  border-left-width: 0px;
  border-color: var(--green);
  color: var(--primary-text);
  overflow-x: auto;
  transition: background-color var(--animation-duration), border-left-width var(--animation-duration);
}

div.entity-list-item:hover {
  background-color: var(--bg-content-hover);
}

div.entity-list-item-alt {
  background-color: var(--bg-content-alt);
}

div.entity-list-item-selected, div.entity-list-item-selected:hover {
  border-left-width: 0.25rem;
  background-color: var(--bg-content-select);
}

div.entity-list-item-highlight {
  background-color: var(--darker-blue);
}

</style>
