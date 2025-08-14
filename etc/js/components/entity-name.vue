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
  return explorer.shortenEntity(props.path);
});

</script>

<style>
</style>
