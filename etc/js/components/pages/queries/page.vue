<template>
  <div id="page-queries" :class="css">
    <pane-query
      v-model:app_params="app_params"
      :conn="conn"
      v-if="app_params.sidebar">
    </pane-query>

    <pane-inspect
      :app_params="app_params"
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
  conn: {type: Object, required: true},
  app_params: {type: Object, required: true},
});

const app_params = defineModel("app_params");

const css = computed(() => {
  let result = ["page-content"];
  if (!app_params.value.sidebar) {
    result.push("page-queries-no-sidebar");
  }
  return result;
});

</script>

<style scoped>
#page-queries {
  display: grid;
  grid-template-columns: calc(500px) calc(100% - 500px - var(--gap));
  gap: var(--gap);
}

@media screen and (max-width: 1200px) {
  #page-queries {
    grid-template-columns: calc(300px - var(--gap)) calc(100% - 300px);
  }
}

@media screen and (max-width: 800px) {
  #page-queries {
    grid-template-columns: calc(100%);
    grid-template-rows: calc(40vh - var(--header-height) - var(--gap)) calc(60vh - var(--footer-height) - var(--gap));
  }
}

@media screen and (max-width: 800px) {
  div.page-queries-no-sidebar div.queries-right-pane {
    grid-column: 1;
    grid-row: 1;
    height: calc(100vh - var(--header-height) - var(--footer-height) - 3 * var(--gap));
  }
}

</style>

<style>
div.queries-left-pane {
  grid-column: 1;
  grid-row: 1;
  height: calc(100vh - var(--header-height) - var(--footer-height) - 3 * var(--gap));
}

div.queries-right-pane {
  grid-row: 1;
  height: calc(100vh - var(--header-height) - var(--footer-height) - 3 * var(--gap));
}

@media screen and (max-width: 800px) {
  div.queries-left-pane {
    grid-column: 1;
    grid-row: 1;
    height: calc(40vh - - var(--header-height) - var(--gap));
  }

  div.queries-right-pane {
    grid-column: 1;
    grid-row: 2;
    height: calc(60vh - var(--footer-height) - 3 * var(--gap));
  }
}
</style>
