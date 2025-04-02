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
  // Store previous window dimensions to detect significant size changes
  let prevWidth = window.innerWidth;
  let prevHeight = window.innerHeight;

  // Enhanced resize handler that detects significant size changes
  const enhancedResizeHandler = () => {
    // Check if there's a significant change in window dimensions
    // This would indicate a change from minimized to maximized or vice versa
    const widthChange = Math.abs(window.innerWidth - prevWidth);
    const heightChange = Math.abs(window.innerHeight - prevHeight);
    const significantChange = widthChange > 200 || heightChange > 200;

    // Update previous dimensions
    prevWidth = window.innerWidth;
    prevHeight = window.innerHeight;

    // Call the regular resize handler
    handleResize();

    // If there's a significant change, trigger additional resize events with delays
    if (significantChange) {
      const delays = [100, 300, 500, 1000];
      delays.forEach(delay => {
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, delay);
      });
    }
  };

  // Add the enhanced resize handler
  window.addEventListener('resize', enhancedResizeHandler);

  // Initial resize event
  window.dispatchEvent(new Event('resize'));

  // Additional resize events with increasing delays to ensure canvas appears
  // This helps with minimized windows where the initial resize might not have valid dimensions
  const delays = [100, 300, 500, 1000];
  delays.forEach(delay => {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, delay);
  });
});

watch(() => [props.app_state.has3DCanvas, props.app_params.page,
             props.app_params.sidebar, props.app_params.entity.path,
             props.app_params.script], () =>
{
  // Use setTimeout to ensure DOM has fully updated before triggering resize
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 50);
});

const handleResize = () => {
  const el = document.getElementById("canvasPlaceholder");
  if (el) {
    var r = el.getBoundingClientRect();
    // Check if the bounding rectangle has valid dimensions
    if (r.width > 0 && r.height > 0) {
      canvasContainerStyle.value =
        `position: absolute;
         width: ${r.width}px;
         height: ${r.height}px;
         top: ${r.top}px;
         left: ${r.left}px;`;
    } else {
      // If dimensions are invalid, try again after a short delay
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
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
