<template>
  <div id="pane-inspector" class="ace-github-dark">
    <entity-inspector
      :conn="conn"
      :path="path">
    </entity-inspector>
  </div>
</template>

<script>
export default { name: "pane-inspector" }
</script>

<script setup>
import { defineProps, computed } from 'vue';

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

</script>

<style scoped>
#pane-inspector {
  grid-column: 3;
  border-radius: var(--border-radius-medium);
  overflow: auto;
}
</style>
