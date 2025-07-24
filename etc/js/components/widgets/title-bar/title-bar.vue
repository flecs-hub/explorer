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
    <div class="title-info-right-1">
      <refresh-control 
        :conn="conn" 
        v-model:app_params="app_params">
      </refresh-control>
    </div>
    <div class="title-info-right-2">
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

const props = defineProps({
  conn: {type: Object, required: true},
  app_state: {type: Object, required: true}
});

const app_params = defineModel("app_params");

</script>

<style scoped>

div.title-bar {
  display: grid;
  grid-template-columns: 2.5rem 300px 1fr 300px auto 2.5rem;
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

div.title-info-right-1 {
  grid-column: 5;
}

div.title-info-right-2 {
  grid-column: 6;
}

@media screen and (max-width: 1600px) {
  div.title-bar {
    grid-template-columns: 2.5rem 35px 1fr 10px auto 2.5rem;
  }
}

@media screen and (max-width: 800px) {
  div.title-bar {
    grid-template-columns: 2.5rem 0px 1fr 0px auto 2.5rem;
  }

  div.title-info-right-1 {
    display: none;
  }

  div.title-bar-v3 {
    display: none;
  }

  div.title-bar-controls {
    display: none;
  }
}

</style>
