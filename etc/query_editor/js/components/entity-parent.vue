<template>
  <span class="entity-parent">
    <render/>
  </span>
</template>

<script>
export default { name: "entity-parent" };
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
      elems.push(h('span', {class: 'entity-parent-sep'}, ' > '));
    }
    elems.push(h('span', {}, name));
    count ++;
  }

  return elems;
}

</script>

<style>
span.entity-parent {
  font-size: 0.8em;
  color: var(--secondary-text);
}

span.entity-parent-sep {
  color: var(--green);
  font-weight: 600;
}
</style>
