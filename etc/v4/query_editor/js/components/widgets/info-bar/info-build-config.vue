<template>
  <div :class="`build-config build-config-${config}`">{{ config }}</div>
  <div :class="`build-config build-config-${config}-text noselect`">{{ config }}</div>
</template>

<script>
export default { name: "info-build-config" };
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  app_state: {type: Object, required: true}
});

const config = computed(() => {
  const wi = props.app_state.world_info;
  if (!wi) {
    return {};
  }

  const bi = wi.build_info;
  if (bi) {
    if (bi.sanitize) {
      return "sanitize";
    } else if (bi.debug) {
      return "debug";
    } else {
      return "release";
    }
  } else {
    return undefined;
  }
});

</script>

<style scoped>

div.build-config {
  position: absolute;
  padding-top: 2px;
  width: 100px;
  height: calc(1.5rem - 2px);
  font-size: 0.9rem;
  text-align: center;
}

div.build-config-sanitize {
  background-color: var(--red);
  opacity: 0.5;
}

div.build-config-debug {
  background-color: var(--orange);
  opacity: 0.5;
}

div.build-config-release {
  background-color: var(--green);
  opacity: 0.5;
}

div.build-config-sanitize-text {
  color: var(--primary-text);
}

div.build-config-debug-text {
  color: var(--primary-text);
}

div.build-config-release-text {
  color: var(--primary-text);
}

</style>
