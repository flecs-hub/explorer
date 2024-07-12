<template>
  <div :class="css()">&nbsp;</div>
  <div class="info-connection">
    <template v-if="connected">
      <icon src="remote"></icon>
    </template>
    <template v-else>
      <icon src="debug-disconnect"></icon>
    </template>
    {{ mode }}
  </div>
</template>

<script>
export default { name: "info-connected" };
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  app_state: {type: Object, required: true}
});

const connected = computed(() => {
  return props.app_state.status == flecs.ConnectionStatus.Connected;
});

const mode = computed(() => {
  if (props.app_state.mode == flecs.ConnectionMode.Wasm) {
    return "wasm";
  } else {
    return "remote";
  }
});

function css() {
  if (connected.value) {
    return "info-connection info-connected";
  } else {
    return "info-connection info-disconnected";
  }
}

</script>

<style scoped>

div.info-connection {
  position: absolute;
  top: 0px;
  padding-top: 2px;
  width: 100px;
  height: calc(var(--footer-height) - 2px);
  font-size: 0.9rem;
  text-align: center;
  color: var(--primary-text);
}

div.info-connected {
  background-color: var(--green);
  width: 100px;
  opacity: 0.5;
}

div.info-disconnected {
  background-color: var(--red);
  width: 100px;
  opacity: 0.5;
}

</style>
