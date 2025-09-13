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
  return explorer.entityParent(props.path);
});

</script>

<style>
</style>
