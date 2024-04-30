<template>
  <div style="display: inline-block;">
    <img :style="style" :class="class" :src="src"/>
  </div>
</template>

<script>
export default { name: "icon" };
</script>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  src: { type: String, required: true },
  class: { type: String, required: false, default: ""},
  size: { type: Number, required: false, default: 16 },
  opacity: { type: Number, required: false, default: 0.7 },
  rotate: { type: Number, required: false, default: 0.0 },
});

const style = computed(() => {
  return `
    position: relative;
    width: ${props.size}px;
    height: ${props.size}px;
    opacity: ${props.opacity};
    transform: rotate(${props.rotate}deg);
    vertical-align: middle;
    height: 100%;
    `;
});

const src = computed(() => {
  return `./img/icons/codicons-set/${props.src}.svg`;
});

</script>

<style>
</style>
