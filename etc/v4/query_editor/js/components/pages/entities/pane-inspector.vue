<template>
  <div id="pane-inspector" class="ace-github-dark">
    <entity-inspector
      :conn="conn"
      :path="path"
      @delete="onDelete">
    </entity-inspector>
  </div>
</template>

<script>
export default { name: "pane-inspector" }
</script>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const emit = defineEmits(["delete"]);

const props = defineProps({
  conn: {type: Object, required: true},
  app_state: {type: Object, required: true}
});

const path = computed(() => {
  if (props.app_state.entity) {
    return props.app_state.entity.path;
  } else {
    return undefined;
  }
});

function onDelete(evt) {
  emit("delete", evt)
}

</script>

<style scoped>
#pane-inspector {
  grid-column: 3;
  border-radius: var(--border-radius-medium);
  overflow: auto;
}
</style>
