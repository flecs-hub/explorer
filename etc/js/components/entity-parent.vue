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
  const path = props.path.replaceAll("\\\.", "@@");
  const names = path.split(".");
  names.pop();
  return names.join(".").replaceAll("@@", ".");
});

</script>

<style>
</style>
