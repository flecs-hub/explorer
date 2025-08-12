<template>
  <div id="pane-inspector" class="pane">
    <entity-inspector
      :conn="conn"
      :path="path"
      v-model:inspector_mode="appParams.inspector_mode"
      @abort="onAbort"
      @scriptOpen="onScriptOpen"
      @selectEntity="onSelectEntity">
    </entity-inspector>
  </div>
</template>

<script>
export default { name: "pane-inspector" }
</script>

<script setup>
import { defineProps, defineEmits, defineModel, computed } from 'vue';

const emit = defineEmits(["abort", "scriptOpen", "selectEntity"]);

const props = defineProps({
  conn: {type: Object, required: true}
});

const appParams = defineModel("app_params");

const path = computed(() => {
  if (appParams.value) {
    return appParams.value.path;
  } else {
    return undefined;
  }
});

function onAbort(evt) {
  emit("abort", evt)
}

function onScriptOpen(evt) {
  emit("scriptOpen", evt ? evt.path : undefined);
}

function onSelectEntity(evt) {
  emit("selectEntity", evt);
}

</script>

<style scoped>
#pane-inspector {
  height: calc(100% - 2px);
  /* overflow: auto; */
}
</style>
