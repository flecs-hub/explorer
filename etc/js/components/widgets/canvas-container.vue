<template>
  <div :style="canvasContainerStyle">
    <scene-canvas>
    </scene-canvas>
  </div>
</template>

<script>
export default { name: "canvas-container" };
</script>

<script setup>
import { ref, defineProps, onMounted, nextTick, watch } from 'vue';

const props = defineProps({
  app_params: {type: Object, required: true},
  app_state: {type: Object, required: true},
});

const canvasContainerStyle = ref();

onMounted(() => {
  window.addEventListener('resize', handleResize);
  window.dispatchEvent(new Event('resize'));
});

watch(() => [props.app_state.has3DCanvas, props.app_params.page,
             props.app_params.sidebar, props.app_params.entity.path,
             props.app_params.script], () =>
{
  nextTick(() => {
    window.dispatchEvent(new Event('resize'));
  });
});

const handleResize = () => {
  const el = document.getElementById("canvasPlaceholder");
  if (el) {
    var r = el.getBoundingClientRect();
    canvasContainerStyle.value =
      `position: absolute;
       width: ${r.width}px;
       height: ${r.height}px;
       top: ${r.top}px;
       left: ${r.left}px;`;
  } else {
    canvasContainerStyle.value = "display: none;";
  }
};

</script>

<style scoped>
</style>
