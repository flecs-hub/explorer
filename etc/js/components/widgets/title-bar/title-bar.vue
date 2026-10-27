<template>
  <div class="top-bar title-bar">
    <connecting-indicator
      :app_state="app_state">
    </connecting-indicator>
    <div class="title-bar-logo">
      <a
        class="flecs-logo" 
        href="https://github.com/SanderMertens/flecs" 
        target="_blank">
      </a>
    </div>
    <host-tabs
      :app_state="app_state"
      v-model:app_params="app_params">
    </host-tabs>

    <div class="title-bar-buttons">
      <layout-control
        v-model:app_params="app_params">
      </layout-control>
    </div>
  </div>
</template>

<script>
export default { name: "title-bar" };
</script>

<script setup>
import { defineProps, defineModel } from 'vue';

defineProps({
  conn: {type: Object, required: true},
  app_state: {type: Object, required: true}
});

const app_params = defineModel("app_params");

</script>

<style scoped>

div.title-bar {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr) auto;
  grid-template-rows: minmax(0, 1fr);
  gap: var(--gap);
  font-size: 0.9rem;
}

div.title-bar-logo {
  grid-column: 1;
  display: grid;
  grid-template-columns: 1fr;
  padding: 2px;
}

div.title-bar-buttons {
  grid-column: 3;
  display: flex;
  justify-content: right;
  padding-left: 4px;
}

div.title-bar-buttons button {
  margin-left: 4px;
}

</style>
