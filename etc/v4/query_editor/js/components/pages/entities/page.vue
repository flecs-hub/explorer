<template>
  <div id="page-entities" class="page-content">
    <pane-tree 
      :conn="conn"
      v-model:app_state="appState">
    </pane-tree>
    <pane-inspector 
      :conn="conn"
      :app_state="appState"
      @abort="onAbort">
    </pane-inspector>
  </div>
</template>

<script>
export default { name: "page-entities" };
</script>

<script setup>
import { defineProps, defineModel } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
});

const appState = defineModel("app_state");

function onAbort(evt) {
  appState.value.entity.path = undefined;
}

</script>

<style scoped>
#page-entities {
  display: grid;
  grid-template-columns: 300px calc(100% - 300px - 450px - 1.0rem) 450px;
  gap: 0.5rem;
  height: calc(100vh - var(--header-height) - var(--footer-height) - 3 * var(--gap));
}
</style>
