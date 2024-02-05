<template>
  <span class="entity-parent">
    {{  path_str }}
  </span>
</template>

<script>
export default { name: "entity-parent" };
</script>

<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({
  path: {type: String, required: true}
});

const path_str = computed(() => {
  let elems = props.path.split(".");
  return elems.join(" > ");
});

</script>

<style scoped>
span.entity-parent {
  font-size: 0.8em;
  color: var(--primary-text);
}
</style>
