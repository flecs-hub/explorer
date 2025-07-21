<template>
  <div :class="`build-version noselect`">flecs v{{ version }}</div>
</template>

<script>
export default { name: "info-build-version" };
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  app_state: {type: Object, required: true}
});

const version = computed(() => {
  const bi = props.app_state.build_info;
  if (bi) {
    return bi.version;
  } else {
    return "?.?.?";
  }
});

</script>

<style scoped>

div.build-version {
  padding-top: 2px;
  width: 100px;
  height: calc(var(--footer-height) - 2px);
  text-align: center;
  font-size: 0.9rem;
  color: var(--secondary-text);
}

</style>
