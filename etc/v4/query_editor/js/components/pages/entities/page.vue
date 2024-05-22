<template>
  <div id="page-entities" class="page-content">
    <pane-tree :conn="conn"></pane-tree>
  </div>
</template>

<script>
export default { name: "page-entities" };
</script>

<script setup>
import { defineProps, ref } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  app_state: {type: Object, required: true}
});

</script>

<style scoped>
#page-entities {
  display: grid;
  grid-template-columns: 350px calc(100% - 350px - 0.5rem);
  gap: 0.5rem;
  height: calc(100vh - 57px);
}
</style>
