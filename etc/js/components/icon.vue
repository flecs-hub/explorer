<template functional>
  <svg class="icon-obj" :width="size" :height="size">
    <use :href="`./img/icons/${icon.split(':')[0]}.svg#${icon.split(':')[1]}`"/>
  </svg>
</template>

<script>
/*
  Icon component provides a base icon object that can be sourced from several iconsets.

  Component is functional
*/

module.exports = {
  name: "icon",
  props: {
    icon: { type: String, required: true },
    // expected format: "set:name"
    size: { type: Number, required: false, default: 16 },
  }
}
</script>

<style scoped>

.icon-obj {
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
  overflow: visible;
  z-index: 1;

  /* Preempts SVG jitter bug in Safari */
  -webkit-backface-visibility: hidden;
  -webkit-perspective: 1000;
  -webkit-font-smoothing: antialiased;
  -webkit-transform-style: preserve-3d;
  -webkit-transform: translateZ(0); 
}

</style>
