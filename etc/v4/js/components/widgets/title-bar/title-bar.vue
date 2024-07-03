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
    <div class="title-info-right">
      <refresh-control 
        :conn="conn" 
        v-model:app_params="app_params">
      </refresh-control>
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
  grid-template-columns: 2.5rem 1fr 30rem 1fr 2.5rem;
  gap: var(--gap);
  font-size: 0.9rem;
}

div.title-bar-logo a {
  grid-column: 1;
}

div.title-bar-controls {
  grid-column: 2;
  text-align: center;
  padding: 4px;
}

div.title-bar-logo {
  display: grid;
  grid-template-columns: 1fr;
  grid-column: 1;
  padding: 2px;
}

div.title-info {
  display: flex;
  align-items: center;
}

div.title-info-right {
  grid-column: 4;
  position: absolute;
  right: var(--gap);
  height: var(--header-height);
}

@media screen and (max-width: 800px) {
  div.title-bar {
    display: grid;
    grid-template-columns: 2.5rem 0px 1fr 0px;
  }

  div.title-info-right {
    display: none;
  }
}

</style>
