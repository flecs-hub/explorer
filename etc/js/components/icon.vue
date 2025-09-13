<template>
  <div style="display: inline-block;">
    <img :style="style" :class="cssClass" :src="src"/>
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
  opacity: { type: Number, required: false },
  rotate: { type: Number, required: false, default: 0.0 },
  rotating: { type: Boolean, required: false, default: false },
});

const style = computed(() => {
  let result = `
    position: relative;
    width: ${props.size}px;
    height: ${props.size}px;
    transform: rotate(${props.rotate}deg);
    transition: transform 0.1s ease-out;
    vertical-align: middle;
    height: 100%;`;

  if (props.opacity !== undefined) {
    result += `
      opacity: ${props.opacity};
    `;
  }

  if (props.rotating) {
    result += `
      animation: spin 1s linear infinite;
    `;
  }

  return result;
});

const src = computed(() => {
  return `./img/icons/codicons-set/${props.src}.svg`;
});

const cssClass = computed(() => {
  return props.class + " noselect";
});

</script>

<style>

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

</style>
