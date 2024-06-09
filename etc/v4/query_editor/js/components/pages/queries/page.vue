<template>
  <div id="page-queries" class="page-content">
    <pane-query
      v-model:app_state="app_state"
      :conn="conn">
    </pane-query>

    <pane-inspect
      :app_state="app_state"
      :conn="conn">
    </pane-inspect>
  </div>
</template>

<script>
export default { name: "page-queries" };
</script>

<script setup>
import { defineProps, defineModel, computed } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true}
});

const app_state = defineModel("app_state");
</script>

<style scoped>
#page-queries {
  display: grid;
  grid-template-columns: calc(600px - 0.5rem) calc(100% - 600px);
  gap: 0.5rem;
}

@media screen and (max-width: 1280px) {
  #page-queries {
    grid-template-columns: calc(450px - 0.5rem) calc(100% - 450px);
  }
}

@media screen and (max-width: 800px) {
  #page-queries {
    grid-template-columns: calc(100%);
    grid-template-rows: calc(40vh - 2.0rem) calc(60vh - 2.5rem);
  }
}
</style>

<style>
div.queries-left-pane {
  grid-column: 1;
  grid-row: 1;
  height: calc(100vh - 4.5rem);
}

div.queries-right-pane {
  grid-column: 2;
  grid-row: 1;
  height: calc(100vh - 4.5rem);
}

@media screen and (max-width: 800px) {
  div.queries-left-pane {
    grid-column: 1;
    grid-row: 1;
    height: calc(40vh - 2.0rem);
  }

  div.queries-right-pane {
    grid-column: 1;
    grid-row: 2;
    height: calc(60vh - 3rem);
  }
}
</style>
