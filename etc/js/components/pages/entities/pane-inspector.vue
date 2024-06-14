<template>
  <div id="pane-inspector" class="pane">
    <entity-inspector
      :conn="conn"
      :path="path"
      @abort="onAbort"
      @scriptOpen="onScriptOpen">
    </entity-inspector>
  </div>
</template>

<script>
export default { name: "pane-inspector" }
</script>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const emit = defineEmits(["abort", "scriptOpen"]);

const props = defineProps({
  conn: {type: Object, required: true},
  app_params: {type: Object, required: true}
});

const path = computed(() => {
  if (props.app_params.entity) {
    return props.app_params.entity.path;
  } else {
    return undefined;
  }
});

function onAbort(evt) {
  emit("abort", evt)
}

function onScriptOpen(evt) {
  emit("scriptOpen", evt)
}

</script>

<style scoped>
#pane-inspector {
  grid-column: 3;
  border-radius: var(--border-radius-medium);
  overflow: auto;
}
</style>
