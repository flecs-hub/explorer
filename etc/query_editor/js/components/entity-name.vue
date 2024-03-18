<template>
  {{ entityName }}
</template>

<script>
export default { name: "entity-name" };
</script>

<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({
  path: {type: String, required: true}
});

const entityName = computed(() => {
  const names = props.path.split(".");
  return names.pop();
});

</script>

<style>
</style>
