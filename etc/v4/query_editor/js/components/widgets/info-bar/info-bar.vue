<template>
  <div class="info-bar">
    <div class="build-version">
      <info-build-version :app_state="app_state"></info-build-version>
    </div>
    <div class="connected">
      <info-connected :app_state="app_state"></info-connected>
    </div>
    <div class="build-config">
      <info-build-config :app_state="app_state"></info-build-config>
    </div>
  </div>
</template>

<script>
export default { name: "info-bar" };
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  app_state: {type: Object, required: true}
});

const connected = computed(() => {
  return props.app_state.status == flecs.ConnectionStatus.Connected;
});

</script>

<style scoped>

div.info-bar {
  position: absolute;
  bottom: 0px;
  width: 100%;
  height: var(--footer-height);
  background-color: var(--bg-color-alt);
}

div.build-connected {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 40px;
}

div.build-config {
  position: absolute;
  top: 0px;
  right: 0px;
  width: 100px;
}

div.build-version {
  position: absolute;
  top: 0px;
  left: 0px;
  margin-left: calc(50% - 50px);
  width: 100px;
}

</style>
