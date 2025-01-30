<template>
  <div id="page-info" class="page-content">
    <pane-info :conn="conn" :app_state="app_state"></pane-info>
  </div>
</template>

<script>
export default { name: "page-info" };
</script>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  app_params: {type: Object, required: true},
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
