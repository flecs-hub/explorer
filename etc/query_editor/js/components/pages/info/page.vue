<template>
  <div id="page-info" class="page-content">
    <pane-info :app_state="app_state"></pane-info>
  </div>
</template>

<script>
export default { name: "page-info" };
</script>

<script setup>
import { defineProps, defineModel, computed } from 'vue';

const props = defineProps({
  app_state: {type: Object, required: true}
});
</script>

<style scoped>
#page-info {
  display: grid;
  height: 100%;
  overflow-y: auto;
}
</style>
