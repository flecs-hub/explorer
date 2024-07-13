<template>
  <icon :src="src" :class="cssClass" :size="size" :rotate="rotate"></icon>
</template>

<script>
export default { name: "icon-button" };
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  src: { type: String, required: true },
  class: { type: String, required: false, default: "" },
  size: { type: Number, required: false },
  rotate: { type: Number, required: false },
});

const cssClass = computed(() => {
  return props.class + " icon-clickable";
});

</script>

<style>

img.icon-clickable {
  opacity: 0.5;
  cursor: pointer;
}

img.icon-clickable:hover {
  opacity: 1.0;
}

</style>
