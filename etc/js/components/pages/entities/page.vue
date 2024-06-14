<template>
  <div id="page-entities" :class="pageCss()">
    <pane-tree 
      :conn="conn"
      v-model:app_params="appParams">
    </pane-tree>
    <pane-scripts
      :conn="conn"
      v-model:scripts="appParams.scripts"
      ref="pane_scripts">
    </pane-scripts>
    <pane-inspector 
      :conn="conn"
      :app_params="appParams"
      @abort="onAbort"
      @scriptOpen="onScriptOpen">
    </pane-inspector>
  </div>
</template>

<script>
export default { name: "page-entities" };
</script>

<script setup>
import { defineProps, defineModel, ref } from 'vue';

const pane_scripts = ref(null);

const props = defineProps({
  conn: {type: Object, required: true},
  app_state: {type: Object, required: true},
});

const appParams = defineModel("app_params");

function onAbort(evt) {
  appParams.value.entity.path = undefined;
}

function onScriptOpen(evt) {
  pane_scripts.value.openScript(evt);
}

function pageCss() {
  let classes = ["page-content"];
  if (appParams.value.entity.path) {
    classes.push("page-entities-show-inspector");
  }
  return classes;
}

</script>

<style scoped>
#page-entities {
  display: grid;
  grid-template-columns: 300px calc(100% - 300px - var(--gap)) 0px;
  gap: var(--gap);
  height: calc(100vh - var(--header-height) - var(--footer-height) - 3 * var(--gap));
}

div.page-entities-show-inspector {
  grid-template-columns: 300px calc(100% - 300px - 450px - 2 * var(--gap)) 450px !important;
}
</style>
