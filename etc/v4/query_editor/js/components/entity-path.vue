<template>
  <span class="entity-path">
    <render/>
  </span>
</template>

<script>
export default { name: "entity-path" };
</script>

<script setup>
import { computed, defineProps, h } from 'vue';

const props = defineProps({
  path: {type: String, required: false}
});

const render = () => {
  let elems = [];
  if (!props.path) {
    return h('span', {}, 'root');
  }

  const names = props.path.split(".");
  let count = 0;
  for (const name of names) {
    if (count) {
      elems.push(h('span', {class: 'entity-path-sep'}, ' > '));
    }
    elems.push(h('span', {}, name));
    count ++;
  }

  return elems;
}

</script>

<style>
span.entity-path {
  font-size: 0.8em;
  color: var(--secondary-text);
  white-space: preserve;
}

span.entity-path-sep {
  color: var(--green);
  font-weight: 600;
}
</style>
