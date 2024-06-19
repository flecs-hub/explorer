<template>
  <entity-path :path="parent"></entity-path>
</template>

<script>
export default { name: "entity-parent" };
</script>

<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({
  path: {type: String, required: true}
});

const parent = computed(() => {
  const names = props.path.split(".");
  names.pop();
  return names.join(".");
});

</script>

<style>
</style>
