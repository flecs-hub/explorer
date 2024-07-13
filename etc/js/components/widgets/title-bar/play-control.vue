<template>
  <icon-button 
    :src="playIcon"
    :size="24"
    @click="toggle">
  </icon-button>
</template>

<script>
export default { name: "play-control" };
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  conn: {type: Object, required: true},
  app_state: {type: Object, required: true}
});

const isPaused = computed(() => {
  if (props.app_state.world_info) {
    return props.app_state.world_info.time_scale === 0;
  }
  return false;
});

const playIcon = computed(() => {
  if (!isPaused.value) {
    return "debug-pause";
  } else {
    return "play";
  }
});

function toggle() {
  if (isPaused.value) {
    props.conn.set("flecs.core.World", "flecs.stats.WorldSummary", { time_scale: 1.0 });
  } else {
    props.conn.set("flecs.core.World", "flecs.stats.WorldSummary", { time_scale: 0.0 });
  }
}

</script>

<style scoped>
</style>

