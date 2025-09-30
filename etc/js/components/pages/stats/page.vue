<template>
  <div id="page-stats" class="page-content">
    <edit-tabs :items="items">
      <template v-slot:world>
        <world-stats :conn="conn"></world-stats>
      </template>
      <template v-slot:systems>
        <pipeline-stats :conn="conn" v-model:app_params="app_params"></pipeline-stats>
      </template>
    </edit-tabs>
  </div>
</template>

<script>
export default { name: "page-stats" };
</script>

<script setup>
import { defineProps, computed, defineModel } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true}
});

const app_params = defineModel("app_params");

const items = computed(() => {
  let result = [];

  result.push({
    label: "World",
    value: "world",
    canClose: false
  });

  result.push({
    label: "Systems",
    value: "systems",
    canClose: false
  });

  return result;
});

</script>

<style scoped>

</style>
