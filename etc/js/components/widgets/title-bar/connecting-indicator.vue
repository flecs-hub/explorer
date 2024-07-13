<template>
  <div :class="css">
  </div>
</template>

<script>
export default { name: "connecting-indicator" };
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  app_state: {type: Object, required: true}
});

const isConnecting = computed(() => {
  let status = props.app_state.status;
  if (status == flecs.ConnectionStatus.Initializing) {
    return true;
  } else if (status == flecs.ConnectionStatus.RetryConnecting) {
    return true;
  }
  return false;
});

const css = computed(() => {
  let classes = ["connecting-indicator-line"];

  if (!isConnecting.value) {
    classes.push("connecting-indicator-line-hidden")
  }

  return classes;
});

</script>

<style scoped>

div.connecting-indicator-line {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background-color: var(--green);
    z-index: 9999;
    animation: loading-animation 2s linear infinite;
}

div.connecting-indicator-line-hidden {
  display: none;
}

@keyframes loading-animation {
    0% {
        left: -100%;
        width: 100%;
    }
    100% {
        left: 100%;
        width: 100%;
    }
}

</style>

