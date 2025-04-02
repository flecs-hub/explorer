<template>
  <div :style="canvasContainerStyle" class="canvas-container">
    <div class="canvas-wrapper">
      <scene-canvas :preserveAspectRatio="true" :aspectRatio="aspectRatio">
      </scene-canvas>
    </div>
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
  aspectRatio: {type: Number, default: 16/9} // Default aspect ratio (width/height)
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
.canvas-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
}
</style>
