<template>
  <div :class="css()">&nbsp;</div>
  <div class="info-connection">
    <template v-if="connected">
      <icon src="remote"></icon>
    </template>
    <template v-else>
      <icon src="debug-disconnect"></icon>
    </template>
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
  width: 40px;
  height: calc(1.5rem - 2px);
  font-size: 0.9rem;
  text-align: center;
}

div.info-connected {
  background-color: var(--green);
  width: 40px;
  opacity: 0.5;
}

div.info-disconnected {
  background-color: var(--red);
  width: 40px;
  opacity: 0.5;
}

</style>
