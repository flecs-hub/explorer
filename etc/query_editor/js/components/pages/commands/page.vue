<template>
  <div id="page-commands" class="page-content">
    <commands-pane-header
      :conn="conn"
      :app_state="app_state"
      v-on:capture="onCapture">
    </commands-pane-header>
    <commands-pane-inspect
      :conn="conn"
      ref="pane_inspect">
    </commands-pane-inspect>
  </div>
</template>

<script>
export default { name: "page-commands" };
</script>

<script setup>
import { defineProps, ref } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  app_state: {type: Object, required: true}
});

const pane_inspect = ref();

const onCapture = () => {
  pane_inspect.value.requestCapture();
}

</script>

<style scoped>
#page-commands {
  display: grid;
  grid-template-rows: 50px calc(100% - 50px - 0.5rem);
  gap: 0.5rem;
  height: calc(100vh - 57px);
}
</style>
