<template>
  <div id="page-info" class="page-content">
    <template v-if="isActive">
      <pane-info :app_state="app_state"></pane-info>
    </template>
  </div>
</template>

<script>
export default { name: "page-info" };
</script>

<script setup>
import { defineProps, defineModel, computed } from 'vue';

const props = defineProps({
  page: {type: String, required: true},
  app_state: {type: Object, required: true}
});

const isActive = computed(() => {
  return props.page == "info";
});
</script>

<style scoped>
#page-info {
  display: grid;
}
</style>
