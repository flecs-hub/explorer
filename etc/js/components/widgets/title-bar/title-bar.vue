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
    <div class="title-bar-controls">
      <play-control
        :conn="conn"
        :app_state="app_state">
      </play-control>
    </div>
    <url-bar
      :app_state="app_state"
      v-model:app_params="app_params">
    </url-bar>

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
  grid-template-columns: 2.5rem 300px 1fr 300px auto 0px;
  gap: var(--gap);
  font-size: 0.9rem;
}

div.title-bar-logo a {
  grid-column: 1;
}

div.title-bar-logo {
  grid-column: 1;
  display: grid;
  grid-template-columns: 1fr;
  padding: 2px;
}

div.title-bar-controls {
  grid-column: 2;
  text-align: center;
  padding: 4px;
}

div.title-info {
  display: flex;
  align-items: center;
}

div.title-bar-buttons {
  grid-column: 5;
  display: flex;
  justify-content: right;
  padding-left: 4px;
}

div.title-bar-buttons button {
  margin-left: 4px;
}

@media screen and (max-width: 1600px) {
  div.title-bar {
    grid-template-columns: 2.5rem 35px 1fr 10px auto 0px;
  }
}

@media screen and (max-width: 800px) {
  div.title-bar {
    grid-template-columns: 2.5rem 0px 1fr 0px auto 0px;
  }

  div.title-bar-v3 {
    display: none;
  }

  div.title-bar-controls {
    display: none;
  }
}

</style>
