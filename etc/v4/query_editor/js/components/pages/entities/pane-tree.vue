<template>
  <div id="pane-tree" class="ace-github-dark">
    <entity-tree :conn="conn"></entity-tree>
  </div>
</template>

<script>
export default { name: "pane-tree" }
</script>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true}
});

</script>

<style scoped>
#pane-tree {
  display: grid;
  grid-template-rows: 100%;
  gap: 0.5rem;
  border-radius: var(--border-radius-medium);
  overflow: auto;
}
</style>
